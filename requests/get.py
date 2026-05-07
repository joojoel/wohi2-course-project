import requests
import json
import sys

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

if (len(sys.argv) > 1):
    url = f"http://localhost:3000/api/questions{sys.argv[1]}"
    print("Using url", url)
    response = requests.get(url, headers=headers)
else:
    url = "http://localhost:3000/api/questions"
    print("Using url", url)
    response = requests.get(url, headers=headers)

print(json.dumps(response.json(), indent=2))

# /api/questions?keyword=space&page=1&limit=5
