import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "c86ae4f065ef13044b29c40df996e7771c8830064d2339a55273d10e3caf949d"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("=== REPRODUCING USER PAYLOAD ERROR ===")
    
    # 1. Create a dummy group to act as ID 2 (or whatever ID we get)
    # We create it with 1 target first.
    timestamp = int(time.time())
    create_payload = {
        "name": f"group testsss_SETUP_{timestamp}",
        "targets": [
            {
                "first_name": "Shawky",
                "last_name": "Mohamed",
                "email": f"shawkymohamd{timestamp}@gmail.com",
                "position": "it"
            }
        ]
    }
    
    print("1. Creating setup group...")
    r = requests.post(f"{BASE_URL}/groups/", json=create_payload, params={'api_key': API_KEY}, verify=False)
    if not r.ok:
        print(f"Failed to create setup group: {r.text}")
        return
    
    group_id = r.json()['id']
    print(f"Created Group ID: {group_id}")

    # 2. Try to UPDATE with the USER'S PAYLOAD logic
    # (Adding new targets)
    
    # We use dynamic emails to avoid collision 500 crash for this test if possible,
    # OR we use the EXACT User payload if we suspect the data itself is bad.
    # Let's use the USER's data structure but unique emails to see if logic holds.
    
    update_payload = {
        "name": f"group testsss_UPDATED_{timestamp}", # Unique name to avoid name collision check first
        "id": group_id,
        "targets": [
            {
                "first_name": "Shawky",
                "last_name": "Mohamed",
                "email": f"shawkymohamd{timestamp}@gmail.com", # Existing
                "position": "it"
            },
            {
                "first_name": "Ahmed",
                "last_name": "Zaki",
                "email": f"zaki{timestamp}@gmail.com", # New
                "position": "it"
            },
            {
                 "first_name": "maram",
                 "last_name": "mohammad",
                 "email": f"test{timestamp}@gmail.com", # New
                 "position": "it"
            }
        ]
    }
    
    print("\n2. Sending PUT Request (Happy Path - Unique Data)...")
    r_put = requests.put(f"{BASE_URL}/groups/{group_id}/", json=update_payload, params={'api_key': API_KEY}, verify=False)
    print(f"Status: {r_put.status_code}")
    print(f"Body: {r_put.text}")
    
    # 3. Test NAME COLLISION (Force 400?)
    # Create another group with a specific name
    collision_name = f"COLLISION_TARGET_{timestamp}"
    requests.post(f"{BASE_URL}/groups/", json={"name": collision_name, "targets": []}, params={'api_key': API_KEY}, verify=False)
    
    # Try to rename our group to that name
    update_payload['name'] = collision_name
    print(f"\n3. Sending PUT Request (Name Collision Test: {collision_name})...")
    r_put2 = requests.put(f"{BASE_URL}/groups/{group_id}/", json=update_payload, params={'api_key': API_KEY}, verify=False)
    print(f"Status: {r_put2.status_code}")
    print(f"Body: {r_put2.text}")

    # Cleanup
    requests.delete(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)

if __name__ == "__main__":
    debug()
