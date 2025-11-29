# Device & Hardware Setup Guide

## 🖨️ Printer Configuration

### Supported Printer Types

#### 1. Standard Printer (Letter/A4)
- **Use Case**: Full-page invoices, reports, labels
- **Requirements**: Any standard printer connected to the system
- **Format**: Letter (8.5" x 11") or A4 (210mm x 297mm)
- **Setup**: 
  - Select "Standard Printer" in Device Settings
  - Enter printer name (leave blank for system default)
  - Click "Test Standard Printer" to verify

#### 2. Thermal Receipt Printer (ESC/POS)
- **Use Case**: Fast receipt printing at checkout
- **Supported Models**:
  - Epson TM-T20, TM-T82, TM-T88
  - Star TSP143, TSP654
  - Citizen CT-S310, CT-S601
  - Any ESC/POS compatible printer
- **Connection Types**: USB, Ethernet (Network)
- **Setup**:
  - Select "Thermal Receipt Printer" in Device Settings
  - Enter printer IP address and port (default: 9100)
  - Click "Test Thermal Printer" to verify

#### 3. Both (Dual Printer Setup)
- **Use Case**: Thermal for quick receipts + Standard for detailed invoices
- **Benefits**: Best of both worlds
- **Setup**: Configure both thermal and standard settings

### Print Options
- **Auto-print receipt**: Automatically print after completing sale
- **Number of copies**: Print 1-5 copies per sale (e.g., customer + store copy)

---

## 🔍 Barcode Scanner Configuration

### Supported Scanner Types

#### 1. USB Barcode Scanner (Most Common)
- **Description**: Plug-and-play USB HID scanner
- **Setup**:
  - Connect scanner to USB port
  - No driver installation needed (works like keyboard)
  - Scanner automatically sends barcode + Enter key
- **Brands**: Honeywell, Zebra, Datalogic, Symbol

#### 2. Bluetooth Barcode Scanner
- **Description**: Wireless scanner with Bluetooth connection
- **Setup**:
  - Pair scanner with computer via Bluetooth
  - Scanner sends data to focused input field
- **Brands**: Socket Mobile, Zebra CS4070

#### 3. Integrated/Webcam Scanner
- **Description**: Use device camera or webcam to scan barcodes
- **Setup**: Browser-based scanning (requires camera permission)

### Scanner Settings

#### Scan Prefix
- **What**: Characters sent before the barcode
- **Example**: Some scanners send "$" or "*" before barcode
- **Setup**: Leave blank if not applicable

#### Scan Suffix
- **What**: Key sent after the barcode
- **Options**: 
  - Enter (most common)
  - Tab
  - None
- **Default**: Enter

#### Auto-add to Cart
- **Enabled**: Scanned items automatically added to cart
- **Disabled**: Barcode fills search field only

#### Beep on Scan
- **Enabled**: System beep confirms successful scan
- **Disabled**: Silent operation

### Testing Your Scanner
1. Click "Test Barcode Scanner" in Device Settings
2. Scan any barcode
3. System should detect and display the barcode

---

## 💰 Cash Drawer Configuration

### ESC/POS Cash Drawer
- **Connection**: Connected to thermal printer's RJ12 port
- **How it Works**: Printer sends kick code to open drawer
- **Default Kick Code**: `\x1B\x70\x00` (ESC p 0)
- **Compatible With**: Epson, Star, Citizen printers

### Setup
1. Enable "Automatic cash drawer opening" in Device Settings
2. Verify kick code (default should work for most models)
3. Drawer opens automatically on cash payment

---

## 🖥️ Customer Display (Optional)

### Pole Display / Secondary Monitor
- **Purpose**: Show item name, price to customer during checkout
- **Connection**: Serial port (RS-232) or USB-to-Serial
- **Common Ports**: COM2, /dev/ttyUSB0
- **Brands**: Logic Controls, Bematech, Partner

### Setup
1. Enable "Customer-facing display" in Device Settings
2. Enter serial port (e.g., COM2)
3. Display shows items as they're scanned/added

---

## ⌨️ Keyboard Shortcuts

### Default Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| **New Sale** | `F1` | Clear cart and start new sale |
| **Complete Sale/Pay** | `F2` | Open payment modal |
| **Search Product** | `F3` | Focus product search |
| **Focus Barcode** | `F4` | Focus barcode input field |
| **Hold Bill** | `F5` | Save current cart for later |
| **Print Invoice** | `Ctrl+P` | Print last/current invoice |
| **New Customer** | `Ctrl+N` | Add new customer |

### Customizing Shortcuts
1. Go to Settings > Devices
2. Scroll to "Keyboard Shortcuts" section
3. Enter new shortcut (e.g., "F7", "Ctrl+S", "Alt+P")
4. Click "Save Device Settings"
5. Changes take effect immediately

