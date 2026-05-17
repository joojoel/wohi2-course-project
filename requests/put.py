import requests

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

data = {
    "question": "Test2",
    "choice_1": "Test2",
    "choice_2": "Test2",
    "choice_3": "Test2",
    "choice_4": "Test2",
    "solution": 2,
    "keywords": ["test2"],
}

response = requests.put("http://localhost:3000/api/questions/1", headers=headers, json=data)
print(response.text)
response = requests.put("http://localhost:3000/api/questions/5", headers=headers, json=data)
print(response.text)
