
import json
import time
import threading
import os
from sqlalchemy.orm import Session
from datetime import datetime
from ..infrastructure.database import SessionLocal
from ..infrastructure.models import SuricataAlert
from ..infrastructure.telegram_service import TelegramService
from .firewall_service import firewall_service

class MonitorService:
    def __init__(self, log_path="/var/log/suricata/eve.json"):
        self.log_path = log_path
        self.running = False
        self.telegram_service = TelegramService()

    def start_watcher(self):
        if not os.path.exists(self.log_path):
            print(f"Warning: Suricata log file not found at {self.log_path}. Watcher will not start.")
            return

        self.running = True
        thread = threading.Thread(target=self._tail_log, daemon=True)
        thread.start()
        print(f"Started Suricata Log Watcher on {self.log_path}")

    def _tail_log(self):
        """
        Robust tail implementation that handles log rotation.
        """
        current_file = open(self.log_path, "r")
        current_inode = os.fstat(current_file.fileno()).st_ino
        
        # Go to the end of the file initially
        current_file.seek(0, 2)
        
        while self.running:
            try:
                # 1. Read new lines
                line = current_file.readline()
                if line:
                    try:
                        self._process_line(line)
                    except Exception as e:
                        print(f"Error processing log line: {e}")
                    continue

                # 2. If no new line, check for rotation
                if not os.path.exists(self.log_path):
                    time.sleep(0.1)
                    continue

                try:
                    new_inode = os.stat(self.log_path).st_ino
                    
                    if new_inode != current_inode:
                        # File rotated!
                        print("Log rotation detected. Reopening file...")
                        current_file.close()
                        current_file = open(self.log_path, "r")
                        current_inode = new_inode
                        # Don't seek to end, read from start of new file
                        continue
                except OSError:
                    # File might have been deleted/moved between exists check and stat
                    pass
                
                time.sleep(0.1)
                
            except Exception as e:
                print(f"Watcher error: {e}")
                time.sleep(1)

    def _process_line(self, line):
        try:
            data = json.loads(line)
            if data.get("event_type") == "alert":
                self._save_alert(data)
        except json.JSONDecodeError:
            pass

    def _save_alert(self, data):
        db: Session = SessionLocal()
        try:
            alert_data = data.get("alert", {})
            
            # Extract basic info
            timestamp_str = data.get("timestamp")
            timestamp = datetime.now() # Fallback
            if timestamp_str:
                try:
                    # Suricata timestamp format is ISO8601-ish
                    timestamp = datetime.strptime(timestamp_str.split(".")[0], "%Y-%m-%dT%H:%M:%S")
                except:
                    pass

            # Determine Action (Active Response)
            severity = alert_data.get("severity")
            source_ip = data.get("src_ip")
            alert_msg = alert_data.get("signature", "Unknown Alert")
            action = alert_data.get("action", "allowed")

            # Active Response: Block IP if Severity is High (1) or Medium (2)
            if severity and severity <= 2:
                try:
                    # Attempt to block
                    if firewall_service.block_ip(source_ip, reason=f"Active Response: {alert_msg}"):
                        action = "blocked"
                except Exception as e:
                    print(f"Failed to execute Active Response: {e}")

            new_alert = SuricataAlert(
                timestamp=timestamp,
                # Network Info
                src_ip=source_ip,
                src_port=alert_data.get("src_port"),
                dest_ip=alert_data.get("dest_ip"),
                dest_port=alert_data.get("dest_port"),
                protocol=data.get("proto"),
                
                # Alert Info
                severity=severity,
                signature=alert_msg,
                category=alert_data.get("category"),
                
                # Investigation
                action=action, # allowed/blocked
                status="new",
                
                # Evidence
                payload_printable=data.get("payload_printable"),
                raw_event=json.dumps(data)
            )
            
            db.add(new_alert)
            db.commit()
            
            # Send Telegram Alert if Severity is High (1) or Medium (2)
            if new_alert.severity and new_alert.severity <= 2:
                # Use a thread to avoid blocking the monitor loop
                threading.Thread(target=self.telegram_service.send_alert, args=({
                    "signature": new_alert.signature,
                    "severity": new_alert.severity,
                    "src_ip": new_alert.src_ip,
                    "src_port": new_alert.src_port,
                    "dest_ip": new_alert.dest_ip,
                    "dest_port": new_alert.dest_port,
                    "action": new_alert.action
                },)).start()
                
        except Exception as e:
            print(f"Error saving alert: {e}")
        finally:
            db.close()

    def get_alerts(self, limit: int = 100):
        db = SessionLocal()
        try:
            return db.query(SuricataAlert).order_by(SuricataAlert.timestamp.desc()).limit(limit).all()
        finally:
            db.close()

    def get_alert_by_id(self, alert_id: int):
        db = SessionLocal()
        try:
            return db.query(SuricataAlert).filter(SuricataAlert.id == alert_id).first()
        finally:
            db.close()

    def update_alert_status(self, alert_id: int, status: str):
        db = SessionLocal()
        try:
            alert = db.query(SuricataAlert).filter(SuricataAlert.id == alert_id).first()
            if alert:
                alert.status = status
                db.commit()
                db.refresh(alert)
            return alert
        finally:
            db.close()

    def get_stats(self):
        db = SessionLocal()
        try:
            total = db.query(SuricataAlert).count()
            # Simple stats - in prod use optimized SQL queries
            high_sev = db.query(SuricataAlert).filter(SuricataAlert.severity == 1).count()
            blocked = db.query(SuricataAlert).filter(SuricataAlert.action == 'blocked').count()
            new_alerts = db.query(SuricataAlert).filter(SuricataAlert.status == 'new').count()
            
            return {
                "total": total,
                "high_severity": high_sev,
                "blocked": blocked,
                "investigation_pending": new_alerts
            }
        finally:
            db.close()

monitor_service = MonitorService()
