import requests
import json
import time

URL = "http://localhost:8001/generate-scorecard"
PAYLOAD = {"role_title": "Senior Python Developer"}

def test_autofill():
    print(f"Sending POST request to {URL}...")
    try:
        start_time = time.time()
        response = requests.post(URL, json=PAYLOAD, timeout=30)
        end_time = time.time()
        
        print(f"Status Code: {response.status_code}")
        print(f"Time Taken: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("Error Response:")
            print(response.text)
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 seconds.")
    except requests.exceptions.ConnectionError:
        print("❌ Connection refused. Is the backend-ai server running?")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    test_autofill()
