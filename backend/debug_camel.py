import requests
import json
import urllib3
import time
import sys

urllib3.disable_warnings()

API_KEY = "c86ae4f065ef13044b29c40df996e7771c8830064d2339a55273d10e3caf949d"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_DEBUG_CAMEL")
    payload = {
        "name": f"DebugCamel{int(time.time())}",
        "targets": [{"firstName": "Camel", "lastName": "Case", "email": "camel@test.com", "position": "Tester"}]
    }
    
    try:
        print("Sending POST (CamelCase)")
        r = requests.post(f"{BASE_URL}/groups", json=payload, params={'api_key': API_KEY}, verify=False)
        print(f"POST_STATUS:{r.status_code}")
        print(f"POST_BODY:{r.text}")
        
    except Exception as e:
        print(f"EXCEPTION:{e}")
    print("END_DEBUG_CAMEL")

if __name__ == "__main__":
    debug()
