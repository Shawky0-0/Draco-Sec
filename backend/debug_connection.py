import requests
import verify_edit_delete

# Config from phishing_service.py
BASE_URL = "https://127.0.0.1:3333/api"
API_KEY = "98388e195593401099a1e3986bb89df3c7f06e00f062af3dbd996b08a7d338a6"

requests.packages.urllib3.disable_warnings()

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
            print("SUCCESS: GoPhish is reachable.")
            data = response.json()
            print(f"Campaigns found: {len(data)}")
        else:
            print(f"FAILURE: GoPhish returned error: {response.text}")
    except Exception as e:
        print(f"CRITICAL FAILURE: Could not connect to GoPhish: {e}")

if __name__ == "__main__":
    test_connection()
