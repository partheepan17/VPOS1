# ⌨️ Keyboard Shortcuts Guide

## POS Screen Quick Actions

| Shortcut | Action | Description |
|----------|--------|-------------|
| **F2** | 💰 Pay | Opens the payment modal to complete the sale |
| **F3** | 🗑️ Clear Cart | Clears all items from the shopping cart |
| **F4** | 🔍 Focus Barcode | Returns focus to the barcode input field |
| **Enter** | ✅ Submit | Submits barcode entry or confirms actions |
| **Tab** | ➡️ Navigate | Moves focus to the next input field |
| **Shift + Tab** | ⬅️ Navigate Back | Moves focus to the previous input field |

## Workflow Shortcuts

### Fast Checkout Flow:
1. **Scan** or type barcode + **Enter**
2. Repeat for all items
3. Press **F2** to pay
4. Select payment method (1-3 keys or Tab)
5. **Enter** to confirm
6. Invoice appears automatically

### Quick Cart Management:
- **F3** - Clear entire cart quickly
- **F4** - Jump back to barcode input anytime
- **Tab** through cart items to edit quantities/discounts

## Tips for Maximum Speed

### Barcode Scanning:
- Keep focus in barcode input (auto-focused)
- Scanner must simulate keyboard input
- System auto-detects rapid input (< 100ms between characters)
- No need to click - just scan continuously

### Price Tier Selection:
- Use Tab to navigate to tier buttons
- Space or Enter to select
- Or click directly

### Customer Selection:
- Tab to customer dropdown
- Arrow keys to navigate
- Enter to select
- Customer's default tier applies automatically

### Discount Entry:
- Tab to discount % field on cart item
- Enter percentage value
- Discount auto-calculates

### Payment:
- F2 opens payment modal
- Tab cycles through: method → amount → confirm
- Enter on confirm button completes sale

## Advanced Shortcuts (Future Phases)

*Coming in later phases:*
- **F5** - Hold current bill
- **F6** - Resume held bill
- **F7** - Open calculator
- **F8** - Search products
- **F9** - Quick add customer
- **F10** - Reports
- **F11** - Settings
- **Ctrl + P** - Print last invoice
- **Ctrl + S** - Save draft
- **Esc** - Close modal/cancel action

## Barcode Scanner Configuration

### Required Settings:
- **Mode**: HID Keyboard Emulation (not Serial/USB)
- **Suffix**: Enter key (CR) recommended
- **Prefix**: None required
- **Speed**: Fast (system handles 100ms detection)

### Testing Scanner:
1. Open Notepad or text editor
2. Scan a barcode
3. If text appears followed by newline, scanner is correct
4. If nothing appears, check USB connection and driver
5. If random characters, check scanner's keyboard layout setting

## Mouse-Free Operation

You can complete an entire sale without touching the mouse:

1. **Start**: Focus is already in barcode field
2. **Scan items**: Just scan or type barcodes
3. **Adjust quantity**: Tab to qty field, type number
4. **Add discount**: Tab to discount field, type %
5. **Select customer**: Tab to customer dropdown, arrow keys, Enter
6. **Change tier**: Tab to tier buttons, Space to select
7. **Process payment**: F2, Tab to fields, Enter
8. **Print invoice**: Tab to Print button, Enter
9. **New sale**: Tab to New Sale button, Enter

## Language-Specific Shortcuts

### Sinhala Input:
- Switch to Sinhala keyboard layout on OS
- Or use language selector in UI
- Product names display in Sinhala automatically

### Tamil Input:
- Switch to Tamil keyboard layout on OS
- Or use language selector in UI
- Product names display in Tamil automatically

## Accessibility Features

- **Tab Order**: Logical flow through all interactive elements
- **Enter Key**: Activates focused buttons
- **Escape Key**: Closes modals (in modals)
- **Arrow Keys**: Navigate dropdowns and lists
- **Space**: Toggles checkboxes and some buttons

## Performance Tips

### Fastest Workflow:
1. Keep barcode input focused (F4)
2. Use physical barcode scanner (not manual entry)
3. Use F2 for payment (not clicking)
4. Use F3 for clearing (not clicking)
5. Train on keyboard shortcuts for 1 day
6. After training, achieve < 30 seconds per sale

### Target Times:
- **Expert**: 15-20 seconds per sale (5-7 items)
- **Intermediate**: 30-40 seconds per sale
- **Beginner**: 60 seconds per sale

## Common Mistakes to Avoid

❌ **Don't** click in barcode field every time
✅ **Do** use F4 or keep it focused

❌ **Don't** manually type barcodes
✅ **Do** use scanner for speed

❌ **Don't** click Pay button
✅ **Do** press F2

❌ **Don't** clear items one by one
✅ **Do** press F3 to clear all

❌ **Don't** navigate with mouse between fields
✅ **Do** use Tab key

## Print Configuration

### Browser Print (Standard):
- **Ctrl + P** in invoice view
- Select printer
- Adjust print settings if needed
- Click Print

### Thermal Printer (ESC/POS):
- Auto-prints when configured
- No browser print dialog
- Requires ESC/POS compatible printer
- Configure in Settings (future phase)

## Multi-Terminal Note

In future phases with multi-terminal support:
- Each terminal will have unique shortcuts
- Terminal-specific settings will be available
- Shortcuts can be customized per terminal
- Manager overrides will be available

---

**Master these shortcuts to achieve the 300+ invoices/day target! 🚀**

*Practice makes perfect. Use keyboard shortcuts for 1 week to build muscle memory.*
