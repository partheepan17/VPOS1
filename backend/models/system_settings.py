from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class SystemSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Inventory Management
    allow_negative_stock: bool = False  # Allow sales even with 0 stock
    show_low_stock_alerts: bool = True
    auto_deduct_inventory: bool = True
    track_batch_expiry: bool = False
    
    # Sales & Checkout
    require_customer_selection: bool = False
    allow_hold_bills: bool = True
    enable_split_payment: bool = True
    auto_print_receipt: bool = False
    show_product_images: bool = False
    
    # Loyalty Program
    loyalty_enabled: bool = True
    auto_apply_loyalty_points: bool = True
    loyalty_visible_in_pos: bool = True
    
    # Discounts
    auto_apply_discounts: bool = True
    allow_manual_discount: bool = True
    require_manager_approval_discount: bool = False
    
    # Barcode & Input
    barcode_auto_submit: bool = True
    barcode_auto_submit_delay: int = 500  # milliseconds
    focus_barcode_on_load: bool = True
    
    # Printing
    auto_print_on_payment: bool = False
    print_customer_copy: bool = True
    print_store_copy: bool = False
    
    # Notifications
    sound_on_scan: bool = False
    sound_on_payment: bool = True
    show_success_animations: bool = True
    
    # Multi-language
    default_language: str = "en"  # en, si, ta
    force_language: bool = False  # Force all users to use default language
    
    # Data & Backup
    auto_backup_enabled: bool = False
    backup_frequency_hours: int = 24
    
    # Security
    session_timeout_minutes: int = 480  # 8 hours
    require_password_change: bool = False
    enable_audit_log: bool = True
    
    # Email
    email_receipts_enabled: bool = False
    auto_email_on_request: bool = False
    
    # Advanced
    enable_offline_mode: bool = False
    cache_products: bool = True
    debug_mode: bool = False
    
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
