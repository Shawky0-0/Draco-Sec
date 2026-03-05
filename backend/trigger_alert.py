from datetime import datetime
from src.use_cases.monitor_service import MonitorService

ms = MonitorService()
dummy_data = {
    "timestamp": datetime.now().isoformat(timespec="seconds"),
    "event_type": "alert",
    "src_ip": "198.51.100.42",
    "src_port": 55555,
    "dest_ip": "10.0.0.100",
    "dest_port": 80,
    "proto": "TCP",
    "alert": {
        "action": "allowed",
        "gid": 1,
        "signature_id": 9999999,
        "rev": 1,
        "signature": "ET EXPLOIT Possible CVE-2024-9999 Remote Code Execution",
        "category": "Attempted Administrator Privilege Gain",
        "severity": 1
    }
}
ms._save_alert(dummy_data)
# Give it a second for the background thread to fire
import time
time.sleep(2)
print("Alert spoofed successfully!")
