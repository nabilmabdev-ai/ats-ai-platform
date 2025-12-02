import requests
import json

url = "http://localhost:8001/generate-job-description"
payload = {
    "title": "Software Engineer",
    "notes": "Test job",
    "template_mode": False
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload, timeout=60) # Increased timeout
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:200]}...")
except Exception as e:
    print(f"Error: {e}")
