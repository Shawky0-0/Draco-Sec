import requests
token_res = requests.post("http://localhost:8000/auth/login", json={"username":"shawky", "password":"password"})
print("login status:", token_res.status_code)
token = token_res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}
me_res = requests.get("http://localhost:8000/auth/me", headers=headers)
print("GET me:", me_res.json())
update_res = requests.put("http://localhost:8000/auth/me", headers=headers, json={"telegram_chat_id": "999"})
print("PUT me:", update_res.json())
me_res2 = requests.get("http://localhost:8000/auth/me", headers=headers)
print("GET me 2:", me_res2.json())
