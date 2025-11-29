from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from utils.auth import get_current_user
from utils.database import products_col, users_col
from services.notification_service import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/test-email")
def test_email(to_email: str, current_user: Dict = Depends(get_current_user)):
    """Test email notification"""
    success = notification_service.send_email(
        to_email,
        "Test Email from POS System",
        "This is a test email to verify your notification setup.",
        "<html><body><h2>Test Email</h2><p>Your email notifications are working correctly!</p></body></html>"
    )
    
    if success:
        return {"message": "Test email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP configuration.")


@router.post("/low-stock-alert")
def send_low_stock_alert(current_user: Dict = Depends(get_current_user)):
    """Manually trigger low stock alert"""
    # Get low stock products
    products = list(products_col.find(
        {
            "active": True,
            "$expr": {"$lte": ["$stock", "$reorder_level"]}
        },
        {"_id": 0}
    ).limit(50))
    
    if not products:
        return {"message": "No low stock products", "count": 0}
    
    # Get manager email
    manager = users_col.find_one({"role": "manager"}, {"_id": 0})
    manager_email = os.environ.get('MANAGER_EMAIL', manager.get('email', '') if manager else '')
    
    if not manager_email:
        raise HTTPException(status_code=400, detail="Manager email not configured")
    
    success = notification_service.send_low_stock_alert(products, manager_email)
    
    if success:
        return {"message": f"Low stock alert sent for {len(products)} products"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send notification")


@router.post("/sales-receipt")
def send_sales_receipt(customer_email: str, sale_data: Dict, current_user: Dict = Depends(get_current_user)):
    """Send sales receipt to customer"""
    success = notification_service.send_sales_receipt(customer_email, sale_data)
    
    if success:
        return {"message": "Sales receipt sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send receipt")


@router.get("/settings")
def get_notification_settings(current_user: Dict = Depends(get_current_user)):
    """Get notification configuration status"""
    return {
        "email_enabled": notification_service.email_enabled,
        "sms_enabled": notification_service.sms_enabled,
        "smtp_host": notification_service.smtp_host if notification_service.email_enabled else "Not configured",
        "from_email": notification_service.from_email if notification_service.email_enabled else "Not configured"
    }


import os
