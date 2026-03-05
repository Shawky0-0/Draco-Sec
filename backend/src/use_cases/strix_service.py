"""
Strix Integration Service for DracoSec Offensive Security

This service manages the execution of Strix penetration testing scans,
integrating directly with the StrixAgent Python API for structured event handling.

Strix 0.7.0 Tracer API (actual method names):
  - log_agent_creation(agent_id, name, task, parent_id)
  - log_chat_message(content, role, agent_id, metadata)
  - log_tool_execution_start(agent_id, tool_name, args) -> int
  - update_tool_execution(execution_id, status, result)
  - update_agent_status(agent_id, status, error_message)
  - add_vulnerability_report(title, content, severity)  -> calls vulnerability_found_callback
  - set_final_scan_result(content, success)
"""
import asyncio
import json
import os
import logging
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, AsyncGenerator

from ..infrastructure.models import OffensiveScan, Vulnerability, AgentEvent
from ..infrastructure.database import SessionLocal

# Import Strix Libraries (from venv)
try:
    from strix.agents.StrixAgent import StrixAgent
    from strix.telemetry.tracer import Tracer, set_global_tracer
    from strix.llm.config import LLMConfig
    STRIX_AVAILABLE = True
except ImportError:
    STRIX_AVAILABLE = False
    StrixAgent = None
    set_global_tracer = None
    LLMConfig = None
    class Tracer:
        def __init__(self, *args, **kwargs): pass

logger = logging.getLogger(__name__)


