from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class DiscountRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rule_type: str  # line_item, category, product
    target_id: Optional[str] = None  # product_id or category name
    discount_type: str  # percent, fixed
    discount_value: float
    max_discount: float = 0.0  # cap on discount
    min_quantity: float = 0.0
    max_quantity: float = 0.0
    auto_apply: bool = False
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
