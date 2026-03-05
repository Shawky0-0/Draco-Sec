
import requests
import json
import urllib3

urllib3.disable_warnings()

API_KEY = "98388e195593401099a1e3986bb89df3c7f06e00f062af3dbd996b08a7d338a6"
BASE_URL = "https://127.0.0.1:3333/api"

def test_connection():
    print(f"Testing connection to {BASE_URL}...")
    try:
        response = requests.get(
            f"{BASE_URL}/campaigns/", 
            params={'api_key': API_KEY}, 
            verify=False,
            timeout=5
        )
        print(f"Status Code: {response.status_code}")
        if response.ok:
            campaigns = response.json()
            print(f"Success! Found {len(campaigns)} campaigns.")
            for c in campaigns:
                print(f" - {c.get('name')} (Status: {c.get('status')})")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    test_connection()
