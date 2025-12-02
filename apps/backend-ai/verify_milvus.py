import os
import sys
from pymilvus import connections, Collection, utility
import google.generativeai as genai
from dotenv import load_dotenv

# Load env to get keys if needed (assuming .env is in apps/backend-ai)
load_dotenv("apps/backend-ai/.env")

# Mock GenAI to avoid API calls if possible, or just use a dummy vector
# For this test, we can just insert random vectors if we don't care about semantic match quality,
# but we care about filtering.

COLLECTION_NAME = "candidate_profiles_v2"
MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost")
MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")

def verify_milvus_filtering():
    print("Connecting to Milvus...")
    connections.connect(alias="default", host=MILVUS_HOST, port=MILVUS_PORT)
    
    # Force create if not exists (since we bumped version in code but didn't run app yet)
    # Actually, let's try to run the app logic to create it? 
    # Or just replicate creation logic here for test if it doesn't exist.
    
    from pymilvus import FieldSchema, CollectionSchema, DataType
    
    if not utility.has_collection(COLLECTION_NAME):
        print(f"Collection {COLLECTION_NAME} does not exist. Creating it for test...")
        DIMENSION = 768
        fields = [
            FieldSchema(name="candidate_id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIMENSION),
            FieldSchema(name="location", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="experience", dtype=DataType.INT64) 
        ]
        schema = CollectionSchema(fields, "Candidate Skill Embeddings with Metadata")
        candidate_collection = Collection(COLLECTION_NAME, schema)
        index_params = {"metric_type": "L2", "index_type": "IVF_FLAT", "params": {"nlist": 128}}
        candidate_collection.create_index(field_name="embedding", index_params=index_params)
        candidate_collection.load()
    
    collection = Collection(COLLECTION_NAME)
    collection.load()
    print(f"Collection {COLLECTION_NAME} loaded. Num entities: {collection.num_entities}")

    # Insert Test Data
    # We need 768-dim vectors. 
    import random
    dim = 768
    
    # Candidate A: London, Exp 5
    id_a = "test_candidate_london"
    vec_a = [random.random() for _ in range(dim)]
    loc_a = "London, UK"
    exp_a = 5
    
    # Candidate B: New York, Exp 10
    id_b = "test_candidate_ny"
    vec_b = [random.random() for _ in range(dim)] # Same vector to test filter!
    loc_b = "New York, USA"
    exp_b = 10

    print("Inserting test candidates...")
    collection.insert([
        [id_a, id_b],
        [vec_a, vec_b],
        [loc_a, loc_b],
        [exp_a, exp_b]
    ])
    collection.flush()
    
    # Search with Location Filter "London"
    print("\nTest 1: Filter by Location 'London'")
    search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
    results = collection.search(
        data=[vec_a], # Search with A's vector
        anns_field="embedding",
        param=search_params,
        limit=10,
        expr='location like "London%"',
        output_fields=["candidate_id", "location"]
    )
    
    found_london = False
    found_ny = False
    for hits in results:
        for hit in hits:
            print(f" - Found: {hit.id}, Loc: {hit.entity.get('location')}")
            if hit.id == id_a: found_london = True
            if hit.id == id_b: found_ny = True
            
    if found_london and not found_ny:
        print("✅ Test 1 Passed: Found London candidate, excluded NY candidate.")
    else:
        print("❌ Test 1 Failed.")

    # Search with Experience Filter >= 8
    print("\nTest 2: Filter by Experience >= 8")
    results = collection.search(
        data=[vec_a], 
        anns_field="embedding",
        param=search_params,
        limit=10,
        expr='experience >= 8',
        output_fields=["candidate_id", "experience"]
    )
    
    found_london = False
    found_ny = False
    for hits in results:
        for hit in hits:
            print(f" - Found: {hit.id}, Exp: {hit.entity.get('experience')}")
            if hit.id == id_a: found_london = True
            if hit.id == id_b: found_ny = True

    if found_ny and not found_london:
        print("✅ Test 2 Passed: Found NY candidate (Exp 10), excluded London (Exp 5).")
    else:
        print("❌ Test 2 Failed.")

    # Cleanup
    print("\nCleaning up test data...")
    collection.delete(f'candidate_id in ["{id_a}", "{id_b}"]')
    collection.flush()
    print("Done.")

if __name__ == "__main__":
    verify_milvus_filtering()
