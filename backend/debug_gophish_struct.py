import requests
import json
import urllib3
urllib3.disable_warnings()

API_KEY = "c86ae4f065ef13044b29c40df996e7771c8830064d2339a55273d10e3caf949d"
BASE_URL = "https://127.0.0.1:3333/api"

print("--- DEBUGGING /groups RESPONSE ---")
try:
    r = requests.get(f"{BASE_URL}/groups", params={'api_key': API_KEY}, verify=False, timeout=5)
    print(f"Status: {r.status_code}")
    print(f"Raw Text: {r.text}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"Parsed Type: {type(data)}")
        if isinstance(data, list):
            print(f"Length: {len(data)}")
        elif isinstance(data, dict):
            print(f"Keys: {list(data.keys())}")
except Exception as e:
    print(f"Error: {e}")
