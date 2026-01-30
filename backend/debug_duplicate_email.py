import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "98388e195593401099a1e3986bb89df3c7f06e00f062af3dbd996b08a7d338a6"
BASE_URL = "https://127.0.0.1:3333/api"

def debug():
    print("START_DEBUG_DUPLICATE_EMAIL")
    timestamp = int(time.time())
    email = f"collision_{timestamp}@test.com"
    
    # 1. Create Group A with "Bob"
    payload_a = {
        "name": f"GroupA_{timestamp}",
        "targets": [{"first_name": "Bob", "last_name": "Builder", "email": email, "position": "Worker"}]
    }
    print(f"1. Creating Group A (Bob)...")
    r = requests.post(f"{BASE_URL}/groups/", json=payload_a, params={'api_key': API_KEY}, verify=False)
    print(f"   Status: {r.status_code}")
    if not r.ok:
        print(r.text)
        return

    # 2. Create Group B with "Alice" (Same Email)
    payload_b = {
        "name": f"GroupB_{timestamp}",
        "targets": [{"first_name": "Alice", "last_name": "Wonderland", "email": email, "position": "Dreamer"}]
    }
    print(f"2. Creating Group B (Alice) - Same Email, Diff Name...")
    r = requests.post(f"{BASE_URL}/groups/", json=payload_b, params={'api_key': API_KEY}, verify=False)
    print(f"   Status: {r.status_code}")
    print(f"   Body: {r.text}")

    # 3. Modify Group A to change Bob to Alice (Update existing)
    group_a_id = r.json()['id'] # Wait, r is Group B? No r is from A.
    # actually I need A's ID.
    
    # Let's start fresh for #3
    email_2 = f"collision_modify_{timestamp}@test.com"
    payload_c = {
        "name": f"GroupC_{timestamp}",
        "targets": [{"first_name": "Original", "last_name": "Name", "email": email_2, "position": "Pos"}]
    }
    r = requests.post(f"{BASE_URL}/groups/", json=payload_c, params={'api_key': API_KEY}, verify=False)
    group_c_id = r.json()['id']
    
    print(f"3. Modifying Group C (Changing Name of target)...")
    payload_c_update = payload_c.copy()
    payload_c_update['id'] = group_c_id
    payload_c_update['targets'] = [{"first_name": "CHANGED", "last_name": "Name", "email": email_2, "position": "Pos"}]
    
    r = requests.put(f"{BASE_URL}/groups/{group_c_id}/", json=payload_c_update, params={'api_key': API_KEY}, verify=False)
    print(f"   Status: {r.status_code}")
    print(f"   Body: {r.text}")

if __name__ == "__main__":
    debug()
