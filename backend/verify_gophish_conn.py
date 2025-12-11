import requests
import urllib3
import sys

# Disable SSL warnings
urllib3.disable_warnings()

# Configuration from phishing_service.py
API_KEY = "dcd8d5fbfd6bb253a560529eb966c2c56349b483fc5f0020ba05804410fcd556"
BASE_URL = "https://127.0.0.1:3333/api"

print(f"Connecting to GoPhish at {BASE_URL}...")

try:
    # Test GET /groups which is the endpoint we care about for this task
    response = requests.get(
        f"{BASE_URL}/groups", 
        params={'api_key': API_KEY}, 
        verify=False, 
        timeout=5
    )
    
    print(f"Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"SUCCESS: Connection established.")
        print(f"Groups Found: {len(data)}")
        # Print first group if exists just to prove we have data
        if data:
            print(f"Sample Group: {data[0].get('name')}")
    elif response.status_code == 401:
        print("ERROR: Unauthorized. The API Key is invalid.")
    else:
        print(f"ERROR: Unexpected status code: {response.status_code}")
        print(f"Body: {response.text}")

except requests.exceptions.ConnectionError:
    print("ERROR: Connection Refused. Is GoPhish running on port 3333?")
except Exception as e:
    print(f"ERROR: {e}")
