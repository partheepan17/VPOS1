"""
Email Routes
Handles email receipt delivery
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from pymongo import MongoClient
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/api/email", tags=["email"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DATABASE_NAME', 'pos_system')
client = MongoClient(mongo_url)
db = client[db_name]

store_settings_col = db['store_settings']
sales_col = db['sales']


class SendReceiptRequest(BaseModel):
    invoice_number: str
    recipient_email: EmailStr
    customer_name: Optional[str] = "Customer"
    language: Optional[str] = "en"  # en, si, ta


def get_email_settings():
    """Get email settings from store settings"""
    settings = store_settings_col.find_one({}, {"_id": 0})
    if not settings or not settings.get('email_enabled'):
        return None
    return settings


def generate_receipt_html(sale, store_info, language='en'):
    """Generate HTML email template for receipt"""
    
    def get_item_name(item):
        """Get item name in selected language"""
        if language == 'si' and item.get('name_si'):
            return item.get('name_si')
        elif language == 'ta' and item.get('name_ta'):
            return item.get('name_ta')
        return item.get('name_en') or item.get('name', 'Item')
    
    logo_html = ""
    if store_info.get('show_logo') and store_info.get('logo_base64'):
        logo_html = f'<img src="{store_info["logo_base64"]}" style="max-width: 150px; margin-bottom: 20px;" />'
    
    items_html = ""
    for item in sale.get('items', []):
        item_name = get_item_name(item)
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">{item_name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">{item.get('quantity', 0)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">LKR {item.get('unit_price', 0):.2f}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">LKR {item.get('total', 0):.2f}</td>
        </tr>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 20px; }}
            .store-name {{ font-size: 24px; font-weight: bold; color: #0d9488; margin: 10px 0; }}
            .invoice-number {{ font-size: 18px; color: #666; margin: 10px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            .totals {{ background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px; }}
            .total-row {{ display: flex; justify-content: space-between; padding: 5px 0; }}
            .grand-total {{ font-size: 20px; font-weight: bold; color: #0d9488; padding-top: 10px; border-top: 2px solid #ddd; margin-top: 10px; }}
            .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                {logo_html}
                <div class="store-name">{store_info.get('store_name', 'Store')}</div>
                {f'<div>{store_info.get("store_address", "")}</div>' if store_info.get('store_address') else ''}
                {f'<div>Phone: {store_info.get("store_phone", "")}</div>' if store_info.get('store_phone') else ''}
                {f'<div>Email: {store_info.get("store_email", "")}</div>' if store_info.get('store_email') else ''}
            </div>
            
            <div class="invoice-number">Invoice: {sale.get('invoice_number', '')}</div>
            <div style="color: #666; margin-bottom: 20px;">
                Date: {sale.get('created_at', '')[:10]}<br>
                Customer: {sale.get('customer_name', 'Walk-in')}<br>
                Cashier: {sale.get('cashier_name', '')}
            </div>
            
            <table>
                <thead>
                    <tr style="background-color: #0d9488; color: white;">
                        <th style="padding: 10px; text-align: left;">Item</th>
                        <th style="padding: 10px; text-align: center;">Qty</th>
                        <th style="padding: 10px; text-align: right;">Price</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <div class="totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>LKR {sale.get('subtotal', 0):.2f}</span>
                </div>
                {f'<div class="total-row"><span>Discount:</span><span>-LKR {sale.get("total_discount", 0):.2f}</span></div>' if sale.get('total_discount', 0) > 0 else ''}
                {f'<div class="total-row"><span>Tax:</span><span>LKR {sale.get("tax_amount", 0):.2f}</span></div>' if sale.get('tax_amount', 0) > 0 else ''}
                <div class="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>LKR {sale.get('total', 0):.2f}</span>
                </div>
            </div>
            
            <div class="footer">
                <p>{store_info.get('receipt_footer', 'Thank you for your business!')}</p>
                {f'<p style="font-size: 12px; color: #999;">{store_info.get("receipt_header", "")}</p>' if store_info.get('receipt_header') else ''}
            </div>
        </div>
    </body>
    </html>
    """
    
    return html


@router.post("/send-receipt")
async def send_receipt(request: SendReceiptRequest):
    """Send receipt via email"""
    try:
        # Get email settings
        email_settings = get_email_settings()
        if not email_settings:
            raise HTTPException(status_code=400, detail="Email is not configured. Please configure SMTP settings in Store Settings.")
        
        # Get sale
        sale = sales_col.find_one({"invoice_number": request.invoice_number}, {"_id": 0})
        if not sale:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Generate email
        html_content = generate_receipt_html(sale, email_settings, request.language)
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = f"Receipt - {request.invoice_number}"
        message["From"] = email_settings.get('smtp_from_email', email_settings.get('store_email', ''))
        message["To"] = request.recipient_email
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        try:
            with smtplib.SMTP(email_settings['smtp_host'], email_settings['smtp_port']) as server:
                server.starttls()
                if email_settings.get('smtp_username') and email_settings.get('smtp_password'):
                    server.login(email_settings['smtp_username'], email_settings['smtp_password'])
                server.send_message(message)
            
            return {
                "success": True,
                "message": f"Receipt sent to {request.recipient_email}",
                "invoice_number": request.invoice_number
            }
            
        except Exception as smtp_error:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(smtp_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Send receipt failed: {str(e)}")


@router.post("/test")
async def test_email_config():
    """Test email configuration"""
    try:
        email_settings = get_email_settings()
        if not email_settings:
            raise HTTPException(status_code=400, detail="Email is not configured")
        
        # Try to connect
        with smtplib.SMTP(email_settings['smtp_host'], email_settings['smtp_port'], timeout=10) as server:
            server.starttls()
            if email_settings.get('smtp_username') and email_settings.get('smtp_password'):
                server.login(email_settings['smtp_username'], email_settings['smtp_password'])
        
        return {
            "success": True,
            "message": "Email configuration is working correctly"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email test failed: {str(e)}")
