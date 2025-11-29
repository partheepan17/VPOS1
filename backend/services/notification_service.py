import os
from typing import List, Dict, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone


class NotificationService:
    def __init__(self):
        # Email configuration
        self.smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        self.smtp_user = os.environ.get('SMTP_USER', '')
        self.smtp_password = os.environ.get('SMTP_PASSWORD', '')
        self.from_email = os.environ.get('FROM_EMAIL', self.smtp_user)
        self.from_name = os.environ.get('FROM_NAME', 'POS System')
        
        # SMS configuration (placeholder - integrate with service like Twilio)
        self.sms_enabled = os.environ.get('SMS_ENABLED', 'false').lower() == 'true'
        self.sms_api_key = os.environ.get('SMS_API_KEY', '')
        
        self.email_enabled = bool(self.smtp_user and self.smtp_password)
        
        if self.email_enabled:
            print(f"✅ Email notifications enabled: {self.from_email}")
        else:
            print("⚠️  Email notifications disabled (configure SMTP credentials)")
    
    def send_email(self, to_email: str, subject: str, body: str, html_body: str = None) -> bool:
        """Send an email notification"""
        if not self.email_enabled:
            print(f"📧 Email not sent (disabled): {subject} to {to_email}")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach text and HTML versions
            msg.attach(MIMEText(body, 'plain'))
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            print(f"✅ Email sent: {subject} to {to_email}")
            return True
        except Exception as e:
            print(f"❌ Email send failed: {str(e)}")
            return False
    
    def send_low_stock_alert(self, products: List[Dict], manager_email: str) -> bool:
        """Send low stock alert to manager"""
        if not products:
            return False
        
        subject = f"⚠️ Low Stock Alert - {len(products)} Products"
        
        # Plain text version
        body = f"Low Stock Alert - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}\n\n"
        body += f"{len(products)} products are running low on stock:\n\n"
        for product in products:
            body += f"- {product['name_en']} (SKU: {product['sku']})\n"
            body += f"  Current Stock: {product['stock']} | Reorder Level: {product['reorder_level']}\n\n"
        
        # HTML version
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #e53e3e;">⚠️ Low Stock Alert</h2>
            <p>{len(products)} products are running low on stock:</p>
            <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f7fafc;">
                        <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Product</th>
                        <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">Current Stock</th>
                        <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">Reorder Level</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        for product in products:
            html_body += f"""
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 12px;">
                        <strong>{product['name_en']}</strong><br>
                        <small>SKU: {product['sku']}</small>
                    </td>
                    <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center; color: #e53e3e; font-weight: bold;">
                        {product['stock']}
                    </td>
                    <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: center;">
                        {product['reorder_level']}
                    </td>
                </tr>
            """
        
        html_body += """
                </tbody>
            </table>
            <p style="margin-top: 20px; color: #718096;">
                Please restock these items to maintain inventory levels.
            </p>
        </body>
        </html>
        """
        
        return self.send_email(manager_email, subject, body, html_body)
    
    def send_sales_receipt(self, customer_email: str, sale_data: Dict) -> bool:
        """Send sales receipt to customer"""
        if not customer_email:
            return False
        
        subject = f"Receipt - Invoice #{sale_data.get('invoice_number', 'N/A')}"
        
        # Plain text version
        body = f"Thank you for your purchase!\n\n"
        body += f"Invoice: {sale_data.get('invoice_number')}\n"
        body += f"Date: {sale_data.get('created_at')}\n"
        body += f"Total: LKR {sale_data.get('total', 0):.2f}\n\n"
        body += "Items:\n"
        for item in sale_data.get('items', []):
            body += f"- {item.get('name')} x {item.get('quantity')} = LKR {item.get('total', 0):.2f}\n"
        
        # HTML version
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2d3748; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Sales Receipt</h1>
            </div>
            <div style="padding: 20px;">
                <p><strong>Invoice:</strong> {sale_data.get('invoice_number')}</p>
                <p><strong>Date:</strong> {sale_data.get('created_at')}</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #f7fafc;">
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: left;">Item</th>
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">Qty</th>
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">Price</th>
                            <th style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
        """
        
        for item in sale_data.get('items', []):
            html_body += f"""
                <tr>
                    <td style="border: 1px solid #e2e8f0; padding: 10px;">{item.get('name')}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">{item.get('quantity')}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">LKR {item.get('unit_price', 0):.2f}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">LKR {item.get('total', 0):.2f}</td>
                </tr>
            """
        
        html_body += f"""
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                            <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right; font-weight: bold;">LKR {sale_data.get('total', 0):.2f}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <p style="text-align: center; color: #718096; margin-top: 30px;">
                    Thank you for your business!
                </p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(customer_email, subject, body, html_body)
    
    def send_adjustment_notification(self, manager_email: str, adjustment: Dict, requester_name: str) -> bool:
        """Send stock adjustment approval request to manager"""
        subject = f"📝 Stock Adjustment Request - {adjustment.get('reason', 'N/A')}"
        
        body = f"New stock adjustment request from {requester_name}\n\n"
        body += f"Product ID: {adjustment.get('product_id')}\n"
        body += f"Quantity: {adjustment.get('quantity')}\n"
        body += f"Reason: {adjustment.get('reason')}\n"
        body += f"Notes: {adjustment.get('notes', 'N/A')}\n\n"
        body += "Please review and approve/reject this request in the system."
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>📝 Stock Adjustment Request</h2>
            <p>New request from <strong>{requester_name}</strong></p>
            <table style="margin: 20px 0;">
                <tr><td><strong>Product ID:</strong></td><td>{adjustment.get('product_id')}</td></tr>
                <tr><td><strong>Quantity:</strong></td><td style="color: #e53e3e; font-weight: bold;">-{adjustment.get('quantity')}</td></tr>
                <tr><td><strong>Reason:</strong></td><td>{adjustment.get('reason')}</td></tr>
                <tr><td><strong>Notes:</strong></td><td>{adjustment.get('notes', 'N/A')}</td></tr>
            </table>
            <p style="color: #718096;">Please review and approve/reject this request in the POS system.</p>
        </body>
        </html>
        """
        
        return self.send_email(manager_email, subject, body, html_body)
    
    def send_daily_sales_summary(self, manager_email: str, summary: Dict) -> bool:
        """Send daily sales summary report"""
        subject = f"📊 Daily Sales Summary - {summary.get('date', 'N/A')}"
        
        body = f"Daily Sales Summary\n"
        body += f"Date: {summary.get('date')}\n\n"
        body += f"Total Sales: {summary.get('total_sales', 0)}\n"
        body += f"Total Revenue: LKR {summary.get('total_revenue', 0):.2f}\n"
        body += f"Total Discount: LKR {summary.get('total_discount', 0):.2f}\n"
        body += f"Average Sale: LKR {summary.get('average_sale', 0):.2f}\n"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>📊 Daily Sales Summary</h2>
            <p><strong>Date:</strong> {summary.get('date')}</p>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0;">
                <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; color: #718096;">Total Sales</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">{summary.get('total_sales', 0)}</p>
                </div>
                <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; color: #718096;">Total Revenue</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #38a169;">LKR {summary.get('total_revenue', 0):.2f}</p>
                </div>
                <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; color: #718096;">Total Discount</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #e53e3e;">LKR {summary.get('total_discount', 0):.2f}</p>
                </div>
                <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; color: #718096;">Average Sale</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">LKR {summary.get('average_sale', 0):.2f}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(manager_email, subject, body, html_body)
    
    def send_sms(self, phone_number: str, message: str) -> bool:
        """
        Send SMS notification (placeholder - integrate with Twilio or similar)
        """
        if not self.sms_enabled:
            print(f"📱 SMS not sent (disabled): {message} to {phone_number}")
            return False
        
        # TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
        print(f"📱 SMS: {message} to {phone_number}")
        return True


# Singleton instance
notification_service = NotificationService()
