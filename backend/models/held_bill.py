from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
import uuid

class HeldBill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_name: str
    customer_id: str = ""
    customer_name: str = ""
    price_tier: str = "retail"
    items: List[dict] = []
    subtotal: float = 0.0
    total_discount: float = 0.0
    total: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    terminal_name: str = "Terminal 1"
    cashier_name: str = "Cashier"
