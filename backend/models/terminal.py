from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class Terminal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str = ""
    ip_address: str = ""
    active: bool = True
    last_heartbeat: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
