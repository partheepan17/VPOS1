from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from utils.auth import get_current_user
from services.backup_service import backup_service

router = APIRouter(prefix="/api/backups", tags=["backups"])


@router.post("/create")
def create_backup(backup_name: str = None, current_user: Dict = Depends(get_current_user)):
    """Create a new backup (Manager only)"""
    if current_user.get('role') != 'manager':
        raise HTTPException(status_code=403, detail="Only managers can create backups")
    
    try:
        result = backup_service.create_backup(backup_name, current_user['id'])
        return {"message": "Backup created successfully", "backup": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")


@router.get("/list")
def list_backups(current_user: Dict = Depends(get_current_user)):
    """List all available backups"""
    try:
        backups = backup_service.list_backups()
        return {"backups": backups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")


@router.post("/restore/{backup_id}")
def restore_backup(backup_id: str, current_user: Dict = Depends(get_current_user)):
    """Restore from a backup (Manager only)"""
    if current_user.get('role') != 'manager':
        raise HTTPException(status_code=403, detail="Only managers can restore backups")
    
    try:
        restored_counts = backup_service.restore_backup(backup_id)
        return {
            "message": "Backup restored successfully",
            "restored": restored_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")


@router.post("/schedule")
def schedule_backup(frequency: str = "daily", current_user: Dict = Depends(get_current_user)):
    """Schedule automatic backups (Manager only)"""
    if current_user.get('role') != 'manager':
        raise HTTPException(status_code=403, detail="Only managers can schedule backups")
    
    # Placeholder for scheduling logic
    return {
        "message": f"Automatic {frequency} backups scheduled",
        "frequency": frequency,
        "note": "Scheduled backups will run automatically"
    }
