"""
Strix Integration Service for DracoSec Offensive Security

This service manages the execution of Strix penetration testing scans,
integrating directly with the StrixAgent Python API for structured event handling.
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
    
logger = logging.getLogger(__name__)

class DracoTracer(Tracer):
    """Custom Tracer to capture Strix events and save them to DracoSec DB."""
    
    def __init__(self, run_name: str, scan_id: int):
        super().__init__(run_name)
        self.scan_id = scan_id
        # We need a new session context for the tracer as it runs in async context
        # but the tracer methods might be synchronous or called from different contexts
        
    def _get_db(self):
        """Helper to get a database session."""
        return SessionLocal()
        
    def add_chat_message(self, content: str, role: str, agent_id: str, metadata: Dict[str, Any] = None) -> int:
        """Override to capture chat messages."""
        msg_id = super().add_chat_message(content, role, agent_id, metadata)
        
        # Save to DB
        self._save_event(agent_id, "chat", {
            "role": role,
            "content": content,
            "metadata": metadata
        })
        return msg_id

    def log_tool_execution_start(self, agent_id: str, tool_name: str, args: Dict[str, Any]) -> int:
        """Override to capture tool execution start."""
        exec_id = super().log_tool_execution_start(agent_id, tool_name, args)
        
        self._save_event(agent_id, "tool_start", {
            "tool": tool_name,
            "args": args,
            "execution_id": exec_id
        })
        return exec_id
        
    def update_tool_execution(self, execution_id: int, status: str, result: Any | None = None) -> None:
        """Override to capture tool updates."""
        super().update_tool_execution(execution_id, status, result)
        
        # Find which agent this belonged to (from internal state)
        if execution_id in self.tool_executions:
            exec_data = self.tool_executions[execution_id]
            agent_id = exec_data.get("agent_id", "strix")
            
            # Helper to make result JSON serializable if needed
            result_str = str(result)
            if hasattr(result, "to_dict"):
                try: result_str = json.dumps(result.to_dict())
                except: pass
            elif isinstance(result, (dict, list)):
                try: result_str = json.dumps(result)
                except: pass
                
            self._save_event(agent_id, "tool_update", {
                "execution_id": execution_id,
                "status": status,
                "result": result_str
            })
            
            # Emit updated stats
            try:
                stats = self.get_total_llm_stats()
                stats["agents_count"] = len(self.agents)
                stats["tools_count"] = self.get_real_tool_count()
                self._save_event("system", "stats", stats)
            except Exception as e:
                logger.warning(f"Failed to emit stats: {e}")

    def update_agent_status(self, agent_id: str, status: str, error_message: str | None = None) -> None:
        """Capture agent status changes."""
        super().update_agent_status(agent_id, status, error_message)
        
        self._save_event(agent_id, "status", {
            "status": status,
            "error": error_message
        })

    def _save_event(self, agent_id: str, event_type: str, data: Dict[str, Any]):
        """Helper to save event to database safely."""
        db = self._get_db()
        try:
            # Strix content is usually rich, we wrap it in our format
            content_json = json.dumps(data)
            
            event = AgentEvent(
                scan_id=self.scan_id,
                agent_id=agent_id,
                event_type=event_type,
                content=content_json,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(event)
            db.commit()
        except Exception as e:
            logger.error(f"Error saving DracoTracer event: {e}")
            db.rollback()
        finally:
            db.close()


class StrixService:
    """Service for managing Strix penetration testing scans using native Python API."""
    
    def __init__(self):
        self.strix_results_dir = Path(os.getenv("STRIX_RESULTS_DIR", "./strix_runs"))
        self.strix_results_dir.mkdir(exist_ok=True)
        # Keep track of running tasks so we don't GC them
        self.active_scans: Dict[int, asyncio.Task] = {}
        self.tracers: Dict[int, DracoTracer] = {}
    
    async def start_scan(
        self,
        scan_id: int,
        target: str,
        methodology: str,
        scope: str,
        db: Session
    ) -> Dict[str, Any]:
        """Start a new Strix scan using the Python API."""
        
        if not STRIX_AVAILABLE:
            return {"success": False, "error": "Strix libraries not installed in backend environment."}

        try:
            # 1. Get/Create Scan Record
            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if not scan:
                raise ValueError(f"Scan {scan_id} not found")
            
            run_name = f"dracosec_{scan_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # 2. Configure Strix Agent
            mapping = {
                "Quick Scan": "quick", 
                "Standard": "standard", 
                "Deep Analysis": "deep",
                "Blackbox": "deep",
                "Whitebox": "deep",
                "Web Application": "deep",
                "API Security": "deep"
            }
            scan_mode = mapping.get(methodology, "standard")

            llm_config = LLMConfig(scan_mode=scan_mode)
            # Ensure keys are loaded from ENV (Strix does this automatically, but we ensure env is set)
            
            agent_config = {
                "llm_config": llm_config,
                "max_iterations": 300,
                "non_interactive": True, # Agent won't ask for console input
            }
            
            # Determine target type
            import re
            is_ip = re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", target)
            
            if is_ip:
                target_data = {
                    "type": "ip_address",
                    "details": {"target_ip": target}
                }
            else:
                target_data = {
                    "type": "web_application",
                    "details": {"target_url": target}
                }

            scan_config = {
                "scan_id": run_name,
                "targets": [target_data], # Strix expects target info objects
                "user_instructions": scope or "",
                "run_name": run_name,
            }

            # 3. Setup Custom Tracer
            tracer = DracoTracer(run_name, scan_id)
            set_global_tracer(tracer) # This hooks the agent events to our tracer
            
            # Hook the vulnerability callback (explicit in Strix code)
            def vuln_callback(report_id, title, content, severity):
                self._save_vulnerability(scan_id, title, content, severity, report_id)
            
            tracer.vulnerability_found_callback = vuln_callback
            self.tracers[scan_id] = tracer
            
            # 4. Update Scan DB Status
            scan.status = "running"
            scan.strix_run_name = run_name
            scan.started_at = datetime.utcnow()
            db.commit()
            
            # 5. Launch Async Execution
            task = asyncio.create_task(self._run_agent_task(scan_id, agent_config, scan_config))
            self.active_scans[scan_id] = task
            
            return {
                "success": True, 
                "scan_id": scan_id, 
                "status": "running", 
                "message": "Strix Agent started (Native Mode)"
            }
            
        except Exception as e:
            logger.error(f"Failed to start scan {scan_id}: {e}")
            scan.status = "failed"
            db.commit()
            return {"success": False, "error": str(e)}

    async def _run_agent_task(self, scan_id: int, agent_config: Dict, scan_config: Dict):
        """The background task that runs the agent."""
        db = SessionLocal()
        try:
            logger.info(f"Starting Strix Agent for scan {scan_id}")
            agent = StrixAgent(agent_config)
            
            # Execute Scan (Async)
            result = await agent.execute_scan(scan_config)
            
            # Check Result
            success = True
            if isinstance(result, dict) and not result.get("success", True):
                success = False
                logger.error(f"Strix Scan {scan_id} failed: {result.get('error')}")
            
            # Update DB Completion
            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if scan:
                scan.status = "completed" if success else "failed"
                scan.completed_at = datetime.utcnow()
                db.commit()
            
                
            # Cleanup is handled in finally block

                
        except Exception as e:
            logger.exception(f"Exception in Strix Agent task for scan {scan_id}")
            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                scan.completed_at = datetime.utcnow()
                db.commit()
        finally:
            # Always cleanup resources
            if scan_id in self.tracers:
                try:
                    self.tracers[scan_id].cleanup() # Saves final report to disk
                except Exception as cleanup_err:
                    logger.error(f"Error during tracer cleanup for scan {scan_id}: {cleanup_err}")
                finally:
                    del self.tracers[scan_id]

            db.close()
            if scan_id in self.active_scans:
                del self.active_scans[scan_id]

    def _save_vulnerability(self, scan_id: int, title: str, content: str, severity: str, poc: str):
        """Helper to save vulnerabilities from tracer callback."""
        db = SessionLocal()
        try:
            vulnerability = Vulnerability(
                scan_id=scan_id,
                title=title,
                content=content,
                severity=severity.lower(),
                vulnerability_type="Automated Finding", # Strix might provide more granular type later
                poc=poc,
            )
            db.add(vulnerability)
            
            # Update counts
            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if scan:
                scan.vulnerabilities_found += 1
                s = severity.lower()
                if s == "critical": scan.critical_count += 1
                elif s == "high": scan.high_count += 1
                elif s == "medium": scan.medium_count += 1
                elif s == "low": scan.low_count += 1
            
            db.commit()
        except Exception as e:
            logger.error(f"Error saving vuln: {e}")
            db.rollback()
        finally:
            db.close()

    async def stop_scan(self, scan_id: int, db: Session) -> Dict[str, Any]:
        """Stop a running scan."""
        # 1. Cancel the asyncio task if it exists in memory
        if scan_id in self.active_scans:
            task = self.active_scans[scan_id]
            task.cancel() # Cancel async task
            # Cleanup from active scans is handled by the task's finally block or completion callback ideally,
            # but we can ensure removal here to be safe
            del self.active_scans[scan_id]
            if scan_id in self.tracers:
                del self.tracers[scan_id]

        # 2. Always update the DB state if the scan exists and is running
        # This handles cases where server restarted and lost in-memory state
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

    async def get_scan_status(self, scan_id: int, db: Session) -> Dict[str, Any]:
        """Get scan status."""
        scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
        if not scan: return {"error": "Scan not found"}
        return {
            "id": scan.id,
            "target": scan.target,
            "status": scan.status,
            "vulnerabilities_found": scan.vulnerabilities_found,
        }

    async def get_agent_feed_stream(self, scan_id: int, db: Session) -> AsyncGenerator[str, None]:
        """Stream agent events for real-time feed (SSE)."""
        last_event_id = 0
        while True:
            # We query the DB since our Tracer is dumping events there in real-time
            events = db.query(AgentEvent).filter(
                AgentEvent.scan_id == scan_id,
                AgentEvent.id > last_event_id
            ).order_by(AgentEvent.id).all()
            
            for event in events:
                # The 'content' field is already JSON string from our Tracer
                # We need to construct a clean SSE object
                sse_payload = {
                    "id": event.id,
                    "agent_id": event.agent_id,
                    "type": event.event_type, # 'chat', 'tool_start', etc
                    "content": event.content, # This is a JSON string, frontend needs to parse it!
                    "timestamp": event.timestamp.isoformat()
                }
                yield f"data: {json.dumps(sse_payload)}\n\n"
                last_event_id = event.id
            
            scan = db.query(OffensiveScan).filter(OffensiveScan.id == scan_id).first()
            if scan and scan.status in ["completed", "failed", "stopped"]:
                 yield f"data: {{\"type\": \"complete\", \"status\": \"{scan.status}\"}}\n\n"
                 break
                 
            await asyncio.sleep(1)

strix_service = StrixService()
