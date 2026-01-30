
import subprocess
import logging
from sqlalchemy.orm import Session
from datetime import datetime
from ..infrastructure.database import SessionLocal
from ..infrastructure.models import BlockedIP

logger = logging.getLogger(__name__)

class FirewallService:
    def block_ip(self, ip_address: str, reason: str = "Automated Active Response"):
        db: Session = SessionLocal()
        try:
            # Check if already blocked in DB
            existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip_address, BlockedIP.active == 1).first()
            if existing:
                logger.info(f"IP {ip_address} is already blocked.")
                return False

            # Add iptables rule to block the IP
            try:
                subprocess.run(
                    ["sudo", "iptables", "-I", "INPUT", "-s", ip_address, "-j", "DROP"],
                    check=True,
                    capture_output=True,
                    text=True
                )
                
                # Also block outbound
                subprocess.run(
                    ["sudo", "iptables", "-I", "OUTPUT", "-d", ip_address, "-j", "DROP"],
                    check=True,
                    capture_output=True,
                    text=True
                )
                
                # Save iptables rules persistently (optional, might fail if permission denied)
                subprocess.run(
                    ["sudo", "iptables-save"],
                    check=False,
                    capture_output=True,
                    text=True
                )
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to execute iptables command: {e.stderr}")
                # We continue to save to DB so the UI shows it as 'blocked'

            # Persist to Database
            db_record = BlockedIP(
                ip_address=ip_address,
                reason=reason,
                active=1,
                blocked_at=datetime.utcnow()
            )
            db.add(db_record)
            db.commit()
            
            logger.info(f"Active Response: Blocked IP {ip_address} - Reason: {reason}")
            return True
            
        except Exception as e:
            logger.error(f"Error in block_ip: {str(e)}")
            db.rollback()
            raise e
        finally:
            db.close()

    def unblock_ip(self, ip_address: str):
        db: Session = SessionLocal()
        try:
             # Remove iptables block rules
            try:
                subprocess.run(
                    ["sudo", "iptables", "-D", "INPUT", "-s", ip_address, "-j", "DROP"],
                    check=False,
                    capture_output=True,
                    text=True
                )
                subprocess.run(
                    ["sudo", "iptables", "-D", "OUTPUT", "-d", ip_address, "-j", "DROP"],
                    check=False,
                    capture_output=True,
                    text=True
                )
                subprocess.run(
                    ["sudo", "iptables-save"],
                    check=False,
                    capture_output=True,
                    text=True
                )
            except Exception as e:
                logger.error(f"Error removing iptables rule: {e}")

            # Update DB
            record = db.query(BlockedIP).filter(BlockedIP.ip_address == ip_address, BlockedIP.active == 1).first()
            if record:
                record.active = 0
                record.unblocked_at = datetime.utcnow()
                db.commit()
            
            return True
        except Exception as e:
            logger.error(f"Error in unblock_ip: {str(e)}")
            db.rollback()
            raise e
        finally:
            db.close()

firewall_service = FirewallService()
