"""
Database connection and operations for the Homeland Meals API
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Dict, Any, List
from datetime import datetime
from .config import MONGO_URL, DB_NAME

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None

    @classmethod
    async def connect(cls):
        """Create database connection"""
        try:
            cls.client = AsyncIOMotorClient(MONGO_URL)
            cls.db = cls.client[DB_NAME]
            
            # Test the connection
            await cls.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB: {DB_NAME}")
            
            # Create indexes for better performance
            await cls.create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    @classmethod
    async def disconnect(cls):
        """Close database connection"""
        if cls.client:
            cls.client.close()
            logger.info("Disconnected from MongoDB")

    @classmethod
    async def create_indexes(cls):
        """Create database indexes for better performance"""
        try:
            # User profiles indexes
            await cls.db.user_profiles.create_index("id", unique=True)
            await cls.db.user_profiles.create_index("created_at")
            
            # Food entries indexes
            await cls.db.food_entries.create_index("user_id")
            await cls.db.food_entries.create_index("date_consumed")
            await cls.db.food_entries.create_index([("user_id", 1), ("date_consumed", 1)])
            
            # Workout entries indexes
            await cls.db.workout_entries.create_index("user_id")
            await cls.db.workout_entries.create_index("date_logged")
            await cls.db.workout_entries.create_index([("user_id", 1), ("date_logged", 1)])
            
            # Recipes indexes
            await cls.db.recipes.create_index("user_id")
            await cls.db.recipes.create_index("cuisine_type")
            await cls.db.recipes.create_index("category")
            await cls.db.recipes.create_index("tags")
            await cls.db.recipes.create_index("is_favorite")
            
            # Daily stats indexes
            await cls.db.daily_stats.create_index([("user_id", 1), ("date", 1)], unique=True)
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create indexes: {str(e)}")

    @classmethod
    async def get_collection(cls, collection_name: str):
        """Get a database collection"""
        if not cls.db:
            raise RuntimeError("Database not connected")
        return cls.db[collection_name]

    @classmethod
    async def insert_document(cls, collection_name: str, document: Dict[str, Any]) -> str:
        """Insert a document into a collection"""
        try:
            collection = await cls.get_collection(collection_name)
            document['created_at'] = datetime.utcnow()
            result = await collection.insert_one(document)
            logger.debug(f"Inserted document into {collection_name}: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Failed to insert document into {collection_name}: {str(e)}")
            raise

    @classmethod
    async def find_document(cls, collection_name: str, filter_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single document in a collection"""
        try:
            collection = await cls.get_collection(collection_name)
            document = await collection.find_one(filter_dict)
            if document:
                document['_id'] = str(document['_id'])
            return document
        except Exception as e:
            logger.error(f"Failed to find document in {collection_name}: {str(e)}")
            raise

    @classmethod
    async def find_documents(cls, collection_name: str, filter_dict: Dict[str, Any] = None, 
                           sort_by: str = None, limit: int = None) -> List[Dict[str, Any]]:
        """Find multiple documents in a collection"""
        try:
            collection = await cls.get_collection(collection_name)
            cursor = collection.find(filter_dict or {})
            
            if sort_by:
                cursor = cursor.sort(sort_by, -1)  # Descending order by default
            if limit:
                cursor = cursor.limit(limit)
            
            documents = await cursor.to_list(length=limit)
            for doc in documents:
                doc['_id'] = str(doc['_id'])
            
            logger.debug(f"Found {len(documents)} documents in {collection_name}")
            return documents
        except Exception as e:
            logger.error(f"Failed to find documents in {collection_name}: {str(e)}")
            raise

    @classmethod
    async def update_document(cls, collection_name: str, filter_dict: Dict[str, Any], 
                            update_dict: Dict[str, Any]) -> bool:
        """Update a document in a collection"""
        try:
            collection = await cls.get_collection(collection_name)
            update_dict['updated_at'] = datetime.utcnow()
            result = await collection.update_one(filter_dict, {"$set": update_dict})
            logger.debug(f"Updated document in {collection_name}: matched={result.matched_count}, modified={result.modified_count}")
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Failed to update document in {collection_name}: {str(e)}")
            raise

    @classmethod
    async def delete_document(cls, collection_name: str, filter_dict: Dict[str, Any]) -> bool:
        """Delete a document from a collection"""
        try:
            collection = await cls.get_collection(collection_name)
            result = await collection.delete_one(filter_dict)
            logger.debug(f"Deleted document from {collection_name}: {result.deleted_count}")
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Failed to delete document from {collection_name}: {str(e)}")
            raise

    @classmethod
    async def aggregate(cls, collection_name: str, pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Perform aggregation on a collection"""
        try:
            collection = await cls.get_collection(collection_name)
            cursor = collection.aggregate(pipeline)
            documents = await cursor.to_list(length=None)
            logger.debug(f"Aggregation returned {len(documents)} documents from {collection_name}")
            return documents
        except Exception as e:
            logger.error(f"Failed to perform aggregation on {collection_name}: {str(e)}")
            raise

# Global database instance
db = Database()