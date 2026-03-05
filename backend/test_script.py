import requests
response = requests.post("http://localhost:8000/api/auth/login", data={"username":"shawky", "password":"password"})
print(response.json())
