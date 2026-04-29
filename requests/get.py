import requests
import json

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

response = requests.get("http://localhost:3000/api/questions", headers=headers)
print(json.dumps(response.json(), indent=2))
