from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str = ""
    email: str = ""
    category: str = "retail"  # retail, wholesale, credit, other
    default_tier: str = "retail"
    address: str = ""
    tax_id: str = ""
    notes: str = ""
    active: bool = True
    loyalty_points: float = 0.0
    lifetime_loyalty_points: float = 0.0
    loyalty_tier: str = "bronze"  # bronze, silver, gold, platinum
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
