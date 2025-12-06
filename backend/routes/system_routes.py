"""
System Settings Routes
Manages system-wide feature toggles and configurations
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import os
from pymongo import MongoClient
from datetime import datetime

from models.system_settings import SystemSettings

router = APIRouter(prefix="/api/system", tags=["system"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DATABASE_NAME', 'pos_system')
client = MongoClient(mongo_url)
db = client[db_name]

system_settings_col = db['system_settings']


def get_system_settings():
    """Get current system settings or create default"""
    settings = system_settings_col.find_one({}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = SystemSettings().dict()
        system_settings_col.insert_one(default_settings)
        return default_settings
    return settings


@router.get("/settings")
async def get_settings():
    """Get system settings"""
    try:
        settings = get_system_settings()
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings")
async def update_settings(settings: SystemSettings):
    """Update system settings"""
    try:
        settings_dict = settings.dict()
        settings_dict['updated_at'] = datetime.utcnow().isoformat()
        
        # Delete all existing settings and insert new one
        system_settings_col.delete_many({})
        system_settings_col.insert_one(settings_dict)
        
        return {"message": "System settings updated", "settings": settings_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/settings")
async def update_settings_partial(settings: Dict):
    """Partially update system settings"""
    try:
        settings['updated_at'] = datetime.utcnow().isoformat()
        
        # Update only provided fields
        result = system_settings_col.update_one(
            {},
            {"$set": settings},
            upsert=True
        )
        
        updated_settings = get_system_settings()
        
        return {"message": "Settings updated", "settings": updated_settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings/reset")
async def reset_settings():
    """Reset system settings to defaults"""
    try:
        default_settings = SystemSettings().dict()
        
        system_settings_col.delete_many({})
        system_settings_col.insert_one(default_settings)
        
        return {"message": "Settings reset to defaults", "settings": default_settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
