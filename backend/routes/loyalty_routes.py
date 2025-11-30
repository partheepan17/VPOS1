"""
Loyalty Program Routes
Handles customer loyalty points, rewards, and redemption
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timedelta
import os
from pymongo import MongoClient, DESCENDING

from models.loyalty import (
    LoyaltySettings, 
    LoyaltyTransaction, 
    RedeemPointsRequest, 
    RedeemPointsResponse
)

router = APIRouter(prefix="/api/loyalty", tags=["loyalty"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DATABASE_NAME', 'pos_system')
client = MongoClient(mongo_url)
db = client[db_name]

loyalty_settings_col = db['loyalty_settings']
loyalty_transactions_col = db['loyalty_transactions']
customers_col = db['customers']


def get_loyalty_settings():
    """Get current loyalty settings or create default"""
    settings = loyalty_settings_col.find_one({}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = LoyaltySettings().dict()
        loyalty_settings_col.insert_one(default_settings)
        return default_settings
    return settings


def calculate_customer_tier(lifetime_points: float):
    """Calculate customer tier based on lifetime points"""
    settings = get_loyalty_settings()
    
    if lifetime_points >= settings['tier_platinum_threshold']:
        return 'platinum'
    elif lifetime_points >= settings['tier_gold_threshold']:
        return 'gold'
    elif lifetime_points >= settings['tier_silver_threshold']:
        return 'silver'
    else:
        return 'bronze'


def calculate_points_earned(sale_total: float, customer_id: str = None):
    """Calculate points earned for a purchase"""
    settings = get_loyalty_settings()
    
    if not settings['enabled']:
        return 0
    
    if sale_total < settings['min_purchase_for_points']:
        return 0
    
    # Base points calculation
    base_points = sale_total / settings['points_per_currency']
    
    # Apply tier multiplier if customer exists
    if customer_id:
        customer = customers_col.find_one({"id": customer_id}, {"_id": 0})
        if customer:
            tier = customer.get('loyalty_tier', 'bronze')
            multiplier = settings['tier_multipliers'].get(tier, 1.0)
            base_points *= multiplier
    
    return round(base_points, 2)


@router.get("/settings")
async def get_settings():
    """Get loyalty program settings"""
    try:
        settings = get_loyalty_settings()
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/settings")
async def update_settings(settings: LoyaltySettings):
    """Update loyalty program settings"""
    try:
        settings_dict = settings.dict()
        settings_dict['updated_at'] = datetime.utcnow().isoformat()
        
        loyalty_settings_col.delete_many({})
        loyalty_settings_col.insert_one(settings_dict)
        
        return {"message": "Loyalty settings updated", "settings": settings_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customers/{customer_id}/points")
async def get_customer_points(customer_id: str):
    """Get customer's current points balance and tier"""
    try:
        customer = customers_col.find_one({"id": customer_id}, {"_id": 0})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        points_balance = customer.get('loyalty_points', 0)
        lifetime_points = customer.get('lifetime_loyalty_points', 0)
        tier = customer.get('loyalty_tier', 'bronze')
        
        return {
            "customer_id": customer_id,
            "customer_name": customer.get('name', ''),
            "points_balance": points_balance,
            "lifetime_points": lifetime_points,
            "tier": tier,
            "tier_benefits": get_loyalty_settings()['tier_multipliers'].get(tier, 1.0)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customers/{customer_id}/transactions")
async def get_customer_transactions(customer_id: str, limit: int = 50):
    """Get customer's loyalty transaction history"""
    try:
        transactions = list(loyalty_transactions_col.find(
            {"customer_id": customer_id},
            {"_id": 0}
        ).sort("created_at", DESCENDING).limit(limit))
        
        return {
            "customer_id": customer_id,
            "transactions": transactions,
            "total_transactions": len(transactions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/award")
async def award_points(customer_id: str, sale_total: float, invoice_number: str):
    """Award loyalty points for a purchase"""
    try:
        customer = customers_col.find_one({"id": customer_id}, {"_id": 0})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Calculate points
        points_earned = calculate_points_earned(sale_total, customer_id)
        
        if points_earned <= 0:
            return {
                "success": False,
                "message": "No points awarded (below minimum or loyalty disabled)",
                "points_earned": 0
            }
        
        # Update customer points
        current_balance = customer.get('loyalty_points', 0)
        lifetime_points = customer.get('lifetime_loyalty_points', 0)
        new_balance = current_balance + points_earned
        new_lifetime = lifetime_points + points_earned
        
        # Calculate new tier
        new_tier = calculate_customer_tier(new_lifetime)
        
        customers_col.update_one(
            {"id": customer_id},
            {"$set": {
                "loyalty_points": new_balance,
                "lifetime_loyalty_points": new_lifetime,
                "loyalty_tier": new_tier
            }}
        )
        
        # Record transaction
        settings = get_loyalty_settings()
        expires_at = None
        if settings.get('points_expiry_days'):
            expires_at = (datetime.utcnow() + timedelta(days=settings['points_expiry_days'])).isoformat()
        
        transaction = LoyaltyTransaction(
            customer_id=customer_id,
            transaction_type='earn',
            points=points_earned,
            reference_type='sale',
            reference_id=invoice_number,
            balance_after=new_balance,
            description=f"Points earned from purchase {invoice_number}",
            expires_at=expires_at
        )
        
        loyalty_transactions_col.insert_one(transaction.dict())
        
        return {
            "success": True,
            "message": "Points awarded successfully",
            "points_earned": points_earned,
            "new_balance": new_balance,
            "tier": new_tier
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/redeem", response_model=RedeemPointsResponse)
async def redeem_points(request: RedeemPointsRequest):
    """Redeem loyalty points for discount"""
    try:
        settings = get_loyalty_settings()
        
        if not settings['enabled']:
            raise HTTPException(status_code=400, detail="Loyalty program is disabled")
        
        # Get customer
        customer = customers_col.find_one({"id": request.customer_id}, {"_id": 0})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        current_balance = customer.get('loyalty_points', 0)
        
        # Validate redemption
        if request.points < settings['min_points_for_redemption']:
            raise HTTPException(
                status_code=400, 
                detail=f"Minimum {settings['min_points_for_redemption']} points required"
            )
        
        if request.points > current_balance:
            raise HTTPException(status_code=400, detail="Insufficient points balance")
        
        # Calculate discount
        discount_amount = request.points * settings['currency_per_point']
        max_discount = request.sale_total * (settings['max_redemption_percent'] / 100)
        
        if discount_amount > max_discount:
            # Adjust points to max allowed discount
            discount_amount = max_discount
            actual_points = int(discount_amount / settings['currency_per_point'])
        else:
            actual_points = request.points
        
        # Update customer balance
        new_balance = current_balance - actual_points
        customers_col.update_one(
            {"id": request.customer_id},
            {"$set": {"loyalty_points": new_balance}}
        )
        
        # Record transaction
        transaction = LoyaltyTransaction(
            customer_id=request.customer_id,
            transaction_type='redeem',
            points=-actual_points,
            reference_type='sale',
            balance_after=new_balance,
            description=f"Redeemed {actual_points} points for LKR {discount_amount:.2f} discount"
        )
        
        loyalty_transactions_col.insert_one(transaction.dict())
        
        return RedeemPointsResponse(
            success=True,
            discount_amount=round(discount_amount, 2),
            points_redeemed=actual_points,
            new_balance=new_balance,
            message=f"Redeemed {actual_points} points for LKR {discount_amount:.2f} discount"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_loyalty_stats():
    """Get overall loyalty program statistics"""
    try:
        # Count customers by tier
        total_customers = customers_col.count_documents({"loyalty_points": {"$exists": True}})
        
        tier_counts = {
            "bronze": customers_col.count_documents({"loyalty_tier": "bronze"}),
            "silver": customers_col.count_documents({"loyalty_tier": "silver"}),
            "gold": customers_col.count_documents({"loyalty_tier": "gold"}),
            "platinum": customers_col.count_documents({"loyalty_tier": "platinum"})
        }
        
        # Total points in circulation
        pipeline = [
            {"$group": {
                "_id": None,
                "total_points": {"$sum": "$loyalty_points"},
                "total_lifetime_points": {"$sum": "$lifetime_loyalty_points"}
            }}
        ]
        
        result = list(customers_col.aggregate(pipeline))
        total_points = result[0]['total_points'] if result else 0
        total_lifetime = result[0]['total_lifetime_points'] if result else 0
        
        # Recent transactions
        recent_transactions = loyalty_transactions_col.count_documents({})
        
        return {
            "enabled": get_loyalty_settings()['enabled'],
            "total_customers": total_customers,
            "tier_distribution": tier_counts,
            "total_points_in_circulation": total_points,
            "total_lifetime_points_awarded": total_lifetime,
            "total_transactions": recent_transactions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
