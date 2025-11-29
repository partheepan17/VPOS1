from datetime import datetime, timezone
from typing import Dict, Optional
import json
import os
import uuid

# Google Cloud Storage will be configured here
try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False
    print("⚠️  google-cloud-storage not installed. Cloud backups disabled.")

from utils.database import (
    products_col, sales_col, customers_col, suppliers_col,
    discount_rules_col, users_col, backups_col
)


class BackupService:
    def __init__(self):
        self.gcs_bucket_name = os.environ.get('GCS_BUCKET_NAME', '')
        self.gcs_project_id = os.environ.get('GCS_PROJECT_ID', '')
        self.gcs_credentials_path = os.environ.get('GCS_CREDENTIALS_PATH', '')
        
        self.gcs_client = None
        self.gcs_bucket = None
        
        if GCS_AVAILABLE and self.gcs_bucket_name and self.gcs_credentials_path:
            try:
                self.gcs_client = storage.Client.from_service_account_json(
                    self.gcs_credentials_path,
                    project=self.gcs_project_id
                )
                self.gcs_bucket = self.gcs_client.bucket(self.gcs_bucket_name)
                print(f"✅ Google Cloud Storage connected: {self.gcs_bucket_name}")
            except Exception as e:
                print(f"❌ GCS connection failed: {str(e)}")
    
    def create_backup(self, backup_name: str = None, user_id: str = "system") -> Dict:
        """Create a full database backup"""
        if not backup_name:
            backup_name = f"backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        
        # Collect all data
        backup_data = {
            "backup_id": str(uuid.uuid4()),
            "backup_name": backup_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": user_id,
            "data": {
                "products": list(products_col.find({}, {"_id": 0})),
                "sales": list(sales_col.find({}, {"_id": 0}).limit(1000)),  # Last 1000 sales
                "customers": list(customers_col.find({}, {"_id": 0})),
                "suppliers": list(suppliers_col.find({}, {"_id": 0})),
                "discount_rules": list(discount_rules_col.find({}, {"_id": 0})),
                "users": list(users_col.find({}, {"_id": 0, "password": 0}))  # Exclude passwords
            }
        }
        
        # Save to MongoDB
        backups_col.insert_one(backup_data.copy())
        
        # Upload to GCS if configured
        if self.gcs_bucket:
            try:
                blob = self.gcs_bucket.blob(f"backups/{backup_name}.json")
                blob.upload_from_string(
                    json.dumps(backup_data, indent=2),
                    content_type='application/json'
                )
                backup_data['cloud_storage'] = 'gcs'
                backup_data['cloud_path'] = f"gs://{self.gcs_bucket_name}/backups/{backup_name}.json"
                print(f"✅ Backup uploaded to GCS: {backup_name}")
            except Exception as e:
                print(f"❌ GCS upload failed: {str(e)}")
                backup_data['cloud_storage'] = 'failed'
                backup_data['cloud_error'] = str(e)
        else:
            backup_data['cloud_storage'] = 'local_only'
        
        return {
            "backup_id": backup_data['backup_id'],
            "backup_name": backup_name,
            "created_at": backup_data['created_at'],
            "cloud_storage": backup_data.get('cloud_storage', 'local_only'),
            "size_mb": len(json.dumps(backup_data)) / (1024 * 1024)
        }
    
    def list_backups(self, include_cloud: bool = True) -> list:
        """List all available backups"""
        backups = []
        
        # Local backups from MongoDB
        local_backups = list(backups_col.find({}, {"_id": 0, "data": 0}).sort("created_at", -1))
        backups.extend(local_backups)
        
        # Cloud backups from GCS
        if include_cloud and self.gcs_bucket:
            try:
                blobs = self.gcs_bucket.list_blobs(prefix="backups/")
                for blob in blobs:
                    if blob.name.endswith('.json'):
                        backup_name = blob.name.split('/')[-1].replace('.json', '')
                        # Check if not already in local backups
                        if not any(b['backup_name'] == backup_name for b in backups):
                            backups.append({
                                "backup_id": backup_name,
                                "backup_name": backup_name,
                                "created_at": blob.time_created.isoformat(),
                                "cloud_storage": "gcs",
                                "cloud_path": f"gs://{self.gcs_bucket_name}/{blob.name}",
                                "size_mb": blob.size / (1024 * 1024)
                            })
            except Exception as e:
                print(f"❌ Failed to list GCS backups: {str(e)}")
        
        return backups
    
    def restore_backup(self, backup_id: str) -> Dict:
        """Restore from a backup"""
        # Try to find backup in MongoDB first
        backup = backups_col.find_one({"backup_id": backup_id}, {"_id": 0})
        
        # If not found locally, try to download from GCS
        if not backup and self.gcs_bucket:
            try:
                blob = self.gcs_bucket.blob(f"backups/{backup_id}.json")
                backup_json = blob.download_as_string()
                backup = json.loads(backup_json)
            except Exception as e:
                raise Exception(f"Backup not found: {str(e)}")
        
        if not backup or 'data' not in backup:
            raise Exception("Invalid backup data")
        
        data = backup['data']
        restored_counts = {}
        
        # Restore data (preserving existing structure)
        if "products" in data and data["products"]:
            products_col.delete_many({})
            products_col.insert_many(data["products"])
            restored_counts["products"] = len(data["products"])
        
        if "customers" in data and data["customers"]:
            customers_col.delete_many({})
            customers_col.insert_many(data["customers"])
            restored_counts["customers"] = len(data["customers"])
        
        if "suppliers" in data and data["suppliers"]:
            suppliers_col.delete_many({})
            suppliers_col.insert_many(data["suppliers"])
            restored_counts["suppliers"] = len(data["suppliers"])
        
        if "discount_rules" in data and data["discount_rules"]:
            discount_rules_col.delete_many({})
            discount_rules_col.insert_many(data["discount_rules"])
            restored_counts["discount_rules"] = len(data["discount_rules"])
        
        return restored_counts
    
    def schedule_automatic_backup(self, frequency: str = "daily"):
        """
        Schedule automatic backups
        Note: This would typically use a task scheduler like Celery or cron
        For now, this is a placeholder for the scheduling logic
        """
        # TODO: Implement with APScheduler or similar
        pass


# Singleton instance
backup_service = BackupService()
