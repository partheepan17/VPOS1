from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SaleTemplate(BaseModel):
    id: str
    name: str
    product_ids: List[str]  # Just product IDs, no quantities
    created_by: str
    created_at: datetime
    is_active: bool = True
    usage_count: int = 0
    last_used: Optional[datetime] = None

class SaleTemplateCreate(BaseModel):
    name: str
    product_ids: List[str]

class SaleTemplateUpdate(BaseModel):
    name: Optional[str] = None
    product_ids: Optional[List[str]] = None
    is_active: Optional[bool] = None
