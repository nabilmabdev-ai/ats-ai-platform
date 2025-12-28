import requests
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = "http://localhost:8000"

def verify_filtering():
    print("🚀 Starting Search Filtering Verification...")

    # 1. Define Test Candidates
    target_candidate = {
        "candidate_id": "test_target_001",
        "text": "Senior Software Engineer with React and Node.js experience.",
        "location": "Casablanca, Morocco",
        "experience": 5
    }

    distractor_candidate = {
        "candidate_id": "test_distractor_002",
        "text": "Senior Software Engineer with React and Node.js experience.",
        "location": "New York, US",
        "experience": 5
    }

    # 2. Vectorize Candidates
    print("INSERTING candidates...")
    try:
        res1 = requests.post(f"{BASE_URL}/vectorize-candidate", json=target_candidate)
        res1.raise_for_status()
        print(f"✅ Inserted Target: {res1.json()}")

        res2 = requests.post(f"{BASE_URL}/vectorize-candidate", json=distractor_candidate)
        res2.raise_for_status()
        print(f"✅ Inserted Distractor: {res2.json()}")
    except Exception as e:
        print(f"❌ Failed to insert candidates: {e}")
        return

    # Wait for indexing (Milvus flush is called in API, but good to be safe)
    time.sleep(2)

    # 3. Test Search with Exact Case Filter
    print("\nTEST 1: Search with Exact Case Filter ('Morocco')")
    search_payload_1 = {
        "query": "Software Engineer",
        "limit": 10,
        "location": "Morocco"
    }
    try:
        res = requests.post(f"{BASE_URL}/search-candidates", json=search_payload_1)
        res.raise_for_status()
        matches = res.json()["matches"]
        
        # Verify only target is returned
        ids = [m["candidate_id"] for m in matches]
        print(f"Found IDs: {ids}")
        
        if "test_target_001" in ids and "test_distractor_002" not in ids:
            print("✅ TEST 1 PASSED: Only target found.")
        else:
            print("❌ TEST 1 FAILED: Incorrect results.")
    except Exception as e:
        if hasattr(e, 'response') and e.response is not None:
             print(f"❌ TEST 1 ERROR: {e} - {e.response.text}")
        else:
             print(f"❌ TEST 1 ERROR: {e}")

    # 4. Test Search with Lower Case Filter
    print("\nTEST 2: Search with Lower Case Filter ('morocco')")
    search_payload_2 = {
        "query": "Software Engineer",
        "limit": 10,
        "location": "morocco"
    }
    try:
        res = requests.post(f"{BASE_URL}/search-candidates", json=search_payload_2)
        res.raise_for_status()
        matches = res.json()["matches"]
        
        # Verify only target is returned
        ids = [m["candidate_id"] for m in matches]
        print(f"Found IDs: {ids}")
        
        if "test_target_001" in ids and "test_distractor_002" not in ids:
            print("✅ TEST 2 PASSED: Only target found (Case Insensitive works).")
        else:
            print("❌ TEST 2 FAILED: Incorrect results.")
    except Exception as e:
        if hasattr(e, 'response') and e.response is not None:
             print(f"❌ TEST 2 ERROR: {e} - {e.response.text}")
        else:
             print(f"❌ TEST 2 ERROR: {e}")

    # 5. Test Search with Prefix Filter (Now Token Match)
    print("\nTEST 3: Search with Token Match ('Casablanca')")
    search_payload_3 = {
        "query": "Software Engineer",
        "limit": 10,
        "location": "Casablanca"
    }
    try:
        res = requests.post(f"{BASE_URL}/search-candidates", json=search_payload_3)
        res.raise_for_status()
        matches = res.json()["matches"]
        
        ids = [m["candidate_id"] for m in matches]
        print(f"Found IDs: {ids}")
        
        if "test_target_001" in ids and "test_distractor_002" not in ids:
            print("✅ TEST 3 PASSED: Token match works.")
        else:
            print("❌ TEST 3 FAILED: Token match failed.")
    except Exception as e:
        if hasattr(e, 'response') and e.response is not None:
             print(f"❌ TEST 3 ERROR: {e} - {e.response.text}")
        else:
             print(f"❌ TEST 3 ERROR: {e}")

if __name__ == "__main__":
    verify_filtering()