class DracoTracer(Tracer):
    """
    Custom Tracer for Strix 0.7.0 that mirrors ALL agent events into DracoSec DB.

    Override targets (Strix 0.7.0 actual method names):
      - log_agent_creation  → event_type='agent_created'
      - log_chat_message    → event_type='chat'
      - log_tool_execution_start → event_type='tool_start'
      - update_tool_execution    → event_type='tool_update'
      - update_agent_status      → event_type='status'
      + vulnerability_found_callback → saves Vulnerability row
    """

    def __init__(self, run_name: str, scan_id: int):
        super().__init__(run_name)
        self.scan_id = scan_id

    def _get_db(self):
        return SessionLocal()

    # ──────────────────────────────────────────────────────────────
    # Agent Creation (new agent or sub-agent spawned)
    # ──────────────────────────────────────────────────────────────
    def log_agent_creation(
        self,
        agent_id: str,
        name: str,
        task: str,
        parent_id: Optional[str] = None,
    ) -> None:
        """Override: capture every agent (root + sub-agents) as it is created."""
        super().log_agent_creation(agent_id, name, task, parent_id)
        self._save_event(agent_id, "agent_created", {
            "agent_id": agent_id,
            "name": name,
            "task": task,
            "parent_id": parent_id,
        })

    # ──────────────────────────────────────────────────────────────
    # Chat messages (LLM reasoning output)
    # ──────────────────────────────────────────────────────────────
    def log_chat_message(
        self,
        content: str,
        role: str,
        agent_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> int:
        """Override: capture every LLM assistant message."""
        msg_id = super().log_chat_message(content, role, agent_id, metadata)
        self._save_event(agent_id or "strix", "chat", {
            "role": role,
            "content": content,
            "metadata": metadata or {},
        })
        return msg_id

    # ──────────────────────────────────────────────────────────────
    # Tool execution — start
    # ──────────────────────────────────────────────────────────────
    def log_tool_execution_start(
        self,
        agent_id: str,
        tool_name: str,
        args: Dict[str, Any],
    ) -> int:
        """Override: capture tool invocation start."""
        exec_id = super().log_tool_execution_start(agent_id, tool_name, args)
        self._save_event(agent_id, "tool_start", {
            "tool": tool_name,
            "args": args,
            "execution_id": exec_id,
        })
        return exec_id

    # ──────────────────────────────────────────────────────────────
    # Tool execution — result
    # ──────────────────────────────────────────────────────────────
    def update_tool_execution(
        self,
        execution_id: int,
        status: str,
        result: Optional[Any] = None,
    ) -> None:
        """Override: capture tool result / output."""
        super().update_tool_execution(execution_id, status, result)

        # Resolve agent_id from internal dict
        agent_id = "strix"
        if execution_id in self.tool_executions:
            agent_id = self.tool_executions[execution_id].get("agent_id", "strix")

        # Serialize result safely
        result_str = _safe_serialize(result)

        self._save_event(agent_id, "tool_update", {
            "execution_id": execution_id,
            "status": status,
            "result": result_str,
        })

        # Also try to emit live LLM stats
        try:
            stats = self.get_total_llm_stats()
            stats["agents_count"] = len(self.agents)
            stats["tools_count"] = self.get_real_tool_count()
            self._save_event("system", "stats", stats)
        except Exception as e:
            logger.debug(f"Stats emit skipped: {e}")

    # ──────────────────────────────────────────────────────────────
    # Agent status changes
    # ──────────────────────────────────────────────────────────────
    def update_agent_status(
        self,
        agent_id: str,
        status: str,
        error_message: Optional[str] = None,
    ) -> None:
        """Override: capture agent state transitions."""
        super().update_agent_status(agent_id, status, error_message)
        self._save_event(agent_id, "status", {
            "status": status,
            "error": error_message,
        })

    # ──────────────────────────────────────────────────────────────
    # Final scan report (called by finish_scan tool)
    # ──────────────────────────────────────────────────────────────
    def set_final_scan_result(self, content: str, success: bool = True) -> None:
        """Override: persist the final pentest report markdown to DB."""
        super().set_final_scan_result(content, success)
        db = self._get_db()
        try:
            scan = db.query(OffensiveScan).filter(OffensiveScan.id == self.scan_id).first()
            if scan:
                scan.final_report_md = content.strip()
                db.commit()
            self._save_event("system", "final_report", {
                "success": success,
                "report_length": len(content),
            })
        except Exception as e:
            logger.error(f"DracoTracer.set_final_scan_result DB save error: {e}")
            db.rollback()
        finally:
            db.close()

    # ──────────────────────────────────────────────────────────────
    # Internal helper
    # ──────────────────────────────────────────────────────────────
    def _save_event(self, agent_id: str, event_type: str, data: Dict[str, Any]):
        """Persist a single event to the DB."""
        db = self._get_db()
        try:
            event = AgentEvent(
                scan_id=self.scan_id,
                agent_id=agent_id,
                event_type=event_type,
                content=json.dumps(data),
                timestamp=datetime.now(timezone.utc),
            )
            db.add(event)
            db.commit()
        except Exception as e:
            logger.error(f"DracoTracer._save_event error: {e}")
            db.rollback()
        finally:
            db.close()


def _safe_serialize(value: Any) -> str:
    """Turn any tool result into a JSON-serializable string."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if hasattr(value, "to_dict"):
        try:
            return json.dumps(value.to_dict())
        except Exception:
            pass
    if isinstance(value, (dict, list)):
        try:
            return json.dumps(value)
        except Exception:
            pass
    return str(value)


class StrixService:
    """Service for managing Strix penetration testing scans."""

    def __init__(self):
        self.strix_results_dir = Path(os.getenv("STRIX_RESULTS_DIR", "./strix_runs"))
        self.strix_results_dir.mkdir(exist_ok=True)
        self.active_scans: Dict[int, asyncio.Task] = {}
        self.tracers: Dict[int, DracoTracer] = {}

    async def start_scan(
        self,
        scan_id: int,
        target: str,
        methodology: str,
        scope: str,
        db: Session,
    ) -> Dict[str, Any]:
        """Start a new Strix scan using the Python API."""

        if not STRIX_AVAILABLE:
            return {"success": False, "error": "Strix libraries not installed in backend environment."}

        try:
            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if not scan:
                raise ValueError(f"Scan {scan_id} not found")

            run_name = f"dracosec_{scan_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # Map methodology name → Strix scan_mode
            # Also handles custom methodologies via keyword matching
            mode_map = {
                "Quick Scan": "quick",
                "Standard": "standard",
                "Deep Analysis": "deep",
                "Blackbox": "deep",
                "Whitebox": "deep",
                "Web Application": "deep",
                "Web Application Pentest": "deep",
                "API Security": "deep",
                "API Security Testing": "deep",
                "Network Pentest": "deep",
                "OWASP Top 10": "deep",
            }
            scan_mode = mode_map.get(methodology, None)
            if not scan_mode:
                # Keyword fallback for custom methodologies
                ml = methodology.lower()
                if any(k in ml for k in ["quick", "fast", "recon"]):
                    scan_mode = "quick"
                elif any(k in ml for k in ["deep", "full", "pentest", "api", "network", "blackbox", "whitebox", "owasp"]):
                    scan_mode = "deep"
                else:
                    scan_mode = "standard"

            llm_config = LLMConfig(scan_mode=scan_mode)

            agent_config = {
                "llm_config": llm_config,
                "max_iterations": 300,
                "non_interactive": True,
            }

            # Detect target type
            import re
            is_ip = re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", target)
            if is_ip:
                target_data = {"type": "ip_address", "details": {"target_ip": target}}
            else:
                target_data = {"type": "web_application", "details": {"target_url": target}}

            # ── Build user_instructions: inject methodology description ──────────
            # Load the methodology description from the DB so Strix knows
            # exactly what the operator intends this scan to focus on.
            from ..infrastructure.models import ScanMethodology
            methodology_obj = db.query(ScanMethodology).filter(
                ScanMethodology.title == methodology
            ).first()
            methodology_instructions = ""
            if methodology_obj and methodology_obj.description:
                methodology_instructions = (
                    f"## Operator-Defined Methodology: {methodology_obj.title}\n"
                    f"{methodology_obj.description.strip()}\n\n"
                    f"Follow the above methodology strictly when deciding which vulnerabilities "
                    f"to test and in what order.\n\n"
                )
            base_instructions = scope.strip() if scope else ""
            combined_instructions = methodology_instructions + base_instructions

            scan_config = {
                "scan_id": run_name,
                "targets": [target_data],
                "user_instructions": combined_instructions,
                "run_name": run_name,
                "max_iterations": 300,
            }

            # Set up DracoTracer
            tracer = DracoTracer(run_name, scan_id)

            # ✅ CRITICAL: Set scan_config on tracer BEFORE launching agent
            # (BaseAgent.__init__ reads tracer.scan_config to log scan_start_info event)
            tracer.set_scan_config(scan_config)

            # Register vulnerability callback
            def vuln_callback(report_id: str, title: str, content: str, severity: str):
                self._save_vulnerability(scan_id, title, content, severity, report_id)

            tracer.vulnerability_found_callback = vuln_callback
            self.tracers[scan_id] = tracer

            # Install global tracer AFTER configuring it
            set_global_tracer(tracer)

            # Update scan DB state
            scan.status = "running"
            scan.strix_run_name = run_name
            scan.started_at = datetime.utcnow()
            db.commit()

            # Launch background task
            task = asyncio.create_task(
                self._run_agent_task(scan_id, agent_config, scan_config)
            )
            self.active_scans[scan_id] = task

            return {
                "success": True,
                "scan_id": scan_id,
                "status": "running",
                "message": "Draco Agent started (Native Mode)",
            }

        except Exception as e:
            logger.error(f"Failed to start scan {scan_id}: {e}")
            try:
                scan.status = "failed"
                db.commit()
            except Exception:
                pass
            return {"success": False, "error": str(e)}

    async def _run_agent_task(self, scan_id: int, agent_config: Dict, scan_config: Dict):
        """Background task that runs the Strix agent."""
        db = SessionLocal()
        scan = None
        try:
            logger.info(f"Starting Strix Agent for scan {scan_id}")
            agent = StrixAgent(agent_config)
            result = await agent.execute_scan(scan_config)

            success = True
            if isinstance(result, dict) and not result.get("success", True):
                success = False
                logger.error(f"Strix Scan {scan_id} failed: {result.get('error')}")

            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if scan:
                scan.status = "completed" if success else "failed"
                scan.completed_at = datetime.utcnow()
                db.commit()

        except Exception as e:
            logger.exception(f"Exception in Strix Agent task for scan {scan_id}")
            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                scan.completed_at = datetime.utcnow()
                db.commit()
        finally:
            if scan_id in self.tracers:
                try:
                    self.tracers[scan_id].cleanup()
                except Exception as e:
                    logger.error(f"Tracer cleanup error for scan {scan_id}: {e}")
                finally:
                    del self.tracers[scan_id]

            db.close()
            if scan_id in self.active_scans:
                del self.active_scans[scan_id]

    def _save_vulnerability(self, scan_id: int, title: str, content: str, severity: str, poc: str):
        """Save vulnerability found by agent to DB — deduplicates by (scan_id, title)."""
        db = SessionLocal()
        try:
            # ── Deduplicate: skip if same title already saved for this scan ──
            existing = db.query(Vulnerability).filter(
                Vulnerability.scan_id == scan_id,
                Vulnerability.title == title,
            ).first()
            if existing:
                logger.debug(f"Duplicate vulnerability skipped: '{title}' for scan {scan_id}")
                return

            title_clean = title.replace("Strix", "Draco").replace("strix", "draco")
            content_clean = content.replace("Strix", "Draco").replace("strix", "draco")

            vulnerability = Vulnerability(
                scan_id=scan_id,
                title=title_clean,
                content=content_clean,
                severity=severity.lower(),
                vulnerability_type="Automated Finding",
                poc=poc,
            )
            db.add(vulnerability)

            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if scan:
                scan.vulnerabilities_found += 1
                s = severity.lower()
                if s == "critical":
                    scan.critical_count += 1
                elif s == "high":
                    scan.high_count += 1
                elif s == "medium":
                    scan.medium_count += 1
                elif s == "low":
                    scan.low_count += 1

            db.commit()
        except Exception as e:
            logger.error(f"Error saving vulnerability: {e}")
            db.rollback()
        finally:
            db.close()

    async def stop_scan(self, scan_id: int, db: Session) -> Dict[str, Any]:
        """Stop a running scan."""
        if scan_id in self.active_scans:
            task = self.active_scans[scan_id]
            task.cancel()
            del self.active_scans[scan_id]
            if scan_id in self.tracers:
                del self.tracers[scan_id]

        scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
        if scan:
            if scan.status == "running":
                scan.status = "stopped"
                scan.completed_at = datetime.utcnow()
                db.commit()
                return {"success": True, "message": "Scan stopped"}
            elif scan.status in ["completed", "failed", "stopped"]:
                return {"success": True, "message": "Scan was already stopped"}

        return {"success": False, "error": "Scan not found"}

    async def graceful_finish_scan(self, scan_id: int, db: Session) -> Dict[str, Any]:
        """
        Graceful stop: build a report from all currently-found vulnerabilities,
        persist it as the final report, mark scan as completed, then cancel the task.
        The user gets a real, formatted report even if Strix hasn't called finish_scan yet.
        """
        from ..infrastructure.models import Vulnerability as VulnModel

        scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
        if not scan:
            return {"success": False, "error": "Scan not found"}

        # ── Collect findings already saved ────────────────────────
        vulns = db.query(VulnModel).filter(VulnModel.scan_id == scan_id).all()
        sev_order = ["critical", "high", "medium", "low", "info"]
        vulns_sorted = sorted(vulns, key=lambda v: sev_order.index(v.severity) if v.severity in sev_order else 99)

        # ── Build markdown report ──────────────────────────────────
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        lines = [
            f"# Penetration Test Report — {scan.target}",
            f"",
            f"**Generated:** {now}  ",
            f"**Methodology:** {scan.methodology}  ",
            f"**Status:** Manually finished by operator  ",
            f"",
            f"---",
            f"",
            f"## Executive Summary",
            f"",
            f"A {scan.methodology} scan was conducted against `{scan.target}`. "
            f"The scan was manually finalized with **{len(vulns)}** vulnerabilities recorded.",
            f"",
            f"| Severity | Count |",
            f"|----------|-------|",
            f"| 🔴 Critical | {scan.critical_count} |",
            f"| 🟠 High     | {scan.high_count} |",
            f"| 🟡 Medium   | {scan.medium_count} |",
            f"| 🟢 Low      | {scan.low_count} |",
            f"",
            f"---",
            f"",
            f"## Findings",
            f"",
        ]

        if not vulns:
            lines.append("*No vulnerabilities recorded at the time of manual finish.*")
        else:
            for idx, v in enumerate(vulns_sorted, 1):
                sev_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(v.severity, "⚪")
                title_clean = v.title.replace("Strix", "Draco").replace("strix", "draco") if v.title else ""
                lines += [
                    f"### {idx}. {sev_icon} {title_clean}",
                    f"",
                    f"**Severity:** `{v.severity.upper()}`  ",
                    f"",
                ]
                if v.content:
                    lines.append(v.content.strip().replace("Strix", "Draco").replace("strix", "draco"))
                    lines.append("")
                lines += ["---", ""]

        report_md = "\n".join(lines)

        # ── Persist report & mark completed ───────────────────────
        scan.final_report_md = report_md
        scan.status = "completed"
        scan.completed_at = datetime.utcnow()
        db.commit()

        # ── Cancel the background task ────────────────────────────
        if scan_id in self.active_scans:
            task = self.active_scans[scan_id]
            task.cancel()
            del self.active_scans[scan_id]
        if scan_id in self.tracers:
            try:
                self.tracers[scan_id].cleanup()
            except Exception:
                pass
            del self.tracers[scan_id]

        return {
            "success": True,
            "message": f"Scan finished gracefully. Report generated with {len(vulns)} findings.",
            "vulnerabilities": len(vulns),
        }


    async def get_scan_status(self, scan_id: int, db: Session) -> Dict[str, Any]:
        """Get scan status."""
        scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
        if not scan:
            return {"error": "Scan not found"}
        return {
            "id": scan.id,
            "target": scan.target,
            "status": scan.status,
            "vulnerabilities_found": scan.vulnerabilities_found,
        }

    async def get_agent_feed_stream(
        self, scan_id: int, db: Session
    ) -> AsyncGenerator[str, None]:
        """Stream all agent events as Server-Sent Events."""
        last_event_id = 0
        while True:
            events = (
                db.query(AgentEvent)
                .filter(AgentEvent.scan_id == scan_id, AgentEvent.id > last_event_id)
                .order_by(AgentEvent.id)
                .all()
            )

            for event in events:
                sse_payload = {
                    "id": event.id,
                    "agent_id": event.agent_id,
                    "type": event.event_type,
                    # content is already a JSON string; frontend must JSON.parse it
                    "content": event.content,
                    "timestamp": event.timestamp.isoformat(),
                }
                yield f"data: {json.dumps(sse_payload)}\n\n"
                last_event_id = event.id

            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if scan and scan.status in ["completed", "failed", "stopped"]:
                yield f'data: {{"type": "complete", "status": "{scan.status}"}}\n\n'
                break

            await asyncio.sleep(1)


strix_service = StrixService()
