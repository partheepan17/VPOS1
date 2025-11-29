from pydantic import BaseModel, Field
import uuid

class InventoryLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    log_type: str  # receive, adjust, sale
    quantity: float
    previous_stock: float
    new_stock: float
    reference: str = ""
    notes: str = ""
    created_at: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str = "System"
