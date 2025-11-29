from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from utils.auth import get_current_user
from utils.database import settings_col

router = APIRouter(prefix="/api", tags=["devices"])


@router.get("/settings/devices")
def get_device_settings(current_user: Dict = Depends(get_current_user)):
    """Get device configuration settings"""
    settings = settings_col.find_one({"type": "devices"}, {"_id": 0})
    if not settings:
        # Return default device settings
        return {
            "printer_type": "standard",
            "thermal_printer_ip": "",
            "thermal_printer_port": "9100",
            "thermal_printer_name": "",
            "standard_printer_name": "",
            "auto_print_receipt": False,
            "print_copies": 1,
            "barcode_scanner_type": "usb",
            "barcode_prefix": "",
            "barcode_suffix": "Enter",
            "auto_add_to_cart": True,
            "beep_on_scan": True,
            "cash_drawer_enabled": False,
            "cash_drawer_kick_code": "\\x1B\\x70\\x00",
            "customer_display_enabled": False,
            "customer_display_port": "COM2",
            "shortcut_new_sale": "F1",
            "shortcut_complete_sale": "F2",
            "shortcut_hold_bill": "F5",
            "shortcut_search_product": "F3",
            "shortcut_print_invoice": "Ctrl+P",
            "shortcut_new_customer": "Ctrl+N",
            "shortcut_barcode_focus": "F4"
        }
    return settings


@router.post("/settings/devices")
def save_device_settings(settings: Dict, current_user: Dict = Depends(get_current_user)):
    """Save device configuration settings (Manager only)"""
    if current_user.get('role') != 'manager':
        raise HTTPException(status_code=403, detail="Only managers can modify device settings")
    
    settings['type'] = 'devices'
    settings_col.update_one(
        {"type": "devices"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Device settings saved successfully"}


@router.post("/devices/test-printer")
def test_printer(test_data: Dict, current_user: Dict = Depends(get_current_user)):
    """Test printer connection"""
    printer_type = test_data.get('printer_type', 'standard')
    config = test_data.get('config', {})
    
    # This is a placeholder for actual printer testing
    # In production, you would:
    # 1. For thermal printers: Send ESC/POS commands to IP:Port
    # 2. For standard printers: Use system print dialog
    
    # Example response:
    return {
        "success": True,
        "message": f"{printer_type} printer test successful",
        "details": {
            "printer_type": printer_type,
            "status": "online",
            "test_print": "sent"
        }
    }


@router.get("/devices/detect-scanner")
def detect_barcode_scanner(current_user: Dict = Depends(get_current_user)):
    """Detect connected barcode scanners"""
    # This is a placeholder for actual scanner detection
    # In production, you would detect USB HID devices
    
    return {
        "scanners": [
            {"name": "USB Barcode Scanner", "type": "usb", "status": "connected"},
        ]
    }
