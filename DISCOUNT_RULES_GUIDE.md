# Discount Rules - Pricing Tier Guide

## 🏷️ Important: Discount Rules Apply to Retail Tier ONLY

### Overview
Discount rules in the POS system are **automatically applied only when the "Retail" price tier is selected**. This design ensures clean pricing logic across different customer segments.

---

## 🎯 Why This Design?

### Price Tier Structure
Your POS system has 4 pricing tiers:

1. **Retail** - Standard customer pricing
2. **Wholesale** - Bulk buyer pricing (already discounted)
3. **Credit** - Customer-specific negotiated pricing
4. **Other** - Custom pricing scenarios

### The Logic
- **Wholesale, Credit, and Other tiers** already have their own **pre-set pricing** in the product database
- These tiers represent negotiated or volume-based rates that are **already discounted**
- Applying additional automatic discounts on top of these would:
  - Create pricing confusion
  - Reduce profit margins unnecessarily
  - Make financial reporting complex

### The Solution
✅ **Discount rules apply ONLY to Retail tier**
- Retail customers get standard pricing + promotional discounts
- Wholesale/Credit/Other customers get their tier-specific pricing (no additional discounts)

---

## 📊 How It Works

### Backend Logic (`/api/discount-rules/apply`)

```python
def apply_discount_rules(cart_items, price_tier):
    # Check tier first
    if price_tier.lower() != "retail":
        # Reset any discounts
        for item in cart_items:
            item['discount_amount'] = 0
            item['discount_percent'] = 0
            item['total'] = item['subtotal']
        return {"items": cart_items, "message": "Discounts not applicable"}
    
    # Only proceed for retail tier
    # Apply discount rules...
```

### Frontend Indicators

#### 1. POS Screen - Tier Selector
- **Retail selected**: Green badge shows "✓ Discount rules active"
- **Other tier selected**: Gray info shows "ℹ️ Discounts only apply to Retail tier"

#### 2. Discount Rules Page
- Blue information banner at the top
- Clear explanation of tier-based application

---

## 💡 Use Cases

### Scenario 1: Retail Customer with Discount
```
Product: Rice 5kg
Retail Price: LKR 1,500
Quantity: 10 bags
Discount Rule: 5% off for 10+ items
---------------------------------
Subtotal: LKR 15,000
Discount (5%): -LKR 750
Total: LKR 14,250 ✅
```

### Scenario 2: Wholesale Customer (No Additional Discount)
```
Product: Rice 5kg
Wholesale Price: LKR 1,400 (already discounted)
Quantity: 10 bags
Discount Rule: NOT APPLIED
---------------------------------
Subtotal: LKR 14,000
Discount: LKR 0
Total: LKR 14,000 ✅
```

### Scenario 3: Credit Customer (Pre-negotiated Rate)
```
Product: Rice 5kg
Credit Price: LKR 1,450 (negotiated rate)
Quantity: 10 bags
Discount Rule: NOT APPLIED
---------------------------------
Subtotal: LKR 14,500
Discount: LKR 0
Total: LKR 14,500 ✅
```

---

## 🎨 Visual Indicators

### POS Screen (Right Side Panel)

**When Retail is Selected:**
```
┌─────────────────────────┐
│ Select Price Tier       │
├─────────────────────────┤
│ [✓] Retail 🏷️           │
│ [ ] Wholesale           │
│ [ ] Credit              │
│ [ ] Other               │
├─────────────────────────┤
│ ✓ Discount rules active │ ← Green badge
└─────────────────────────┘
```

**When Wholesale/Credit/Other is Selected:**
```
┌─────────────────────────┐
│ Select Price Tier       │
├─────────────────────────┤
│ [ ] Retail 🏷️           │
│ [✓] Wholesale           │
│ [ ] Credit              │
│ [ ] Other               │
├─────────────────────────┤
│ ℹ️ Discounts only apply │ ← Gray info
│    to Retail tier       │
└─────────────────────────┘
```

### Discount Rules Management Page

