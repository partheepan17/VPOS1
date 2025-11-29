from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str = ""
    email: str = ""
    address: str = ""
    tax_id: str = ""
    notes: str = ""
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
