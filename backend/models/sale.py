from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class SaleItem(BaseModel):
    product_id: str
    sku: str
    name: str
    quantity: float
    weight: float = 0.0
    unit_price: float
    discount_percent: float = 0.0
    discount_amount: float = 0.0
    subtotal: float
    total: float

class Payment(BaseModel):
    method: str  # cash, card, qr, other
    amount: float
    reference: str = ""

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str = ""
    price_tier: str = "retail"  # retail, wholesale, credit, other
    items: List[SaleItem]
    subtotal: float
    total_discount: float
    tax_amount: float = 0.0
    total: float
    payments: List[Payment]
    status: str = "completed"  # completed, hold, cancelled
    terminal_name: str = "Terminal 1"
    cashier_name: str = "Cashier"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    notes: str = ""
