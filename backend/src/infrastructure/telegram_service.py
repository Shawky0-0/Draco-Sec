import os
import time
import requests
from dotenv import load_dotenv
from .database import SessionLocal
from .models import User

load_dotenv()

class TelegramService:
    def __init__(self):
        # Cache to prevent spam: {(src_ip, signature): timestamp_sent}
        self.alert_cache = {}
        self.cooldown_seconds = 60

    def send_alert(self, alert: dict):
        src_ip = alert.get('src_ip')
        signature = alert.get('signature')
        
        # Rate Limiting Logic: Prevent spam for same IP + Signature
        now = time.time()
        cache_key = (src_ip, signature)
        
        # Clean up old cache entries occasionally
        if len(self.alert_cache) > 1000:
            self.alert_cache = {k: v for k, v in self.alert_cache.items() if now - v < self.cooldown_seconds}
            
        if cache_key in self.alert_cache:
            if now - self.alert_cache[cache_key] < self.cooldown_seconds:
                return  # Skip, too soon
                
        self.alert_cache[cache_key] = now

        db = SessionLocal()
        try:
            users = db.query(User).filter(User.telegram_chat_id.isnot(None), User.telegram_bot_token.isnot(None)).all()
            if not users:
                print("No users with Telegram credentials found. Skipping notification.")
                return

            message = (
                f"🚨 **Suricata Alert** 🚨\n"
                f"**Signature:** {alert.get('signature')}\n"
                f"**Severity:** {alert.get('severity')}\n"
                f"**Source:** {alert.get('src_ip')}:{alert.get('src_port')}\n"
                f"**Dest:** {alert.get('dest_ip')}:{alert.get('dest_port')}\n"
                f"**Action:** {alert.get('action')}\n"
            )

            for user in users:
                # Basic validation
                if not user.telegram_bot_token.strip() or not user.telegram_chat_id.strip():
                    continue
                    
                base_url = f"https://api.telegram.org/bot{user.telegram_bot_token.strip()}"
                url = f"{base_url}/sendMessage"
                payload = {
                    "chat_id": user.telegram_chat_id.strip(),
                    "text": message,
                    "parse_mode": "Markdown"
                }
                
                try:
                    requests.post(url, json=payload, timeout=5)
                except Exception as e:
                    print(f"Failed to send Telegram alert for user {user.username}: {e}")
                    
        finally:
            db.close()
