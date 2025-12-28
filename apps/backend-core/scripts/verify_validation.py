import requests
import json

API_URL = "http://localhost:3001/jobs"

def test_create_job_validation():
    print("--- Testing Job Creation Validation ---")
    
    # Case 1: Empty Title (Should fail)
    payload_empty_title = {
        "title": "",
        "descriptionText": "Some description",
        "salaryMin": 50000,
        "salaryMax": 60000
    }
    
    try:
        res = requests.post(API_URL, json=payload_empty_title)
        print(f"Case 1 (Empty Title): Status {res.status_code}")
        if res.status_code == 400:
            print("Response:", json.dumps(res.json(), indent=2))
        else:
            print("FAILED: Expected 400")
    except Exception as e:
        print(f"Case 1 Failed to connect: {e}")

    print("\n")

    # Case 2: Salary Max < Min (Should fail with custom validator)
    payload_invalid_salary = {
        "title": "Valid Title",
        "descriptionText": "Some description",
        "salaryMin": 80000,
        "salaryMax": 40000
    }

    try:
        res = requests.post(API_URL, json=payload_invalid_salary)
        print(f"Case 2 (Invalid Salary): Status {res.status_code}")
        if res.status_code == 400:
            print("Response:", json.dumps(res.json(), indent=2))
        else:
            print("FAILED: Expected 400")
    except Exception as e:
        print(f"Case 2 Failed to connect: {e}")

if __name__ == "__main__":
    test_create_job_validation()
