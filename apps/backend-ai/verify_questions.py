import requests
import json

url = "http://localhost:8000/generate-interview-questions"

payload = {
    "job_title": "Senior Frontend Engineer",
    "job_description": "We are looking for a React expert with experience in Next.js and Tailwind CSS.",
    "skills": ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    "candidate_name": "John Doe"
}

try:
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        print("✅ Success! Generated Questions:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Failed with status {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ Error: {e}")
