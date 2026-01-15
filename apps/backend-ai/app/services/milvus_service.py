from pymilvus import connections, utility, Collection, FieldSchema, CollectionSchema, DataType
import logging
from app.core.config import settings

logger = logging.getLogger("uvicorn")

class MilvusService:
    def __init__(self):
        self.collection_name = settings.COLLECTION_NAME
        self._collection = None

    def connect(self):
        try:
            if not connections.has_connection("default"):
                logger.info(f"Connecting to Milvus at {settings.MILVUS_HOST}:{settings.MILVUS_PORT}...")
                connections.connect(alias="default", host=settings.MILVUS_HOST, port=settings.MILVUS_PORT)
                self._load_collection()
        except Exception as e:
            logger.error(f"Milvus Connect Error: {e}")

    def _load_collection(self):
        if utility.has_collection(self.collection_name):
            self._collection = Collection(self.collection_name)
            self._collection.load()
            logger.info(f"Loaded collection: {self.collection_name}")
        else:
            self._create_collection()

    def _create_collection(self):
        # Define Schema matching logical needs
        fields = [
            FieldSchema(name="candidate_id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=settings.DIMENSION),
            FieldSchema(name="location", dtype=DataType.VARCHAR, max_length=200),
            FieldSchema(name="experience", dtype=DataType.INT64),
            # Array types for advanced filtering
            FieldSchema(name="location_tokens", dtype=DataType.ARRAY, element_type=DataType.VARCHAR, max_capacity=50, max_length=100)
        ]
        schema = CollectionSchema(fields, "Candidate Skill Embeddings")
        self._collection = Collection(self.collection_name, schema)
        
        index_params = {"metric_type": "L2", "index_type": "IVF_FLAT", "params": {"nlist": 128}}
        self._collection.create_index(field_name="embedding", index_params=index_params)
        self._collection.load()
        logger.info(f"Created collection: {self.collection_name}")

    def upsert_candidate(self, candidate_id: str, vector: list, metadata: dict):
        if not self._collection:
            self.connect()

        # Delete existing if any (Upsert simulation)
        # Note: Milvus Upsert is supported in newer versions, but delete-insert is safe
        try:
            self._collection.delete(f'candidate_id in ["{candidate_id}"]')
        except Exception:
            pass
        
        # Prepare Data
        # Order must match Schema fields [id, embedding, location, experience, loc_tokens]
        location = metadata.get("location", "Unknown")
        experience = metadata.get("experience", 0)
        loc_tokens = metadata.get("location_tokens", [])

        data = [
            [candidate_id],
            [vector],
            [location],
            [experience],
            [loc_tokens]
        ]
        self._collection.insert(data)
        self._collection.flush()

    def search(self, vector: list, limit=10, expr=None):
        if not self._collection:
            self.connect()
            
        search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
        results = self._collection.search(
            data=[vector], 
            anns_field="embedding", 
            param=search_params, 
            limit=limit,
            expr=expr,
            output_fields=["candidate_id", "location", "experience"]
        )
        return results

milvus_service = MilvusService()
