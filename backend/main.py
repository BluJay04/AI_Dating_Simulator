import logging
import sys
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from pymongo.errors import PyMongoError
from dotenv import load_dotenv
import os
import certifi
from services import ai_service

# Setup logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="AI Dating Simulator", version="1.0")

# MongoDB Connection
try:
    MONGO_URI="mongodb+srv://amannazar:93Wba62TM6R1oVf0@cluster0.6dpok.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true"
    if not MONGO_URI:
        raise ValueError("MONGO_URI is missing from environment variables.")

    logger.info("🚀 Connecting to MongoDB...")
    client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())
    db = client["dating_sim"]
    characters_collection = db["characters"]
    chats_collection = db["chats"]
    logger.info("✅ MongoDB connection successful!")

except Exception as e:
    logger.error(f"❌ MongoDB Connection Failed: {str(e)}")
    sys.exit(1)

# Pydantic Models
class Character(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    personality: str = Field(..., min_length=10)
    hobbies: List[str] = Field(..., min_items=1)

    @validator('hobbies')
    def validate_hobbies(cls, v):
        if not all(isinstance(hobby, str) and hobby.strip() for hobby in v):
            raise ValueError("All hobbies must be non-empty strings")
        return v

class ChatRequest(BaseModel):
    character1: Character
    character2: Character
    conversation: str = Field(..., min_length=1)
    judge_feedback: Optional[str] = Field(default="")

class ChatResponse(BaseModel):
    status: str
    reply: str
    timestamp: datetime

class ErrorResponse(BaseModel):
    error: str
    details: Optional[dict]
    status_code: int

# Custom Exception Class
class ChatAPIException(Exception):
    def __init__(self, message: str, status_code: int = 500, details: Optional[dict] = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)

# Exception Handler
@app.exception_handler(ChatAPIException)
async def chat_exception_handler(request, exc: ChatAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details or {},
            "status_code": exc.status_code
        }
    )

# API Endpoints
@app.get("/test_db")
async def test_db():
    try:
        logger.info("🔍 Testing MongoDB connection...")
        sample_character = characters_collection.find_one()
        return {"message": "MongoDB is connected", "sample_character": sample_character}
    except Exception as e:
        logger.error(f"❌ MongoDB Test Error: {str(e)}")
        return {"error": str(e)}

@app.post("/create_character/", response_model=dict)
async def create_character(character: Character):
    try:
        logger.info(f"📝 Creating new character: {character.name}")
        existing_character = characters_collection.find_one({"name": character.name})
        if existing_character:
            raise ChatAPIException(
                message="Character already exists",
                status_code=400,
                details={"name": character.name}
            )

        result = characters_collection.insert_one(character.dict())
        return {
            "message": "Character created successfully",
            "character": character.dict(),
            "id": str(result.inserted_id)
        }
    except ChatAPIException as e:
        raise e
    except Exception as e:
        logger.error(f"❌ Error creating character: {str(e)}")
        raise ChatAPIException(message="Failed to create character", status_code=500, details={"error": str(e)})

@app.post("/chat/", response_model=ChatResponse)
async def chat(data: ChatRequest):
    try:
        logger.info(f"💬 Received chat request between {data.character1.name} and {data.character2.name}")
        
        # Verify characters exist
        character1_exists = characters_collection.find_one({"name": data.character1.name})
        character2_exists = characters_collection.find_one({"name": data.character2.name})

        if not character1_exists or not character2_exists:
            raise ChatAPIException(
                message="One or both characters not found",
                status_code=404,
                details={"character1_exists": bool(character1_exists), "character2_exists": bool(character2_exists)}
            )

        # Generate AI response
        ai_response = ai_service.generate_ai_response(
            data.character1.dict(),
            data.character2.dict(),
            data.conversation,
            data.judge_feedback
        )

        # Save to database
        chats_collection.update_one(
            {"characters": [data.character1.name, data.character2.name]},
            {"$push": {"messages": {
                "sender": data.character1.name,
                "text": ai_response,
                "timestamp": datetime.utcnow()
            }}},
            upsert=True
        )

        return ChatResponse(
            status="success",
            reply=ai_response,
            timestamp=datetime.utcnow()
        )

    except ChatAPIException as e:
        raise e
    except Exception as e:
        logger.error(f"⚠️ Unexpected error: {str(e)}")
        raise ChatAPIException(message="An unexpected error occurred", status_code=500, details={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting FastAPI Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)


import pymongo

uri = "mongodb+srv://amannazar:93Wba62TM6R1oVf0@cluster0.6dpok.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true"
client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000, heartbeatFrequencyMS=10000)

try:
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
except pymongo.errors.ServerSelectionTimeoutError as err:
    print(f"❌ MongoDB Connection Failed: {err}")