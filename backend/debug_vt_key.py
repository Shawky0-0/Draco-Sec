
import requests

API_KEY = "5726b0a3b16d7995f5a4253ae2622df703e0ee150fdf47ad364a882f902a3bfa"
URL = "https://www.virustotal.com/api/v3/urls"
HEADERS = {"x-apikey": API_KEY}

def test_key():
    try:
        # Test by scanning google.com (standard test)
        data = {"url": "https://google.com"}
        response = requests.post(URL, headers=HEADERS, data=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_key()
