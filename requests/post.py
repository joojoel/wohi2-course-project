import requests
import json
import sys

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

data = {
    "question": "Test",
    "choice_1": "Test",
    "choice_2": "Test",
    "choice_3": "Test",
    "choice_4": "Test",
    "solution": "1",
    "keywords": ["test"],
}

if (len(sys.argv) > 1):
    url = f"http://localhost:3000/api/questions{sys.argv[1]}"
    print("Using url", url)
    response = requests.post(url, json=data, headers=headers)
else:
    url = "http://localhost:3000/api/questions"
    print("Using url", url)
    response = requests.post(url, json=data, headers=headers)
    
print(json.dumps(response.json(), indent=2))
