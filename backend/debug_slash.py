import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "c86ae4f065ef13044b29c40df996e7771c8830064d2339a55273d10e3caf949d"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_SLASH_DEBUG")
    payload = {
        "name": f"DebugSlash{int(time.time())}",
        "targets": [{"first_name": "Slash", "last_name": "Test", "email": "slash@test.com", "position": "Tester"}]
    }
    
    print(f"Testing POST to {BASE_URL}/groups/?api_key=... (WITH SLASH)")
    try:
        # Note the trailing slash
        r = requests.post(f"{BASE_URL}/groups/", json=payload, params={'api_key': API_KEY}, verify=False)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

    print("END_SLASH_DEBUG")

if __name__ == "__main__":
    debug()
