import requests
import sys

creds = {"email": "test@gmail.com", "password": "testpass"}
token = requests.post("http://localhost:3000/api/auth/login", json=creds).json()["token"]
headers = {"Authorization": "Bearer "+token}

if (len(sys.argv) > 1):
    url = f"http://localhost:3000/api/questions{sys.argv[1]}"
    print("Using url", url)
    response = requests.delete(url, headers=headers)
    print(response.text)
else:
    print("Please provide something to delete")
