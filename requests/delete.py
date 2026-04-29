import requests

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

response = requests.delete("http://localhost:3000/api/questions/1", headers=headers)
print(response.text)
response = requests.delete("http://localhost:3000/api/questions/5", headers=headers)
print(response.text)
