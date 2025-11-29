import csv
import io
from typing import List, Dict, Any
from datetime import datetime

def validate_product_csv(data: List[Dict[str, Any]]) -> tuple[bool, List[str], List[Dict]]:
    """Validate product CSV data"""
    errors = []
    valid_rows = []
    required_fields = ['sku', 'name_en', 'price_retail']
    
    for i, row in enumerate(data, start=1):
        row_errors = []
        
        # Check required fields
        for field in required_fields:
            if not row.get(field):
                row_errors.append(f"Row {i}: Missing required field '{field}'")
        
        # Validate prices
        for price_field in ['price_retail', 'price_wholesale', 'price_credit', 'price_other']:
            if row.get(price_field):
                try:
                    float(row[price_field])
                except ValueError:
                    row_errors.append(f"Row {i}: Invalid price in '{price_field}'")
        
        # Validate stock
        if row.get('stock'):
            try:
                float(row['stock'])
            except ValueError:
                row_errors.append(f"Row {i}: Invalid stock value")
        
        if row_errors:
            errors.extend(row_errors)
        else:
            valid_rows.append(row)
    
    return len(errors) == 0, errors, valid_rows

def validate_customer_csv(data: List[Dict[str, Any]]) -> tuple[bool, List[str], List[Dict]]:
    """Validate customer CSV data"""
    errors = []
    valid_rows = []
    required_fields = ['name']
    valid_categories = ['retail', 'wholesale', 'credit', 'other']
    
    for i, row in enumerate(data, start=1):
        row_errors = []
        
        # Check required fields
        for field in required_fields:
            if not row.get(field):
                row_errors.append(f"Row {i}: Missing required field '{field}'")
        
        # Validate category
        if row.get('category') and row['category'] not in valid_categories:
            row_errors.append(f"Row {i}: Invalid category. Must be one of {valid_categories}")
        
        if row_errors:
            errors.extend(row_errors)
        else:
            valid_rows.append(row)
    
    return len(errors) == 0, errors, valid_rows

def validate_supplier_csv(data: List[Dict[str, Any]]) -> tuple[bool, List[str], List[Dict]]:
    """Validate supplier CSV data"""
    errors = []
    valid_rows = []
    required_fields = ['name']
    
    for i, row in enumerate(data, start=1):
        row_errors = []
        
        # Check required fields
        for field in required_fields:
            if not row.get(field):
                row_errors.append(f"Row {i}: Missing required field '{field}'")
        
        if row_errors:
            errors.extend(row_errors)
        else:
            valid_rows.append(row)
    
    return len(errors) == 0, errors, valid_rows

def validate_discount_rule_csv(data: List[Dict[str, Any]]) -> tuple[bool, List[str], List[Dict]]:
    """Validate discount rule CSV data"""
    errors = []
    valid_rows = []
    required_fields = ['name', 'rule_type', 'discount_type', 'discount_value']
    valid_rule_types = ['line_item', 'category', 'product', 'group']
    valid_discount_types = ['percent', 'fixed']
    
    for i, row in enumerate(data, start=1):
        row_errors = []
        
        # Check required fields
        for field in required_fields:
            if not row.get(field):
                row_errors.append(f"Row {i}: Missing required field '{field}'")
        
        # Validate rule_type
        if row.get('rule_type') and row['rule_type'] not in valid_rule_types:
            row_errors.append(f"Row {i}: Invalid rule_type. Must be one of {valid_rule_types}")
        
        # Validate discount_type
        if row.get('discount_type') and row['discount_type'] not in valid_discount_types:
            row_errors.append(f"Row {i}: Invalid discount_type. Must be one of {valid_discount_types}")
        
        # Validate discount_value
        if row.get('discount_value'):
            try:
                float(row['discount_value'])
            except ValueError:
                row_errors.append(f"Row {i}: Invalid discount_value")
        
        if row_errors:
            errors.extend(row_errors)
        else:
            valid_rows.append(row)
    
    return len(errors) == 0, errors, valid_rows

def products_to_csv(products: List[Dict]) -> str:
    """Convert products to CSV string"""
    if not products:
        return ""
    
    output = io.StringIO()
    fieldnames = ['sku', 'barcodes', 'name_en', 'name_si', 'name_ta', 'unit', 'category', 
                  'tax_code', 'supplier_id', 'price_retail', 'price_wholesale', 'price_credit', 
                  'price_other', 'stock', 'reorder_level', 'weight_based', 'active']
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for product in products:
        row = {k: product.get(k, '') for k in fieldnames}
        # Convert list to comma-separated string
        if isinstance(row.get('barcodes'), list):
            row['barcodes'] = ','.join(row['barcodes'])
        writer.writerow(row)
    
    return output.getvalue()

def customers_to_csv(customers: List[Dict]) -> str:
    """Convert customers to CSV string"""
    if not customers:
        return ""
    
    output = io.StringIO()
    fieldnames = ['name', 'phone', 'email', 'category', 'default_tier', 'address', 'tax_id', 'notes', 'active']
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for customer in customers:
        row = {k: customer.get(k, '') for k in fieldnames}
        writer.writerow(row)
    
    return output.getvalue()

def suppliers_to_csv(suppliers: List[Dict]) -> str:
    """Convert suppliers to CSV string"""
    if not suppliers:
        return ""
    
    output = io.StringIO()
    fieldnames = ['name', 'phone', 'email', 'address', 'tax_id', 'notes', 'active']
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for supplier in suppliers:
        row = {k: supplier.get(k, '') for k in fieldnames}
        writer.writerow(row)
    
    return output.getvalue()

def discount_rules_to_csv(rules: List[Dict]) -> str:
    """Convert discount rules to CSV string"""
    if not rules:
        return ""
    
    output = io.StringIO()
    fieldnames = ['name', 'rule_type', 'target_id', 'discount_type', 'discount_value', 
                  'max_discount', 'min_quantity', 'max_quantity', 'auto_apply', 'active']
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for rule in rules:
        row = {k: rule.get(k, '') for k in fieldnames}
        writer.writerow(row)
    
    return output.getvalue()

def sales_to_csv(sales: List[Dict]) -> str:
    """Convert sales to CSV string"""
    if not sales:
        return ""
    
    output = io.StringIO()
    fieldnames = ['invoice_number', 'customer_name', 'price_tier', 'subtotal', 
                  'total_discount', 'tax_amount', 'total', 'status', 'created_at']
    
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for sale in sales:
        row = {k: sale.get(k, '') for k in fieldnames}
        writer.writerow(row)
    
    return output.getvalue()

def parse_csv_content(content: str) -> List[Dict[str, Any]]:
    """Parse CSV content string to list of dicts"""
    reader = csv.DictReader(io.StringIO(content))
    return list(reader)
