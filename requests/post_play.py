import requests
import json
import sys

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

if not (len(sys.argv) > 2):
    sys.exit("Not enough args!")

data = { "answer": sys.argv[2] }   

url = f"http://localhost:3000/api/questions{sys.argv[1]}"
print("Using url", url)
response = requests.post(url, json=data, headers=headers)
    
print(json.dumps(response.json(), indent=2))
