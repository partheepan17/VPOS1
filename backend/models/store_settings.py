from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class StoreSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Store Information
    store_name: str = "My Store"
    store_address: str = ""
    store_phone: str = ""
    store_email: str = ""
    store_website: str = ""
    tax_id: str = ""
    
    # Receipt Customization
    logo_url: Optional[str] = None
    logo_base64: Optional[str] = None  # Store logo as base64
    receipt_header: str = ""
    receipt_footer: str = "Thank you for your business!"
    show_logo: bool = True
    show_store_info: bool = True
    show_tax_id: bool = False
    
    # Label Printing
    label_template: str = "standard"  # standard, compact, detailed
    label_size: str = "50x30"  # 50x30mm, 40x25mm, 60x40mm
    show_price_on_label: bool = True
    show_barcode_text: bool = True
    
    # Email Settings
    email_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
