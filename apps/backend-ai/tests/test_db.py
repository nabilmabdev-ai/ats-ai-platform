from pymilvus import connections, utility

print("Testing connection to Milvus...")
try:
    # Try connecting to localhost
    connections.connect(alias="default", host="localhost", port="19530")
    print("✅ Connection Successful!")
    
    # List collections to verify read access
    colls = utility.list_collections()
    print(f"✅ Collections found: {colls}")
    
except Exception as e:
    print(f"❌ Connection Failed: {e}")