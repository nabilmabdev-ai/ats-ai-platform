
import requests
import json

url = "http://localhost:8000/generate-job-description"
payload = {
    "title": "Software Engineer",
    "notes": "Must know React",
    "template_mode": False
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response:", response.json())
    else:
        print("Error:", response.text)
except Exception as e:
    print(f"Request failed: {e}")
