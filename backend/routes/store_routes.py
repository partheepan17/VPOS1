"""
Store Settings Routes
Handles store configuration, receipt customization, and email settings
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
import os
import base64
from pymongo import MongoClient
from datetime import datetime

from models.store_settings import StoreSettings

router = APIRouter(prefix="/api/store", tags=["store"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DATABASE_NAME', 'pos_system')
client = MongoClient(mongo_url)
db = client[db_name]

store_settings_col = db['store_settings']


def get_store_settings():
    """Get current store settings or create default"""
    settings = store_settings_col.find_one({}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = StoreSettings().dict()
        store_settings_col.insert_one(default_settings)
        return default_settings
    return settings


@router.get("/settings")
async def get_settings():
    """Get store settings"""
    try:
        settings = get_store_settings()
        # Don't send SMTP password to frontend
        if 'smtp_password' in settings:
            settings['smtp_password'] = '***' if settings.get('smtp_password') else ''
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings")
async def update_settings(settings: StoreSettings):
    """Update store settings"""
    try:
        settings_dict = settings.dict()
        settings_dict['updated_at'] = datetime.utcnow().isoformat()
        
        # If password is masked, keep the old one
        if settings_dict.get('smtp_password') == '***':
            old_settings = get_store_settings()
            settings_dict['smtp_password'] = old_settings.get('smtp_password', '')
        
        store_settings_col.delete_many({})
        store_settings_col.insert_one(settings_dict)
        
        return {"message": "Store settings updated", "settings": settings_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logo/upload")
async def upload_logo(file: UploadFile = File(...)):
    """Upload store logo"""
    try:
        # Read file content
        content = await file.read()
        
        # Convert to base64
        base64_logo = base64.b64encode(content).decode('utf-8')
        mime_type = file.content_type or 'image/png'
        logo_data = f"data:{mime_type};base64,{base64_logo}"
        
        # Update settings
        settings = get_store_settings()
        settings['logo_base64'] = logo_data
        settings['show_logo'] = True
        settings['updated_at'] = datetime.utcnow().isoformat()
        
        store_settings_col.update_one({}, {"$set": settings}, upsert=True)
        
        return {
            "message": "Logo uploaded successfully",
            "logo_data": logo_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logo upload failed: {str(e)}")


@router.delete("/logo")
async def delete_logo():
    """Delete store logo"""
    try:
        store_settings_col.update_one(
            {},
            {"$set": {
                "logo_base64": None,
                "logo_url": None,
                "show_logo": False,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        return {"message": "Logo deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
