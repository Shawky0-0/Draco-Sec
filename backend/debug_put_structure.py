import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "98388e195593401099a1e3986bb89df3c7f06e00f062af3dbd996b08a7d338a6"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_DEBUG_PUT_STRUCTURE")
    
    # 1. CREATE
    payload = {
        "name": f"PutStruct_{int(time.time())}",
        "targets": [{"first_name": "A", "last_name": "B", "email": "a@b.com", "position": "C"}]
    }
    print(f"1. Creating group...")
    try:
        r = requests.post(f"{BASE_URL}/groups/", json=payload, params={'api_key': API_KEY}, verify=False)
        group = r.json()
        group_id = group['id']
        print(f"Created ID: {group_id}")
        
        # Test 1: Payload WITHOUT ID (like Frontend is doing now)
        payload_no_id = {
            "name": group['name'] + "_EDITED_NO_ID",
            "targets": group['targets']
        }
        # Sanitize targets (remove IDs)
        payload_no_id['targets'] = [{k: v for k, v in t.items() if k in ['first_name', 'last_name', 'email', 'position']} for t in payload_no_id['targets']]
        
        print(f"2. Testing Payload NO ID: {json.dumps(payload_no_id)}")
        r_put = requests.put(f"{BASE_URL}/groups/{group_id}/", json=payload_no_id, params={'api_key': API_KEY}, verify=False)
        print(f"Test 1 STATUS: {r_put.status_code}")
        print(f"Test 1 BODY: {r_put.text}")

        # Test 2: Payload WITH ID in root
        payload_with_id = payload_no_id.copy()
        payload_with_id['id'] = group_id
        payload_with_id['name'] = group['name'] + "_EDITED_WITH_ID"
        
        print(f"3. Testing Payload WITH ID: {json.dumps(payload_with_id)}")
        r_put2 = requests.put(f"{BASE_URL}/groups/{group_id}/", json=payload_with_id, params={'api_key': API_KEY}, verify=False)
        print(f"Test 2 STATUS: {r_put2.status_code}")
        print(f"Test 2 BODY: {r_put2.text}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)

    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    debug()
