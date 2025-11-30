from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class LoyaltySettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enabled: bool = True
    points_per_currency: float = 1.0  # 1 point per X LKR spent
    currency_per_point: float = 1.0   # 1 point = X LKR discount
    min_purchase_for_points: float = 0.0  # Minimum purchase to earn points
    min_points_for_redemption: int = 10  # Minimum points needed to redeem
    max_redemption_percent: float = 50.0  # Max % of bill that can be paid with points
    points_expiry_days: Optional[int] = None  # Points expire after X days (None = never)
    tier_bronze_threshold: int = 0
    tier_silver_threshold: int = 500
    tier_gold_threshold: int = 2000
    tier_platinum_threshold: int = 5000
    tier_multipliers: dict = {
        "bronze": 1.0,
        "silver": 1.2,
        "gold": 1.5,
        "platinum": 2.0
    }
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class LoyaltyTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    transaction_type: str  # 'earn' or 'redeem'
    points: float
    reference_type: str  # 'sale' or 'manual'
    reference_id: Optional[str] = None  # invoice_number for sales
    balance_after: float
    description: str = ""
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: Optional[str] = None


class RedeemPointsRequest(BaseModel):
    customer_id: str
    points: int
    sale_total: float


class RedeemPointsResponse(BaseModel):
    success: bool
    discount_amount: float
    points_redeemed: int
    new_balance: float
    message: str
