import requests
import json
import urllib3
import time
urllib3.disable_warnings()

API_KEY = "c86ae4f065ef13044b29c40df996e7771c8830064d2339a55273d10e3caf949d"
BASE_URL = "https://127.0.0.1:3333/api"

def create_and_check():
    print("--- DEBUGGING CREATE GROUP ---")
    
    # Payload matching GoPhish expectation
    payload = {
        "name": f"Debug Group {int(time.time())}",
        "targets": [
            {"first_name": "Test", "last_name": "User", "email": "test@example.com", "position": "Tester"}
        ]
    }
    
    print(f"Creating group: {payload['name']}")
    try:
        r = requests.post(f"{BASE_URL}/groups", json=payload, params={'api_key': API_KEY}, verify=False)
        print(f"POST Status: {r.status_code}")
        print(f"POST Body: {r.text}")
        
        if r.status_code == 201: # GoPhish returns 201 Created usually
            print("Creation Successful according to GoPhish.")
        else:
            print("Creation Failed.")

        print("--- CHECKING FOR GROUPS ---")
        r2 = requests.get(f"{BASE_URL}/groups", params={'api_key': API_KEY}, verify=False)
        print(f"GET Status: {r2.status_code}")
        groups = r2.json()
        print(f"Groups Found: {len(groups)}")
        print(f"Content: {groups}")
        
    except Exception as e:
        print(f"Error: {e}")

create_and_check()
