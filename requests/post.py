import requests
import json

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

data = {
    "question": "Test",
    "choice_1": "Test",
    "choice_2": "Test",
    "choice_3": "Test",
    "choice_4": "Test",
    "solution": 1,
    "keywords": ["test"],
}

response = requests.post("http://localhost:3000/api/questions", json=data, headers=headers)
print(json.dumps(response.json(), indent=2))
