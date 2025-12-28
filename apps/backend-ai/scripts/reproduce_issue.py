import requests
import json
import time

url = "http://localhost:8000/generate-job-description"
payload = {
    "title": "comptable",
    "notes": "",
    "template_mode": True
}

print(f"Sending request to {url} with payload: {payload}")
start_time = time.time()
try:
    response = requests.post(url, json=payload, timeout=120) # Set a long timeout to see if it eventually returns
    end_time = time.time()
    print(f"Status Code: {response.status_code}")
    print(f"Time taken: {end_time - start_time:.2f} seconds")
    print(f"Response: {response.text[:500]}...")
except Exception as e:
    end_time = time.time()
    print(f"Error: {e}")
    print(f"Time taken before error: {end_time - start_time:.2f} seconds")