**Information Banner (Top):**
```
┌──────────────────────────────────────────────┐
│ ℹ️  Important: Discount Rules Apply to      │
│     Retail Tier Only                         │
│                                              │
│ Automatic discount rules are only applied   │
│ when the "Retail" price tier is selected.   │
│ Wholesale, Credit, and Other tiers have     │
│ their own pricing.                          │
└──────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Product Pricing Setup

Each product should have all four prices defined:

```javascript
{
  "sku": "RICE-001",
  "name_en": "Basmati Rice 5kg",
  "price_retail": 1500.00,     // Standard price
  "price_wholesale": 1400.00,  // Bulk discount
  "price_credit": 1450.00,     // Negotiated rate
  "price_other": 1350.00,      // Custom rate
  // ... other fields
}
```

### Discount Rule Setup

All discount rules apply to retail pricing:

```javascript
{
  "name": "Bulk Rice Discount",
  "rule_type": "category",
  "target_id": "Rice",
  "discount_type": "percent",
  "discount_value": 5,
  "min_quantity": 10,
  "auto_apply": true
}
// ℹ️ This rule only activates when Retail tier is selected
```

---

## 📈 Business Benefits

### 1. **Clear Pricing Structure**
- Each customer segment has predictable pricing
- No confusion about final prices
- Easy to explain to customers

### 2. **Profit Protection**
- Wholesale margins protected
- No accidental double-discounting
- Credit customers get their negotiated rate

### 3. **Promotional Flexibility**
- Retail discounts can be aggressive
- Target retail customers with promotions
- Don't erode wholesale margins

### 4. **Financial Clarity**
- Easy to track retail promotions
- Clear separation of pricing tiers
- Simplified reporting

---

## 🎓 Training Staff

### For Cashiers

**When checking out retail customers:**
1. Select "Retail" tier
2. Add products to cart
3. Discounts apply automatically
4. Green badge confirms rules are active

**When checking out wholesale customers:**
1. Select "Wholesale" tier
2. Add products to cart
3. Wholesale prices show (no additional discount)
4. Gray info shows discounts don't apply

### For Managers

**Setting up discount rules:**
1. All rules apply to retail tier only
2. Plan promotions for retail customers
3. Wholesale/Credit pricing stays separate
4. Use discount rules for:
   - Seasonal promotions
   - Clearance sales
   - Loyalty rewards
   - Volume incentives (retail only)

---

## ❓ FAQ

### Q: Can I apply discounts to wholesale customers?
**A:** No, automatic discount rules only work with retail tier. Wholesale customers already receive discounted pricing. If you need to give additional discounts to wholesale customers, adjust their wholesale price in the product settings.

### Q: What if a credit customer wants a promotion?
**A:** Credit customers have negotiated pricing. To give them a promotion, either:
- Temporarily adjust their credit price
- Switch them to retail tier for that transaction
- Create a manual discount (not automatic rule)

### Q: Can I create tier-specific discount rules?
**A:** Currently, no. All automatic discount rules apply to retail tier only. This is by design to maintain pricing integrity.

### Q: How do I give a one-time discount to a wholesale customer?
**A:** Use the manual discount field in the cart (discount % column) to apply a one-time discount. Automatic rules won't apply, but manual discounts work for all tiers.

---

## 🔍 Technical Details

### API Endpoint Response

**Retail Tier (Discounts Applied):**
```json
{
  "items": [
    {
      "product_id": "abc-123",
      "quantity": 10,
      "subtotal": 15000,
      "discount_amount": 750,
      "discount_percent": 5,
      "total": 14250,
      "applied_rule": "Bulk Rice Discount"
    }
  ]
}
```

**Non-Retail Tier (Discounts NOT Applied):**
```json
{
  "items": [
    {
      "product_id": "abc-123",
      "quantity": 10,
      "subtotal": 14000,
      "discount_amount": 0,
      "discount_percent": 0,
      "total": 14000
    }
  ],
  "message": "Discounts not applicable for wholesale tier"
}
```

---

## ✅ Testing Checklist

### Verify Retail Tier
- [ ] Select Retail tier in POS
- [ ] Add qualifying product (e.g., 10 rice bags)
- [ ] Verify discount applied automatically
- [ ] Check green "Discount rules active" badge shows
- [ ] Verify discount amount in cart

### Verify Wholesale Tier
- [ ] Select Wholesale tier in POS
- [ ] Add same product (10 rice bags)
- [ ] Verify NO discount applied
- [ ] Check wholesale price used
- [ ] Verify gray info message shows
- [ ] Confirm discount column shows 0

### Verify Credit Tier
- [ ] Select Credit tier in POS
- [ ] Add products
- [ ] Verify credit pricing used
- [ ] Verify NO automatic discounts
- [ ] Check info message displays

### Verify Other Tier
- [ ] Select Other tier in POS
- [ ] Add products
- [ ] Verify custom pricing used
- [ ] Verify NO automatic discounts
- [ ] Check info message displays

---

## 📚 Related Documentation

- `/app/IMPLEMENTATION_GUIDE.md` - Overall system guide
- `/app/CONFIGURATION_GUIDE.md` - Setup instructions
- `/app/DEVICE_SETUP_GUIDE.md` - Hardware configuration

---

**Last Updated**: [Current Date]
**Version**: 2.0
**Feature Status**: ✅ Active
