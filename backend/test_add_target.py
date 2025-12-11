import requests
import json
import urllib3
import time

urllib3.disable_warnings()

API_KEY = "c86ae4f065ef13044b29c40df996e7771c8830064d2339a55273d10e3caf949d"
BASE_URL = "https://127.0.0.1:3333/api"

def test_add_target():
    print("=== Testing Add Target to Existing Group ===")
    
    try:
        # 1. Create group with 1 target
        initial_payload = {
            "name": f"AddTargetTest_{int(time.time())}",
            "targets": [
                {"first_name": "User", "last_name": "One", "email": "user1@test.com", "position": "Developer"}
            ]
        }
        
        print(f"\n1. Creating group with 1 target...")
        r = requests.post(f"{BASE_URL}/groups/", json=initial_payload, params={'api_key': API_KEY}, verify=False)
        print(f"   Status: {r.status_code}")
        group = r.json()
        group_id = group['id']
        print(f"   Created group ID: {group_id}")
        print(f"   Targets: {json.dumps(group['targets'], indent=2)}")
        
        # 2. Get the group to see current state
        print(f"\n2. Fetching group {group_id}...")
        r_get = requests.get(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)
        fetched_group = r_get.json()
        print(f"   Current targets: {json.dumps(fetched_group['targets'], indent=2)}")
        
        # 3. Update to add a second target (simulating what frontend does)
        update_payload = {
            "id": group_id,
            "name": fetched_group['name'],
            "targets": [
                # Keep existing target
                {"first_name": "User", "last_name": "One", "email": "user1@test.com", "position": "Developer"},
                # Add new target
                {"first_name": "User", "last_name": "Two", "email": "user2@test.com", "position": "Manager"}
            ]
        }
        
        print(f"\n3. Updating group to add second target...")
        print(f"   Payload: {json.dumps(update_payload, indent=2)}")
        r_put = requests.put(f"{BASE_URL}/groups/{group_id}/", json=update_payload, params={'api_key': API_KEY}, verify=False)
        print(f"   Status: {r_put.status_code}")
        if r_put.status_code >= 400:
            print(f"   ERROR: {r_put.text}")
        else:
            updated_group = r_put.json()
            print(f"   SUCCESS! Targets now: {json.dumps(updated_group['targets'], indent=2)}")
        
        # 4. Verify by fetching again
        print(f"\n4. Verifying by fetching group again...")
        r_verify = requests.get(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)
        final_group = r_verify.json()
        print(f"   Final targets: {json.dumps(final_group['targets'], indent=2)}")
        print(f"   Total targets: {len(final_group['targets'])}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/groups/{group_id}/", params={'api_key': API_KEY}, verify=False)
        print(f"\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Exception: {e}")

if __name__ == "__main__":
    test_add_target()