### Shortcut Format
- **Single Key**: `F1`, `F2`, `Escape`, `Enter`
- **With Modifier**: `Ctrl+P`, `Alt+N`, `Shift+F5`
- **Multiple Modifiers**: `Ctrl+Shift+P`

---

## 🔧 Troubleshooting

### Thermal Printer Not Working
1. **Check Network Connection**:
   ```bash
   ping 192.168.1.100  # Replace with your printer IP
   ```
2. **Verify Port**: Default ESC/POS port is 9100
3. **Firewall**: Ensure port 9100 is not blocked
4. **Test Print**: Use printer's self-test (usually hold feed button)
5. **ESC/POS Compatible**: Verify printer supports ESC/POS commands

### Barcode Scanner Not Working
1. **USB Connection**: Try different USB port
2. **Driver**: Most scanners are HID - no driver needed
3. **Test in Notepad**: Open Notepad and scan - should type barcode
4. **Suffix**: Ensure suffix is set to "Enter"
5. **Focus**: Click barcode input field before scanning

### Cash Drawer Not Opening
1. **Connection**: Verify drawer connected to printer's RJ12 port
2. **Kick Code**: Try different codes:
   - `\x1B\x70\x00` (Epson)
   - `\x1B\x70\x00\x19\xFA` (Star)
3. **Manual Test**: Printer usually has manual test function
4. **Cable**: Check RJ12 cable is not damaged

### Keyboard Shortcuts Not Working
1. **Input Focus**: Don't work when typing in input fields (except Ctrl+P)
2. **Browser Override**: Some shortcuts may be blocked by browser
3. **Reload Page**: Refresh after changing shortcuts
4. **Conflict**: Ensure no conflict with browser/OS shortcuts

---

## 📱 Hardware Recommendations

### For Small Shops (Budget)
- **Printer**: Any USB receipt printer (~$150-300)
- **Scanner**: Basic USB barcode scanner (~$30-80)
- **Drawer**: Cash drawer with printer cable (~$50-120)
- **Total**: ~$230-500

### For Medium Shops (Recommended)
- **Printer**: Epson TM-T20II or Star TSP143IIIU (~$250-400)
- **Scanner**: Honeywell Voyager 1200g (~$120)
- **Drawer**: APG Vasario cash drawer (~$150)
- **Display**: Logic Controls pole display (~$200)
- **Total**: ~$720-870

### For Large Shops (Professional)
- **Printer**: Epson TM-T88VI (Network) (~$400-550)
- **Scanner**: Zebra DS2208 (~$150)
- **Drawer**: APG Heavy-duty drawer (~$250)
- **Display**: Customer display (~$200)
- **Backup Printer**: Spare thermal printer (~$300)
- **Total**: ~$1,300-1,450

---

## 🌐 Network Printer Setup

### Finding Your Printer's IP Address

#### Method 1: Print Configuration Page
1. Turn on printer
2. Hold feed button for 5 seconds
3. Configuration page prints with network info

#### Method 2: Router Admin Panel
1. Log into router (usually 192.168.1.1)
2. Check connected devices
3. Look for printer MAC address

#### Method 3: Use Utility Software
- **Epson**: EpsonNet Config
- **Star**: Star Network Tool
- **Citizen**: Citizen Printer Utility

### Assigning Static IP (Recommended)
1. Access printer web interface (http://printer-ip)
2. Set static IP address
3. Use this IP in POS Device Settings
4. Prevents IP changes after router restart

---

## ✅ Setup Checklist

### Initial Setup
- [ ] Connect thermal printer (USB or Network)
- [ ] Configure printer in Device Settings
- [ ] Test print receipt
- [ ] Connect USB barcode scanner
- [ ] Test scanning a product
- [ ] Configure keyboard shortcuts
- [ ] Test all shortcuts
- [ ] Enable auto-print if desired
- [ ] Set number of copies (customer + store)

### Optional Devices
- [ ] Connect cash drawer to printer
- [ ] Test drawer opening
- [ ] Connect customer display
- [ ] Configure display port

### Training
- [ ] Train staff on keyboard shortcuts
- [ ] Show how to scan products
- [ ] Demonstrate printing invoices
- [ ] Explain cash drawer operation

---

## 🆘 Support

### Common Issues
- **Printer offline**: Check power, network connection
- **Scanner not reading**: Try different angle, clean scanner lens
- **Drawer stuck**: Manually open with key, check printer connection
- **Shortcuts not working**: Reload page, check for conflicts

### Getting Help
1. Check this guide first
2. Test device outside POS system (e.g., scan in Notepad)
3. Verify device works with manufacturer's software
4. Check device compatibility with your OS

---

**Last Updated**: [Current Date]
**Version**: 1.0
