
import os
import requests
from dotenv import load_dotenv

load_dotenv()

class TelegramService:
    def __init__(self):
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"

    def send_alert(self, alert: dict):
        if not self.bot_token or not self.chat_id:
            print("Telegram credentials not found. Skipping notification.")
            return

        message = (
            f"🚨 **Suricata Alert** 🚨\n"
            f"**Signature:** {alert.get('signature')}\n"
            f"**Severity:** {alert.get('severity')}\n"
            f"**Source:** {alert.get('src_ip')}:{alert.get('src_port')}\n"
            f"**Dest:** {alert.get('dest_ip')}:{alert.get('dest_port')}\n"
            f"**Action:** {alert.get('action')}\n"
        )

        try:
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            requests.post(url, json=payload, timeout=5)
        except Exception as e:
            print(f"Failed to send Telegram alert: {e}")
