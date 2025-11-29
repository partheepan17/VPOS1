from datetime import datetime, timezone
from typing import Dict
import uuid
from utils.database import products_col, stock_movements_col


def calculate_weighted_avg_cost(product_id: str, new_qty: float, new_cost: float) -> float:
    """Calculate weighted average cost for a product"""
    product = products_col.find_one({"id": product_id}, {"_id": 0})
    if not product:
        return new_cost
    
    current_stock = product.get('stock', 0)
    current_avg_cost = product.get('weighted_avg_cost', 0)
    
    if current_stock <= 0:
        return new_cost
    
    total_value = (current_stock * current_avg_cost) + (new_qty * new_cost)
    total_qty = current_stock + new_qty
    
    return round(total_value / total_qty, 2) if total_qty > 0 else new_cost


def log_stock_movement(product_id: str, movement_type: str, quantity: float, 
                       reason: str, cost_price: float, user_id: str, 
                       reference_id: str = "", notes: str = "") -> Dict:
    """Log all stock movements for audit trail"""
    movement = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "type": movement_type,  # GRN, SALE, ADJUSTMENT, OPENING
        "quantity": quantity,
        "reason": reason,
        "cost_price": cost_price,
        "user_id": user_id,
        "reference_id": reference_id,
        "notes": notes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    stock_movements_col.insert_one(movement)
    return movement
