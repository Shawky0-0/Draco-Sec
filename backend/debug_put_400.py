import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "98388e195593401099a1e3986bb89df3c7f06e00f062af3dbd996b08a7d338a6"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_DEBUG_PUT_400")
    
    # 1. CREATE
    payload = {
        "name": f"PutTest_{int(time.time())}",
        "targets": [{"first_name": "A", "last_name": "B", "email": "a@b.com", "position": "C"}]
    }
    print(f"1. Creating group...")
    try:
        r = requests.post(f"{BASE_URL}/groups/", json=payload, params={'api_key': API_KEY}, verify=False)
        group = r.json()
        group_id = group['id']
        print(f"Created ID: {group_id}")
        
        # 2. GET (To get full structure with IDs, dates, etc.)
        print("2. Getting group to mimic Frontend state...")
        r_get = requests.get(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)
        full_group = r_get.json()
        
        # Frontend likely sends 'targets' as is, and 'name'.
        # Frontend payload construction:
        # const payload = { name: groupName, targets: targets };
        
        frontend_payload = {
            "name": full_group['name'] + "_EDITED",
            "targets": full_group['targets']
        }
        
        print("3. Sending PUT with FULL targets objects...")
        # print(json.dumps(frontend_payload, indent=2))
        
        r_put = requests.put(f"{BASE_URL}/groups/{group_id}/", json=frontend_payload, params={'api_key': API_KEY}, verify=False)
        print(f"PUT Status: {r_put.status_code}")
        print(f"PUT Body: {r_put.text}")
        
        if r_put.status_code == 400:
            print("REPRODUCED: 400 Bad Request when sending full objects.")
        else:
            print("PASSED: Full objects acceptable.")

        # Cleanup
        requests.delete(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)

    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    debug()
