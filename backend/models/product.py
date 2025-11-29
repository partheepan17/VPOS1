from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sku: str
    barcodes: List[str] = []
    name_en: str
    name_si: str = ""
    name_ta: str = ""
    unit: str = "pcs"
    category: str = ""
    tax_code: str = ""
    supplier_id: Optional[str] = None
    price_retail: float = 0.0
    price_wholesale: float = 0.0
    price_credit: float = 0.0
    price_other: float = 0.0
    stock: float = 0.0
    reorder_level: float = 0.0
    weight_based: bool = False
    packed_date: str = ""
    expire_date: str = ""
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
