import requests
import json
import urllib3
import time
import sys

urllib3.disable_warnings()

API_KEY = "c86ae4f065ef13044b29c40df996e7771c8830064d2339a55273d10e3caf949d"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_DEBUG")
    payload = {
        "name": f"Debug{int(time.time())}",
        "targets": [{"first_name": "A", "last_name": "B", "email": "a@b.com", "position": "C"}]
    }
    
    try:
        print(f"Sending POST to {BASE_URL}/groups")
        r = requests.post(f"{BASE_URL}/groups", json=payload, params={'api_key': API_KEY}, verify=False)
        print(f"POST_STATUS:{r.status_code}")
        print(f"POST_BODY:{r.text}")
        
        print("Sending GET to check")
        r2 = requests.get(f"{BASE_URL}/groups", params={'api_key': API_KEY}, verify=False)
        print(f"GET_STATUS:{r2.status_code}")
        print(f"GET_BODY:{r2.text}")
    except Exception as e:
        print(f"EXCEPTION:{e}")
    print("END_DEBUG")

if __name__ == "__main__":
    debug()
