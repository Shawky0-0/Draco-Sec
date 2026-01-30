import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "98388e195593401099a1e3986bb89df3c7f06e00f062af3dbd996b08a7d338a6"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_REDIRECT_DEBUG")
    payload = {
        "name": f"Debug{int(time.time())}",
        "targets": [{"first_name": "A", "last_name": "B", "email": "a@b.com", "position": "C"}]
    }
    
    print(f"Testing POST to {BASE_URL}/groups (No Slash)")
    try:
        r = requests.post(f"{BASE_URL}/groups", json=payload, params={'api_key': API_KEY}, verify=False, allow_redirects=True)
        print(f"Status: {r.status_code}")
        print(f"History: {r.history}")
        print(f"Url: {r.url}")
        print(f"Body: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

    print("\nTesting POST with Auth Header")
    try:
        headers = {'Authorization': f'Bearer {API_KEY}'}
        r = requests.post(f"{BASE_URL}/groups", json=payload, headers=headers, verify=False)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

    print("END_REDIRECT_DEBUG")

if __name__ == "__main__":
    debug()
