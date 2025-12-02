import requests
import json

url = "http://localhost:3001/templates/job"
payload = {
    "name": "Hybrid Engineering Role",
    "structure": "# {{job_title}}\n\n## Custom Section\n\nThis is a mandatory hardcoded introduction for all Engineering roles at Acme Corp.\n\n## Responsibilities\n\n{{ai_responsibilities}}\n\n## Requirements\n\n{{ai_requirements}}\n\n## Legal Disclaimer\n\n{{> legal_block}}\n\n",
    "defaultScreeningTemplateId": None
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
