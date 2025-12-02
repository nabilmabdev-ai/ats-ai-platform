import requests
import json
import sys

API_URL = "http://localhost:3001"
TEMPLATE_ID = "7db58aa0-7f76-4b09-b0a4-bfa19fa8b3e4"
JOB_TITLE = "Senior Backend Engineer"
REGION = "FR"

def verify_generation():
    print(f"--- Verifying Generation (Scenario B) ---")
    url = f"{API_URL}/jobs/ai-generate"
    payload = {
        "title": JOB_TITLE,
        "notes": "",
        "templateId": TEMPLATE_ID,
        "region": REGION
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code != 201 and res.status_code != 200:
            print(f"Generation failed: {res.status_code} {res.text}")
            return None
        
        data = res.json()
        description = data.get("description", "")
        
        # Checks
        static_text = "This is a mandatory hardcoded introduction for all Engineering roles at Acme Corp."
        if static_text in description:
            print("[PASS] Static Integrity: Static text found.")
        else:
            print("[FAIL] Static Integrity: Static text NOT found.")
            print(f"Description start: {description[:200]}")

        if "Backend" in description or "Node" in description or "API" in description:
             print("[PASS] Dynamic Generation: Backend keywords found.")
        else:
             print("[FAIL] Dynamic Generation: Backend keywords NOT found.")
        
        # Legal check - assuming legal block adds some specific text or just checking it exists
        # In the template editor, LEGAL block adds {{> legal_block}}. 
        # The backend should replace this. I'll check if the placeholder is gone.
        if "{{> legal_block}}" not in description:
             print("[PASS] Legal Injection: Placeholder replaced.")
        else:
             print("[FAIL] Legal Injection: Placeholder {{> legal_block}} still present.")

        return data
    except Exception as e:
        print(f"Error during generation: {e}")
        return None

def verify_publish(generated_data):
    print(f"\n--- Verifying Publish (Scenario C & Phase 3) ---")
    if not generated_data:
        print("Skipping publish due to generation failure.")
        return

    description = generated_data.get("description", "")
    # Manual Override
    description += "\n\n[MANUAL OVERRIDE: Verified by Antigravity]"
    
    url = f"{API_URL}/jobs"
    payload = {
        "title": JOB_TITLE,
        "descriptionText": description,
        "requirements": generated_data.get("requirements", []),
        "salaryMin": generated_data.get("salary_range", {}).get("min"),
        "salaryMax": generated_data.get("salary_range", {}).get("max"),
        "location": "Paris, France",
        "remoteType": "HYBRID",
        "knockoutQuestions": [],
        "templateId": TEMPLATE_ID
    }
    
    try:
        res = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        if res.status_code != 201:
            print(f"Publish failed: {res.status_code} {res.text}")
            return
        
        job_data = res.json()
        job_id = job_data.get("id")
        print(f"[PASS] Job Published. ID: {job_id}")
        
        # Verify Persistence
        verify_persistence(job_id, description)
        
    except Exception as e:
        print(f"Error during publish: {e}")

def verify_persistence(job_id, expected_description):
    print(f"\n--- Verifying Persistence (Phase 3) ---")
    url = f"{API_URL}/jobs/{job_id}" # Assuming GET /jobs/:id exists
    # If not, list all and find
    
    try:
        res = requests.get(url)
        if res.status_code != 200:
            # Try listing
            res = requests.get(f"{API_URL}/jobs")
            data = res.json()
            # data might be { data: [...] } or [...]
            jobs = data.get("data", []) if isinstance(data, dict) else data
            found = next((j for j in jobs if j["id"] == job_id), None)
            if not found:
                print(f"[FAIL] Job not found in list.")
                return
            job_data = found
        else:
            job_data = res.json()
            
        # Check description
        saved_desc = job_data.get("descriptionText", "")
        if expected_description == saved_desc:
            print("[PASS] Data Persistence: Description matches exactly.")
        else:
            print("[FAIL] Data Persistence: Description mismatch.")
            print(f"Expected length: {len(expected_description)}, Got: {len(saved_desc)}")
            
        # Check Title
        if job_data.get("title") == JOB_TITLE:
             print("[PASS] Metadata: Title matches.")
        else:
             print("[FAIL] Metadata: Title mismatch.")

    except Exception as e:
        print(f"Error during persistence check: {e}")

if __name__ == "__main__":
    gen_data = verify_generation()
    if gen_data:
        verify_publish(gen_data)
