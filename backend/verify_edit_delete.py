import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "98388e195593401099a1e3986bb89df3c7f06e00f062af3dbd996b08a7d338a6"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_VERIFY_EDIT_DELETE")
    
    # 1. CREATE
    payload = {
        "name": f"ToEdit_{int(time.time())}",
        "targets": [{"first_name": "A", "last_name": "B", "email": "a@b.com", "position": "C"}]
    }
    print(f"1. Creating group: {payload['name']}")
    try:
        r = requests.post(f"{BASE_URL}/groups/", json=payload, params={'api_key': API_KEY}, verify=False)
        print(f"Create Status: {r.status_code}")
        group = r.json()
        group_id = group.get('id')
        print(f"Created Group ID: {group_id}")
        
        if not group_id:
            print("Failed to get Group ID. Aborting.")
            return

        # 2. EDIT (PUT)
        new_name = payload['name'] + "_EDITED"
        payload['name'] = new_name
        payload['targets'].append({"first_name": "D", "last_name": "E", "email": "d@e.com", "position": "F"})
        
        print(f"2. Editing group {group_id} to name: {new_name}")
        # Note: GoPhish requires PUT to /groups/{id}/
        r_put = requests.put(f"{BASE_URL}/groups/{group_id}/", json=payload, params={'api_key': API_KEY}, verify=False)
        print(f"Put Status: {r_put.status_code}")
        print(f"Put Body: {r_put.text}")
        
        # 3. GET (Verify Edit)
        print(f"3. Verifying Edit...")
        r_get = requests.get(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)
        # Note: GoPhish GET /groups/{id} returns the group object directly
        fetched_group = r_get.json()
        if fetched_group.get('name') == new_name:
            print("SUCCESS: Name updated correctly.")
        else:
            print(f"FAILURE: Name is {fetched_group.get('name')}, expected {new_name}")

        # 4. DELETE
        print(f"4. Deleting Group {group_id}")
        r_del = requests.delete(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)
        print(f"Delete Status: {r_del.status_code}")
        
        # 5. VERIFY DELETION
        print("5. Verifying Deletion...")
        r_check = requests.get(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)
        print(f"Check Status: {r_check.status_code}") # Should be 404
        
    except Exception as e:
        print(f"EXCEPTION: {e}")

    print("END_VERIFY_EDIT_DELETE")

if __name__ == "__main__":
    debug()
