import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "98388e195593401099a1e3986bb89df3c7f06e00f062af3dbd996b08a7d338a6"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_DEBUG_PUT_STRUCTURE_V2")
    
    # 1. CREATE
    payload = {
        "name": f"PutStructV2_{int(time.time())}",
        "targets": [{"first_name": "A", "last_name": "B", "email": "a@b.com", "position": "C"}]
    }
    print(f"1. Creating group...")
    try:
        r = requests.post(f"{BASE_URL}/groups/", json=payload, params={'api_key': API_KEY}, verify=False)
        group = r.json()
        group_id = group['id']
        print(f"Created ID: {group_id}")
        
        # 2. Get Full Group
        r_get = requests.get(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)
        full_group = r_get.json()
        print("Got Full Group.")
        
        # Test 1: Send back EXACTLY what we got (but change name)
        payload_1 = full_group.copy()
        payload_1['name'] = full_group['name'] + "_ExactCopy"
        
        print(f"Test 1: Sending FULL exact object...")
        r_put = requests.put(f"{BASE_URL}/groups/{group_id}/", json=payload_1, params={'api_key': API_KEY}, verify=False)
        print(f"Test 1 STATUS: {r_put.status_code}")
        
        # Test 2: Send sanitized targets + ID (What frontend does)
        payload_2 = {
            "name": full_group['name'] + "_Sanitized",
            "targets": [{"first_name": "A", "last_name": "B", "email": "a@b.com", "position": "C"}],
            "id": group_id
        }
        print(f"Test 2: Sending Sanitized + ID... {json.dumps(payload_2)}")
        r_put2 = requests.put(f"{BASE_URL}/groups/{group_id}/", json=payload_2, params={'api_key': API_KEY}, verify=False)
        print(f"Test 2 STATUS: {r_put2.status_code}")
        print(f"Test 2 BODY: {r_put2.text}")

        # Cleanup
        requests.delete(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)

    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    debug()
