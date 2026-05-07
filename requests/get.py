import requests
import json
import sys

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

if (len(sys.argv) > 1):
    response = requests.get(f"http://localhost:3000/api/questions{sys.argv[1]}", headers=headers)
else:
    response = requests.get("http://localhost:3000/api/questions", headers=headers)

print(json.dumps(response.json(), indent=2))

# /api/questions?keyword=space&page=1&limit=5
