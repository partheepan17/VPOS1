from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient, ASCENDING, DESCENDING
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
import uuid
import json
import io
import csv_utils

load_dotenv()

app = FastAPI(title="POS System API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection with connection pooling
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
db_name = os.environ.get('DATABASE_NAME', 'pos_system')

# Configure connection pooling for production
client = MongoClient(
    mongo_url,
    maxPoolSize=50,  # Maximum connections in the pool
    minPoolSize=10,  # Minimum connections maintained
    maxIdleTimeMS=30000,  # Close idle connections after 30 seconds
    serverSelectionTimeoutMS=5000,  # Timeout for server selection
    connectTimeoutMS=10000,  # Connection timeout
    socketTimeoutMS=30000,  # Socket timeout
    retryWrites=True,  # Automatic retry for write operations
    w='majority'  # Write concern for durability
)

db = client[db_name]

# Verify connection on startup
try:
    client.admin.command('ping')
    print(f"✅ MongoDB connected successfully to {db_name}")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    raise

# Collections
products_col = db['products']
sales_col = db['sales']
customers_col = db['customers']
suppliers_col = db['suppliers']
inventory_logs_col = db['inventory_logs']
discount_rules_col = db['discount_rules']
settings_col = db['settings']
backups_col = db['backups']
held_bills_col = db['held_bills']
terminals_col = db['terminals']
sync_queue_col = db['sync_queue']
users_col = db['users']
stock_movements_col = db['stock_movements']
grn_records_col = db['grn_records']
adjustment_requests_col = db['adjustment_requests']

# Create indexes
products_col.create_index([('sku', ASCENDING)], unique=True)
products_col.create_index([('barcodes', ASCENDING)])
sales_col.create_index([('invoice_number', ASCENDING)], unique=True)
sales_col.create_index([('created_at', DESCENDING)])
customers_col.create_index([('phone', ASCENDING)])
users_col.create_index([('username', ASCENDING)], unique=True)

# ==================== AUTHENTICATION ====================

# Security configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = users_col.find_one({"username": username}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def require_role(required_roles: List[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Initialize default admin user if not exists
def init_default_users():
    admin_exists = users_col.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": get_password_hash("admin1234"),
            "full_name": "Administrator",
            "role": "manager",  # manager or cashier
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        users_col.insert_one(admin_user)
        print("✅ Default admin user created (username: admin, password: admin1234)")

# Initialize users on startup
init_default_users()

# ==================== HELPER FUNCTIONS ====================

def serialize_doc(doc):
    """
    Remove MongoDB's _id field from a document to ensure JSON serialization.
    Can be used for both single documents and lists of documents.
    """
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        doc.pop('_id', None)
    return doc

# ==================== MODELS ====================

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sku: str
    barcodes: List[str] = []
    name_en: str
    name_si: str = ""
    name_ta: str = ""
    unit: str = "pcs"
    category: str = ""
    tax_code: str = ""
    supplier_id: Optional[str] = None
    price_retail: float = 0.0
    price_wholesale: float = 0.0
    price_credit: float = 0.0
    price_other: float = 0.0
    stock: float = 0.0
    reorder_level: float = 0.0
    weight_based: bool = False
    packed_date: str = ""
    expire_date: str = ""
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class SaleItem(BaseModel):
    product_id: str
    sku: str
    name: str
    quantity: float
    weight: float = 0.0
    unit_price: float
    discount_percent: float = 0.0
    discount_amount: float = 0.0
    subtotal: float
    total: float

class Payment(BaseModel):
    method: str  # cash, card, qr, other
    amount: float
    reference: str = ""

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str = ""
    price_tier: str = "retail"  # retail, wholesale, credit, other
    items: List[SaleItem]
    subtotal: float
    total_discount: float
    tax_amount: float = 0.0
    total: float
    payments: List[Payment]
    status: str = "completed"  # completed, hold, cancelled
    terminal_name: str = "Terminal 1"
    cashier_name: str = "Cashier"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    notes: str = ""

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str = ""
    email: str = ""
    category: str = "retail"  # retail, wholesale, credit, other
    default_tier: str = "retail"
    address: str = ""
    tax_id: str = ""
    notes: str = ""
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str = ""
    email: str = ""
    address: str = ""
    tax_id: str = ""
    notes: str = ""
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class DiscountRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rule_type: str  # line_item, category, product
    target_id: Optional[str] = None  # product_id or category name
    discount_type: str  # percent, fixed
    discount_value: float
    max_discount: float = 0.0  # cap on discount
    min_quantity: float = 0.0
    max_quantity: float = 0.0
    auto_apply: bool = False
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class InventoryLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    log_type: str  # receive, adjust, sale
    quantity: float
    previous_stock: float
    new_stock: float
    reference: str = ""
    notes: str = ""
    created_at: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str = "System"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str
    full_name: str
    role: str  # manager or cashier
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None

# ==================== API ENDPOINTS ====================

@app.get("/api/")
def root():
    return {"message": "POS System API", "version": "1.0.0"}

@app.get("/api/health")
def health_check():
    try:
        client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# ==================== AUTHENTICATION ====================

@app.post("/api/auth/login")
def login(user_login: UserLogin):
    """Login endpoint - returns JWT token"""
    user = users_col.find_one({"username": user_login.username}, {"_id": 0})
    if not user or not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not user.get("active", True):
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    access_token = create_access_token(data={"sub": user["username"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@app.get("/api/auth/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current logged-in user information"""
    return current_user

@app.post("/api/auth/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Logout endpoint (client should discard token)"""
    return {"message": "Logged out successfully"}

# ==================== USER MANAGEMENT (Manager Only) ====================

@app.get("/api/users")
def get_users(current_user: dict = Depends(require_role(["manager"]))):
    """Get all users (Manager only)"""
    users = list(users_col.find({}, {"_id": 0, "password": 0}))
    return {"users": users}

@app.post("/api/users")
def create_user(user: UserCreate, current_user: dict = Depends(require_role(["manager"]))):
    """Create new user (Manager only)"""
    existing = users_col.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if user.role not in ["manager", "cashier"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'manager' or 'cashier'")
    
    new_user = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "password": get_password_hash(user.password),
        "full_name": user.full_name,
        "role": user.role,
        "active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    users_col.insert_one(new_user)
    new_user.pop('password', None)
    new_user.pop('_id', None)  # Remove MongoDB _id field
    
    return {"message": "User created successfully", "user": new_user}

@app.put("/api/users/{user_id}")
def update_user(user_id: str, user_update: UserUpdate, current_user: dict = Depends(require_role(["manager"]))):
    """Update user (Manager only)"""
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = users_col.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@app.delete("/api/users/{user_id}")
def deactivate_user(user_id: str, current_user: dict = Depends(require_role(["manager"]))):
    """Deactivate user (Manager only)"""
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    
    result = users_col.update_one({"id": user_id}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deactivated successfully"}

# ==================== PRODUCTS ====================

@app.get("/api/products")
def get_products(skip: int = 0, limit: int = 100, search: str = "", active_only: bool = True):
    query = {}
    if active_only:
        query["active"] = True
    if search:
        query["$or"] = [
            {"sku": {"$regex": search, "$options": "i"}},
            {"name_en": {"$regex": search, "$options": "i"}},
            {"barcodes": {"$regex": search, "$options": "i"}}
        ]
    
    products = list(products_col.find(query, {"_id": 0}).skip(skip).limit(limit))
    total = products_col.count_documents(query)
    return {"products": products, "total": total}

@app.get("/api/products/{product_id}")
def get_product(product_id: str):
    product = products_col.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/api/products/barcode/{barcode}")
def get_product_by_barcode(barcode: str):
    product = products_col.find_one({"barcodes": barcode, "active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/products")
def create_product(product: Product):
    # Check if SKU exists
    existing = products_col.find_one({"sku": product.sku})
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    product_dict = product.dict()
    products_col.insert_one(product_dict)
    product_dict.pop('_id', None)
    return {"message": "Product created", "product": product_dict}

@app.put("/api/products/{product_id}")
def update_product(product_id: str, product: Product):
    product_dict = product.dict()
    product_dict["updated_at"] = datetime.utcnow().isoformat()
    # Ensure we don't overwrite the id field
    product_dict["id"] = product_id
    result = products_col.update_one({"id": product_id}, {"$set": product_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}

@app.delete("/api/products/{product_id}")
def delete_product(product_id: str):
    # Soft delete - find product regardless of active status
    result = products_col.update_one({"id": product_id}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== SALES ====================

@app.get("/api/sales")
def get_sales(skip: int = 0, limit: int = 50, status: str = ""):
    query = {}
    if status:
        query["status"] = status
    
    sales = list(sales_col.find(query, {"_id": 0}).sort("created_at", DESCENDING).skip(skip).limit(limit))
    total = sales_col.count_documents(query)
    return {"sales": sales, "total": total}

@app.get("/api/sales/{sale_id}")
def get_sale(sale_id: str):
    sale = sales_col.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@app.post("/api/sales")
def create_sale(sale: Sale):
    # Generate invoice number if not provided
    if not sale.invoice_number:
        today = datetime.utcnow().strftime("%Y%m%d")
        count = sales_col.count_documents({"invoice_number": {"$regex": f"^INV-{today}"}})
        sale.invoice_number = f"INV-{today}-{count + 1:04d}"
    
    sale_dict = sale.dict()
    
    # Update inventory for completed sales
    if sale.status == "completed":
        for item in sale.items:
            product = products_col.find_one({"id": item.product_id})
            if product:
                previous_stock = product.get("stock", 0)
                new_stock = previous_stock - item.quantity
                
                # Update product stock
                products_col.update_one(
                    {"id": item.product_id},
                    {"$set": {"stock": new_stock}}
                )
                
                # Log inventory change
                inventory_logs_col.insert_one({
                    "id": str(uuid.uuid4()),
                    "product_id": item.product_id,
                    "log_type": "sale",
                    "quantity": -item.quantity,
                    "previous_stock": previous_stock,
                    "new_stock": new_stock,
                    "reference": sale.invoice_number,
                    "notes": f"Sale {sale.invoice_number}",
                    "created_at": datetime.utcnow().isoformat(),
                    "created_by": sale.cashier_name
                })
    
    sales_col.insert_one(sale_dict)
    # Remove MongoDB _id from response
    sale_dict.pop('_id', None)
    return {"message": "Sale created", "sale": sale_dict}

@app.put("/api/sales/{sale_id}")
def update_sale(sale_id: str, sale: Sale):
    sale_dict = sale.dict()
    result = sales_col.update_one({"id": sale_id}, {"$set": sale_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {"message": "Sale updated"}

# ==================== CUSTOMERS ====================

@app.get("/api/customers")
def get_customers(skip: int = 0, limit: int = 100, search: str = ""):
    query = {"active": True}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    customers = list(customers_col.find(query, {"_id": 0}).skip(skip).limit(limit))
    total = customers_col.count_documents(query)
    return {"customers": customers, "total": total}

@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: str):
    customer = customers_col.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.post("/api/customers")
def create_customer(customer: Customer):
    customer_dict = customer.dict()
    customers_col.insert_one(customer_dict)
    customer_dict.pop('_id', None)
    return {"message": "Customer created", "customer": customer_dict}

@app.put("/api/customers/{customer_id}")
def update_customer(customer_id: str, customer: Customer):
    customer_dict = customer.dict()
    # Ensure we don't overwrite the id field
    customer_dict["id"] = customer_id
    result = customers_col.update_one({"id": customer_id}, {"$set": customer_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer updated"}

# ==================== SUPPLIERS ====================

@app.get("/api/suppliers")
def get_suppliers(skip: int = 0, limit: int = 100):
    suppliers = list(suppliers_col.find({"active": True}, {"_id": 0}).skip(skip).limit(limit))
    total = suppliers_col.count_documents({"active": True})
    return {"suppliers": suppliers, "total": total}

@app.post("/api/suppliers")
def create_supplier(supplier: Supplier):
    supplier_dict = supplier.dict()
    suppliers_col.insert_one(supplier_dict)
    supplier_dict.pop('_id', None)
    return {"message": "Supplier created", "supplier": supplier_dict}

# ==================== DISCOUNT RULES ====================

@app.get("/api/discount-rules")
def get_discount_rules():
    rules = list(discount_rules_col.find({"active": True}, {"_id": 0}))
    return {"rules": rules}

@app.post("/api/discount-rules")
def create_discount_rule(rule: DiscountRule):
    rule_dict = rule.dict()
    discount_rules_col.insert_one(rule_dict)
    rule_dict.pop('_id', None)
    return {"message": "Discount rule created", "rule": rule_dict}

@app.put("/api/discount-rules/{rule_id}")
def update_discount_rule(rule_id: str, rule: DiscountRule):
    rule_dict = rule.dict()
    result = discount_rules_col.update_one({"id": rule_id}, {"$set": rule_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Discount rule not found")
    return {"message": "Discount rule updated"}

@app.delete("/api/discount-rules/{rule_id}")
def delete_discount_rule(rule_id: str):
    result = discount_rules_col.update_one({"id": rule_id}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Discount rule not found")
    return {"message": "Discount rule deleted"}

@app.post("/api/discount-rules/apply")
def apply_discount_rules(cart_items: List[Dict], price_tier: str = "retail"):
    """Apply auto-apply discount rules to cart items"""
    rules = list(discount_rules_col.find({"active": True, "auto_apply": True}, {"_id": 0}))
    
    for item in cart_items:
        # Reset discount fields for each item
        item['discount_amount'] = 0
        item['discount_percent'] = 0
        item['total'] = item['subtotal']
        if 'applied_rule' in item:
            del item['applied_rule']
        
        applicable_rules = []
        
        for rule in rules:
            # Check if rule applies to this item
            if rule['rule_type'] == 'product':
                # Check both product_id (UUID) and sku for product-specific rules
                target = rule.get('target_id', '')
                if target == item.get('product_id') or target == item.get('sku'):
                    applicable_rules.append(rule)
            elif rule['rule_type'] == 'category':
                # Use category from cart item instead of fetching from DB
                if item.get('category') and item.get('category') == rule.get('target_id'):
                    applicable_rules.append(rule)
            elif rule['rule_type'] == 'line_item':
                # Applies to all items
                applicable_rules.append(rule)
        
        # Apply best discount
        if applicable_rules:
            best_discount = 0
            best_rule = None
            
            for rule in applicable_rules:
                # Check quantity conditions
                if rule.get('min_quantity', 0) > 0 and item['quantity'] < rule['min_quantity']:
                    continue
                if rule.get('max_quantity', 0) > 0 and item['quantity'] > rule['max_quantity']:
                    continue
                
                # Calculate discount
                if rule['discount_type'] == 'percent':
                    discount = (item['subtotal'] * rule['discount_value']) / 100
                else:  # fixed
                    discount = rule['discount_value'] * item['quantity']
                
                # Apply max discount cap
                if rule.get('max_discount', 0) > 0:
                    discount = min(discount, rule['max_discount'])
                
                if discount > best_discount:
                    best_discount = discount
                    best_rule = rule
            
            if best_rule:
                item['discount_amount'] = best_discount
                item['discount_percent'] = (best_discount / item['subtotal'] * 100) if item['subtotal'] > 0 else 0
                item['total'] = item['subtotal'] - best_discount
                item['applied_rule'] = best_rule['name']
    
    return {"items": cart_items}

# ==================== ADVANCED REPORTS ====================

@app.get("/api/reports/sales-trends")
def get_sales_trends(period: str = "daily", days: int = 30):
    """Get sales trends over time (daily, weekly, monthly)"""
    from datetime import datetime, timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    sales = list(sales_col.find({
        "status": "completed",
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}))
    
    # Group by period
    trends = {}
    for sale in sales:
        sale_date = datetime.fromisoformat(sale["created_at"])
        
        if period == "daily":
            key = sale_date.strftime("%Y-%m-%d")
        elif period == "weekly":
            key = sale_date.strftime("%Y-W%U")
        else:  # monthly
            key = sale_date.strftime("%Y-%m")
        
        if key not in trends:
            trends[key] = {"date": key, "revenue": 0, "count": 0, "items": 0}
        
        trends[key]["revenue"] += sale.get("total", 0)
        trends[key]["count"] += 1
        trends[key]["items"] += len(sale.get("items", []))
    
    return {"trends": sorted(trends.values(), key=lambda x: x["date"])}

@app.get("/api/reports/top-products")
def get_top_products(limit: int = 10, days: int = 30):
    """Get top selling products"""
    from datetime import datetime, timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    sales = list(sales_col.find({
        "status": "completed",
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}))
    
    product_stats = {}
    for sale in sales:
        for item in sale.get("items", []):
            product_id = item.get("product_id", "")
            if product_id not in product_stats:
                product_stats[product_id] = {
                    "product_id": product_id,
                    "name": item.get("name", ""),
                    "quantity_sold": 0,
                    "revenue": 0,
                    "times_sold": 0
                }
            product_stats[product_id]["quantity_sold"] += item.get("quantity", 0)
            product_stats[product_id]["revenue"] += item.get("total", 0)
            product_stats[product_id]["times_sold"] += 1
    
    top_products = sorted(product_stats.values(), key=lambda x: x["revenue"], reverse=True)[:limit]
    
    return {"products": top_products}

@app.get("/api/reports/sales-by-cashier")
def get_sales_by_cashier(days: int = 30):
    """Get sales performance by cashier"""
    from datetime import datetime, timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    sales = list(sales_col.find({
        "status": "completed",
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}))
    
    cashier_stats = {}
    for sale in sales:
        cashier = sale.get("cashier_name", "Unknown")
        if cashier not in cashier_stats:
            cashier_stats[cashier] = {
                "cashier": cashier,
                "sales_count": 0,
                "revenue": 0,
                "avg_sale": 0
            }
        cashier_stats[cashier]["sales_count"] += 1
        cashier_stats[cashier]["revenue"] += sale.get("total", 0)
    
    # Calculate averages
    for stats in cashier_stats.values():
        if stats["sales_count"] > 0:
            stats["avg_sale"] = stats["revenue"] / stats["sales_count"]
    
    return {"cashiers": list(cashier_stats.values())}

@app.get("/api/reports/profit-analysis")
def get_profit_analysis(days: int = 30):
    """Analyze profit margins (simplified - assumes cost is 70% of retail price)"""
    from datetime import datetime, timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    sales = list(sales_col.find({
        "status": "completed",
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}))
    
    total_revenue = sum(sale.get("total", 0) for sale in sales)
    estimated_cost = total_revenue * 0.70  # Simplified assumption
    estimated_profit = total_revenue - estimated_cost
    profit_margin = (estimated_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    return {
        "total_revenue": total_revenue,
        "estimated_cost": estimated_cost,
        "estimated_profit": estimated_profit,
        "profit_margin": profit_margin,
        "sales_count": len(sales),
        "note": "Cost is estimated at 70% of retail price"
    }

@app.get("/api/reports/customer-insights")
def get_customer_insights(days: int = 30):
    """Get customer purchase insights"""
    from datetime import datetime, timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    sales = list(sales_col.find({
        "status": "completed",
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}))
    
    customer_stats = {}
    for sale in sales:
        customer_id = sale.get("customer_id")
        customer_name = sale.get("customer_name", "Walk-in")
        
        key = customer_id if customer_id else customer_name
        if key not in customer_stats:
            customer_stats[key] = {
                "customer_name": customer_name,
                "purchase_count": 0,
                "total_spent": 0,
                "avg_purchase": 0
            }
        
        customer_stats[key]["purchase_count"] += 1
        customer_stats[key]["total_spent"] += sale.get("total", 0)
    
    # Calculate averages and sort
    for stats in customer_stats.values():
        if stats["purchase_count"] > 0:
            stats["avg_purchase"] = stats["total_spent"] / stats["purchase_count"]
    
    top_customers = sorted(customer_stats.values(), key=lambda x: x["total_spent"], reverse=True)[:20]
    
    return {"customers": top_customers}

# ==================== INVENTORY ====================

@app.post("/api/inventory/receive")
def receive_inventory(product_id: str, quantity: float, notes: str = ""):
    product = products_col.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    previous_stock = product.get("stock", 0)
    new_stock = previous_stock + quantity
    
    products_col.update_one({"id": product_id}, {"$set": {"stock": new_stock}})
    
    inventory_logs_col.insert_one({
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "log_type": "receive",
        "quantity": quantity,
        "previous_stock": previous_stock,
        "new_stock": new_stock,
        "notes": notes,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": "Manager"
    })
    
    return {"message": "Inventory received", "new_stock": new_stock}

@app.post("/api/inventory/adjust")
def adjust_inventory(product_id: str, quantity: float, notes: str = ""):
    product = products_col.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    previous_stock = product.get("stock", 0)
    new_stock = quantity
    
    products_col.update_one({"id": product_id}, {"$set": {"stock": new_stock}})
    
    inventory_logs_col.insert_one({
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "log_type": "adjust",
        "quantity": new_stock - previous_stock,
        "previous_stock": previous_stock,
        "new_stock": new_stock,
        "notes": notes,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": "Manager"
    })
    
    return {"message": "Inventory adjusted", "new_stock": new_stock}

@app.get("/api/inventory/low-stock")
def get_low_stock_products():
    # Get products where stock <= reorder_level
    pipeline = [
        {"$match": {"active": True, "$expr": {"$lte": ["$stock", "$reorder_level"]}}},
        {"$project": {"_id": 0}}
    ]
    products = list(products_col.aggregate(pipeline))
    return {"products": products, "count": len(products)}

# ==================== REPORTS ====================

@app.get("/api/reports/sales-summary")
def get_sales_summary(start_date: str = "", end_date: str = ""):
    query = {"status": "completed"}
    
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" not in query:
            query["created_at"] = {}
        query["created_at"]["$lte"] = end_date
    
    sales = list(sales_col.find(query, {"_id": 0}))
    
    total_sales = sum(sale.get("total", 0) for sale in sales)
    total_discount = sum(sale.get("total_discount", 0) for sale in sales)
    total_invoices = len(sales)
    
    # Sales by tier
    tier_summary = {}
    for sale in sales:
        tier = sale.get("price_tier", "retail")
        if tier not in tier_summary:
            tier_summary[tier] = {"count": 0, "total": 0}
        tier_summary[tier]["count"] += 1
        tier_summary[tier]["total"] += sale.get("total", 0)
    
    return {
        "total_sales": total_sales,
        "total_discount": total_discount,
        "total_invoices": total_invoices,
        "average_sale": total_sales / total_invoices if total_invoices > 0 else 0,
        "tier_summary": tier_summary
    }

@app.get("/api/reports/top-products")
def get_top_products(start_date: str = "", end_date: str = "", limit: int = 10):
    """Get top selling products by quantity and revenue"""
    query = {"status": "completed"}
    
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" not in query:
            query["created_at"] = {}
        query["created_at"]["$lte"] = end_date
    
    sales = list(sales_col.find(query, {"_id": 0}))
    
    # Aggregate by product
    product_stats = {}
    for sale in sales:
        for item in sale.get("items", []):
            product_id = item.get("product_id")
            if product_id not in product_stats:
                product_stats[product_id] = {
                    "product_id": product_id,
                    "sku": item.get("sku", ""),
                    "name": item.get("name", ""),
                    "quantity_sold": 0,
                    "revenue": 0
                }
            product_stats[product_id]["quantity_sold"] += item.get("quantity", 0)
            product_stats[product_id]["revenue"] += item.get("total", 0)
    
    # Sort by revenue
    top_products = sorted(product_stats.values(), key=lambda x: x["revenue"], reverse=True)[:limit]
    
    return {"products": top_products}

@app.get("/api/reports/top-categories")
def get_top_categories(start_date: str = "", end_date: str = ""):
    """Get top selling categories"""
    query = {"status": "completed"}
    
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" not in query:
            query["created_at"] = {}
        query["created_at"]["$lte"] = end_date
    
    sales = list(sales_col.find(query, {"_id": 0}))
    
    # Get all products for category mapping
    products = {p["id"]: p for p in products_col.find({}, {"_id": 0})}
    
    # Aggregate by category
    category_stats = {}
    for sale in sales:
        for item in sale.get("items", []):
            product_id = item.get("product_id")
            if product_id in products:
                category = products[product_id].get("category", "Uncategorized")
                if category not in category_stats:
                    category_stats[category] = {
                        "category": category,
                        "quantity_sold": 0,
                        "revenue": 0,
                        "items_count": 0
                    }
                category_stats[category]["quantity_sold"] += item.get("quantity", 0)
                category_stats[category]["revenue"] += item.get("total", 0)
                category_stats[category]["items_count"] += 1
    
    # Sort by revenue
    top_categories = sorted(category_stats.values(), key=lambda x: x["revenue"], reverse=True)
    
    return {"categories": top_categories}

@app.get("/api/reports/discount-usage")
def get_discount_usage(start_date: str = "", end_date: str = ""):
    """Get discount usage statistics"""
    query = {"status": "completed"}
    
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" not in query:
            query["created_at"] = {}
        query["created_at"]["$lte"] = end_date
    
    sales = list(sales_col.find(query, {"_id": 0}))
    
    total_discount = sum(sale.get("total_discount", 0) for sale in sales)
    invoices_with_discount = sum(1 for sale in sales if sale.get("total_discount", 0) > 0)
    
    # Discount by rule (if tracked in items)
    rule_stats = {}
    for sale in sales:
        for item in sale.get("items", []):
            if item.get("discount_amount", 0) > 0:
                rule_name = item.get("applied_rule", "Manual Discount")
                if rule_name not in rule_stats:
                    rule_stats[rule_name] = {
                        "rule_name": rule_name,
                        "times_applied": 0,
                        "total_discount": 0
                    }
                rule_stats[rule_name]["times_applied"] += 1
                rule_stats[rule_name]["total_discount"] += item.get("discount_amount", 0)
    
    return {
        "total_discount": total_discount,
        "invoices_with_discount": invoices_with_discount,
        "total_invoices": len(sales),
        "discount_percentage": (invoices_with_discount / len(sales) * 100) if len(sales) > 0 else 0,
        "rule_usage": list(rule_stats.values())
    }

@app.get("/api/reports/daily-sales")
def get_daily_sales(days: int = 7):
    """Get daily sales for the last N days"""
    from datetime import datetime, timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    sales = list(sales_col.find({
        "status": "completed",
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}))
    
    # Group by date
    daily_stats = {}
    for sale in sales:
        date = sale.get("created_at", "")[:10]  # Get YYYY-MM-DD
        if date not in daily_stats:
            daily_stats[date] = {
                "date": date,
                "revenue": 0,
                "invoices": 0,
                "items_sold": 0
            }
        daily_stats[date]["revenue"] += sale.get("total", 0)
        daily_stats[date]["invoices"] += 1
        daily_stats[date]["items_sold"] += sum(item.get("quantity", 0) for item in sale.get("items", []))
    
    # Sort by date
    daily_data = sorted(daily_stats.values(), key=lambda x: x["date"])
    
    return {"daily_sales": daily_data}

@app.get("/api/inventory/logs")
def get_inventory_logs(product_id: str = "", limit: int = 50):
    """Get inventory transaction logs"""
    query = {}
    if product_id:
        query["product_id"] = product_id
    
    logs = list(inventory_logs_col.find(query, {"_id": 0}).sort("created_at", DESCENDING).limit(limit))
    
    # Enrich with product names
    product_ids = set(log.get("product_id") for log in logs)
    products = {p["id"]: p for p in products_col.find({"id": {"$in": list(product_ids)}}, {"_id": 0})}
    
    for log in logs:
        product_id = log.get("product_id")
        if product_id in products:
            log["product_name"] = products[product_id].get("name_en", "")
            log["sku"] = products[product_id].get("sku", "")
    
    return {"logs": logs, "total": len(logs)}

@app.get("/api/inventory/alerts")
def get_inventory_alerts():
    """Get products with low stock (below reorder level)"""
    pipeline = [
        {"$match": {"active": True}},
        {"$addFields": {
            "needs_reorder": {"$lte": ["$stock", "$reorder_level"]}
        }},
        {"$match": {"needs_reorder": True}},
        {"$project": {"_id": 0}}
    ]
    
    products = list(products_col.aggregate(pipeline))
    
    # Calculate suggested order quantity (simple: 2x reorder level - current stock)
    for product in products:
        suggested_qty = max(0, (product.get("reorder_level", 0) * 2) - product.get("stock", 0))
        product["suggested_order_qty"] = suggested_qty
        product["stock_status"] = "critical" if product.get("stock", 0) == 0 else "low"
    
    return {"alerts": products, "count": len(products)}

@app.get("/api/reports/customer-stats")
def get_customer_stats(start_date: str = "", end_date: str = ""):
    """Get customer purchase statistics"""
    query = {"status": "completed"}
    
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" not in query:
            query["created_at"] = {}
        query["created_at"]["$lte"] = end_date
    
    sales = list(sales_col.find(query, {"_id": 0}))
    
    # Aggregate by customer
    customer_stats = {}
    for sale in sales:
        customer_id = sale.get("customer_id") or "walk-in"
        customer_name = sale.get("customer_name", "Walk-in")
        
        if customer_id not in customer_stats:
            customer_stats[customer_id] = {
                "customer_id": customer_id,
                "customer_name": customer_name,
                "total_purchases": 0,
                "total_spent": 0,
                "avg_purchase": 0
            }
        
        customer_stats[customer_id]["total_purchases"] += 1
        customer_stats[customer_id]["total_spent"] += sale.get("total", 0)
    
    # Calculate averages
    for stats in customer_stats.values():
        stats["avg_purchase"] = stats["total_spent"] / stats["total_purchases"] if stats["total_purchases"] > 0 else 0
    
    # Sort by total spent
    top_customers = sorted(customer_stats.values(), key=lambda x: x["total_spent"], reverse=True)
    
    return {"customers": top_customers}

# ==================== HELD BILLS ====================

class HeldBill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: Optional[str] = None
    customer_name: str = ""
    price_tier: str = "retail"
    items: List[SaleItem]
    subtotal: float
    total_discount: float
    total: float
    terminal_name: str = "Terminal 1"
    cashier_name: str = "Cashier"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    notes: str = ""

@app.get("/api/held-bills")
def get_held_bills():
    """Get all held bills"""
    bills = list(held_bills_col.find({}, {"_id": 0}).sort("created_at", DESCENDING))
    return {"bills": bills, "count": len(bills)}

@app.post("/api/held-bills")
def create_held_bill(bill: HeldBill):
    """Hold current bill for later"""
    bill_dict = bill.dict()
    held_bills_col.insert_one(bill_dict)
    bill_dict.pop('_id', None)
    return {"message": "Bill held successfully", "bill": bill_dict}

@app.get("/api/held-bills/{bill_id}")
def get_held_bill(bill_id: str):
    """Get specific held bill"""
    bill = held_bills_col.find_one({"id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Held bill not found")
    return bill

@app.delete("/api/held-bills/{bill_id}")
def delete_held_bill(bill_id: str):
    """Delete held bill"""
    result = held_bills_col.delete_one({"id": bill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Held bill not found")
    return {"message": "Held bill deleted"}

# ==================== BACKUPS ====================

@app.post("/api/backups/create")
def create_backup():
    """Create full system backup as JSON"""
    backup_data = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.utcnow().isoformat(),
        "type": "manual",
        "data": {
            "products": list(products_col.find({}, {"_id": 0})),
            "customers": list(customers_col.find({}, {"_id": 0})),
            "suppliers": list(suppliers_col.find({}, {"_id": 0})),
            "discount_rules": list(discount_rules_col.find({}, {"_id": 0})),
            "settings": settings_col.find_one({}, {"_id": 0})
        }
    }
    
    # Store backup metadata (without _id in response)
    backup_meta = {
        "id": backup_data["id"],
        "created_at": backup_data["created_at"],
        "type": backup_data["type"],
        "products_count": len(backup_data["data"]["products"]),
        "customers_count": len(backup_data["data"]["customers"]),
        "suppliers_count": len(backup_data["data"]["suppliers"])
    }
    backups_col.insert_one(backup_meta.copy())
    
    # Clean the metadata for response
    response_meta = backup_meta.copy()
    
    return {
        "message": "Backup created successfully",
        "backup": backup_data,
        "metadata": response_meta
    }

@app.get("/api/backups")
def get_backups():
    """List all backup metadata"""
    backups = list(backups_col.find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(30))
    return {"backups": backups}

@app.post("/api/backups/restore")
def restore_backup(backup_data: dict):
    """Restore from backup JSON"""
    try:
        data = backup_data.get("data", {})
        
        restored_counts = {}
        
        # Restore products
        if "products" in data and data["products"]:
            products_col.delete_many({})
            products_col.insert_many(data["products"])
            restored_counts["products"] = len(data["products"])
        
        # Restore customers
        if "customers" in data and data["customers"]:
            customers_col.delete_many({})
            customers_col.insert_many(data["customers"])
            restored_counts["customers"] = len(data["customers"])
        
        # Restore suppliers
        if "suppliers" in data and data["suppliers"]:
            suppliers_col.delete_many({})
            suppliers_col.insert_many(data["suppliers"])
            restored_counts["suppliers"] = len(data["suppliers"])
        
        # Restore discount rules
        if "discount_rules" in data and data["discount_rules"]:
            discount_rules_col.delete_many({})
            discount_rules_col.insert_many(data["discount_rules"])
            restored_counts["discount_rules"] = len(data["discount_rules"])
        
        # Restore settings
        if "settings" in data and data["settings"]:
            settings_col.delete_many({})
            settings_col.insert_one(data["settings"])
            restored_counts["settings"] = 1
        
        return {
            "message": "Backup restored successfully",
            "restored": restored_counts
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Restore failed: {str(e)}")

# ==================== SETTINGS ====================

@app.get("/api/settings")
def get_settings():
    settings = settings_col.find_one({}, {"_id": 0})
    if not settings:
        # Return default settings
        settings = {
            "store_name": "My Store",
            "store_address": "",
            "store_phone": "",
            "store_email": "",
            "tax_id": "",
            "default_language": "si",
            "default_tier": "retail",
            "currency": "LKR",
            "tax_rate": 0.0
        }
    return settings

@app.post("/api/settings")
def update_settings(settings: dict):
    settings_col.delete_many({})
    settings_col.insert_one(settings)
    return {"message": "Settings updated", "settings": settings}

# ==================== CSV IMPORT/EXPORT ====================

@app.get("/api/export/products")
def export_products_csv():
    products = list(products_col.find({"active": True}, {"_id": 0}))
    csv_content = csv_utils.products_to_csv(products)
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=products_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@app.post("/api/import/products/validate")
async def validate_products_csv(file: UploadFile = File(...)):
    content = await file.read()
    csv_data = csv_utils.parse_csv_content(content.decode('utf-8'))
    
    is_valid, errors, valid_rows = csv_utils.validate_product_csv(csv_data)
    
    return {
        "valid": is_valid,
        "errors": errors,
        "valid_count": len(valid_rows),
        "total_count": len(csv_data),
        "preview": valid_rows[:10]  # Show first 10 valid rows
    }

@app.post("/api/import/products")
async def import_products_csv(file: UploadFile = File(...)):
    content = await file.read()
    csv_data = csv_utils.parse_csv_content(content.decode('utf-8'))
    
    is_valid, errors, valid_rows = csv_utils.validate_product_csv(csv_data)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    imported = 0
    updated = 0
    
    for row in valid_rows:
        # Check if product exists by SKU
        existing = products_col.find_one({"sku": row['sku']})
        
        product_data = {
            "sku": row['sku'],
            "barcodes": row.get('barcodes', '').split(',') if row.get('barcodes') else [],
            "name_en": row['name_en'],
            "name_si": row.get('name_si', ''),
            "name_ta": row.get('name_ta', ''),
            "unit": row.get('unit', 'pcs'),
            "category": row.get('category', ''),
            "tax_code": row.get('tax_code', ''),
            "supplier_id": row.get('supplier_id', ''),
            "price_retail": float(row.get('price_retail', 0)),
            "price_wholesale": float(row.get('price_wholesale', 0)),
            "price_credit": float(row.get('price_credit', 0)),
            "price_other": float(row.get('price_other', 0)),
            "stock": float(row.get('stock', 0)),
            "reorder_level": float(row.get('reorder_level', 0)),
            "weight_based": row.get('weight_based', '').lower() in ['true', '1', 'yes'],
            "active": row.get('active', '').lower() not in ['false', '0', 'no'],
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if existing:
            product_data['id'] = existing['id']
            products_col.update_one({"sku": row['sku']}, {"$set": product_data})
            updated += 1
        else:
            product_data['id'] = str(uuid.uuid4())
            product_data['created_at'] = datetime.utcnow().isoformat()
            products_col.insert_one(product_data)
            imported += 1
    
    return {"message": "Import successful", "imported": imported, "updated": updated}

@app.get("/api/export/customers")
def export_customers_csv():
    customers = list(customers_col.find({"active": True}, {"_id": 0}))
    csv_content = csv_utils.customers_to_csv(customers)
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=customers_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@app.post("/api/import/customers")
async def import_customers_csv(file: UploadFile = File(...)):
    content = await file.read()
    csv_data = csv_utils.parse_csv_content(content.decode('utf-8'))
    
    is_valid, errors, valid_rows = csv_utils.validate_customer_csv(csv_data)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    imported = 0
    
    for row in valid_rows:
        customer_data = {
            "id": str(uuid.uuid4()),
            "name": row['name'],
            "phone": row.get('phone', ''),
            "email": row.get('email', ''),
            "category": row.get('category', 'retail'),
            "default_tier": row.get('default_tier', 'retail'),
            "address": row.get('address', ''),
            "tax_id": row.get('tax_id', ''),
            "notes": row.get('notes', ''),
            "active": row.get('active', '').lower() not in ['false', '0', 'no'],
            "created_at": datetime.utcnow().isoformat()
        }
        customers_col.insert_one(customer_data)
        imported += 1
    
    return {"message": "Import successful", "imported": imported}

@app.get("/api/export/suppliers")
def export_suppliers_csv():
    suppliers = list(suppliers_col.find({"active": True}, {"_id": 0}))
    csv_content = csv_utils.suppliers_to_csv(suppliers)
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=suppliers_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@app.post("/api/import/suppliers")
async def import_suppliers_csv(file: UploadFile = File(...)):
    content = await file.read()
    csv_data = csv_utils.parse_csv_content(content.decode('utf-8'))
    
    is_valid, errors, valid_rows = csv_utils.validate_supplier_csv(csv_data)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail={"errors": errors})
    
    imported = 0
    
    for row in valid_rows:
        supplier_data = {
            "id": str(uuid.uuid4()),
            "name": row['name'],
            "phone": row.get('phone', ''),
            "email": row.get('email', ''),
            "address": row.get('address', ''),
            "tax_id": row.get('tax_id', ''),
            "notes": row.get('notes', ''),
            "active": row.get('active', '').lower() not in ['false', '0', 'no'],
            "created_at": datetime.utcnow().isoformat()
        }
        suppliers_col.insert_one(supplier_data)
        imported += 1
    
    return {"message": "Import successful", "imported": imported}

@app.get("/api/export/discount-rules")
def export_discount_rules_csv():
    rules = list(discount_rules_col.find({"active": True}, {"_id": 0}))
    csv_content = csv_utils.discount_rules_to_csv(rules)
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=discount_rules_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@app.get("/api/export/sales")
def export_sales_csv(start_date: str = "", end_date: str = ""):
    query = {"status": "completed"}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" not in query:
            query["created_at"] = {}
        query["created_at"]["$lte"] = end_date
    
    sales = list(sales_col.find(query, {"_id": 0}))
    csv_content = csv_utils.sales_to_csv(sales)
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sales_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@app.post("/api/prices/bulk-update")
def bulk_update_prices(rule: Dict):
    """
    Apply bulk price update rule
    rule format: {
        "tier": "wholesale",  # which tier to update
        "formula": "retail_minus_percent",  # or "retail_minus_fixed", "retail_multiply"
        "value": 5  # percentage, fixed amount, or multiplier
    }
    """
    tier = rule.get('tier', 'wholesale')
    formula = rule.get('formula', 'retail_minus_percent')
    value = float(rule.get('value', 0))
    
    products = list(products_col.find({"active": True}))
    updated_count = 0
    
    for product in products:
        retail_price = product.get('price_retail', 0)
        new_price = retail_price
        
        if formula == 'retail_minus_percent':
            new_price = retail_price * (1 - value / 100)
        elif formula == 'retail_minus_fixed':
            new_price = retail_price - value
        elif formula == 'retail_multiply':
            new_price = retail_price * value
        
        # Ensure price doesn't go negative
        new_price = max(0, new_price)
        
        # Update the tier price
        products_col.update_one(
            {"id": product['id']},
            {"$set": {f"price_{tier}": new_price, "updated_at": datetime.utcnow().isoformat()}}
        )
        updated_count += 1
    
    return {"message": f"Updated {updated_count} products", "count": updated_count}

# ==================== TERMINALS ====================

class Terminal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    ip_address: str = ""
    status: str = "active"  # active, inactive, offline
    last_sync: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

@app.get("/api/terminals")
def get_terminals():
    """Get all terminals"""
    terminals = list(terminals_col.find({}, {"_id": 0}))
    return {"terminals": terminals}

@app.post("/api/terminals")
def register_terminal(terminal: Terminal):
    """Register a new terminal"""
    # Check if name exists
    existing = terminals_col.find_one({"name": terminal.name})
    if existing:
        raise HTTPException(status_code=400, detail="Terminal name already exists")
    
    terminal_dict = terminal.dict()
    terminals_col.insert_one(terminal_dict)
    terminal_dict.pop('_id', None)
    return {"message": "Terminal registered", "terminal": terminal_dict}

@app.put("/api/terminals/{terminal_id}")
def update_terminal(terminal_id: str, terminal: Terminal):
    """Update terminal info"""
    terminal_dict = terminal.dict()
    result = terminals_col.update_one({"id": terminal_id}, {"$set": terminal_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Terminal not found")
    return {"message": "Terminal updated"}

@app.post("/api/terminals/{terminal_id}/heartbeat")
def terminal_heartbeat(terminal_id: str):
    """Terminal heartbeat to update status"""
    result = terminals_col.update_one(
        {"id": terminal_id},
        {"$set": {
            "status": "active",
            "last_sync": datetime.utcnow().isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Terminal not found")
    return {"message": "Heartbeat received"}

@app.get("/api/sync/changes")
def get_sync_changes(since: str = "", terminal_id: str = ""):
    """Get changes since timestamp for syncing"""
    query = {}
    if since:
        query["updated_at"] = {"$gt": since}
    
    changes = {
        "products": list(products_col.find(query, {"_id": 0}).limit(100)),
        "customers": list(customers_col.find(query, {"_id": 0}).limit(100)),
        "sales": list(sales_col.find({"created_at": {"$gt": since}} if since else {}, {"_id": 0}).limit(50)),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return changes

@app.get("/api/sync/status")
def get_sync_status():
    """Get sync status of all terminals"""
    terminals = list(terminals_col.find({}, {"_id": 0}))
    
    # Check for offline terminals (no heartbeat in last 5 minutes)
    current_time = datetime.utcnow()
    for terminal in terminals:
        last_sync = datetime.fromisoformat(terminal.get("last_sync", terminal.get("created_at")))
        time_diff = (current_time - last_sync).total_seconds()
        
        if time_diff > 300:  # 5 minutes
            terminal["status"] = "offline"
        elif time_diff > 60:  # 1 minute
            terminal["status"] = "warning"
    
    return {
        "terminals": terminals,
        "total": len(terminals),
        "active": len([t for t in terminals if t["status"] == "active"]),
        "offline": len([t for t in terminals if t["status"] == "offline"])
    }

# ==================== SEED DATA ====================

@app.post("/api/seed-data")
def seed_sample_data():
    """Seed comprehensive test data for production-like demo"""
    # Clear existing data (except users and sales)
    products_col.delete_many({})
    customers_col.delete_many({})
    suppliers_col.delete_many({})
    discount_rules_col.delete_many({})
    
    # Sample suppliers with realistic Sri Lankan data
    suppliers = [
        {
            "id": "sup-001",
            "name": "Lanka Food Distributors (Pvt) Ltd",
            "phone": "0112345678",
            "email": "info@lankafood.lk",
            "address": "No. 123, Galle Road, Colombo 03",
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "sup-002",
            "name": "Ceylon Wholesalers & Co",
            "phone": "0812234567",
            "email": "sales@ceylonwholesale.lk",
            "address": "45/A, Peradeniya Road, Kandy",
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "sup-003",
            "name": "Island Traders (Pvt) Ltd",
            "phone": "0912345678",
            "email": "info@islandtraders.lk",
            "address": "78, Main Street, Galle",
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    suppliers_col.insert_many(suppliers)
    
    # Sample products
    products = [
        {
            "id": str(uuid.uuid4()),
            "sku": "RICE-001",
            "barcodes": ["8901234567890", "8901234567891"],
            "name_en": "Basmati Rice 5kg",
            "name_si": "බාස්මති සහල් 5kg",
            "name_ta": "பாஸ்மதி அரிசி 5kg",
            "unit": "bag",
            "category": "Rice",
            "supplier_id": "sup-001",
            "price_retail": 1500.00,
            "price_wholesale": 1400.00,
            "price_credit": 1450.00,
            "price_other": 1350.00,
            "stock": 50,
            "reorder_level": 10,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "SUGAR-001",
            "barcodes": ["8901234567892"],
            "name_en": "White Sugar 1kg",
            "name_si": "සුදු සීනි 1kg",
            "name_ta": "வெள்ளை சர்க்கரை 1kg",
            "unit": "kg",
            "category": "Sugar",
            "supplier_id": "sup-001",
            "price_retail": 250.00,
            "price_wholesale": 230.00,
            "price_credit": 240.00,
            "price_other": 220.00,
            "stock": 100,
            "reorder_level": 20,
            "weight_based": True,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "OIL-001",
            "barcodes": ["8901234567893"],
            "name_en": "Coconut Oil 1L",
            "name_si": "පොල් තෙල් 1L",
            "name_ta": "தேங்காய் எண்ணெய் 1L",
            "unit": "bottle",
            "category": "Oil",
            "supplier_id": "sup-002",
            "price_retail": 850.00,
            "price_wholesale": 800.00,
            "price_credit": 825.00,
            "price_other": 780.00,
            "stock": 30,
            "reorder_level": 5,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "MILK-001",
            "barcodes": ["8901234567894"],
            "name_en": "Full Cream Milk Powder 400g",
            "name_si": "සම්පූර්ණ ක්‍රීම් කිරි කුඩු 400g",
            "name_ta": "முழு கிரீம் பால் தூள் 400g",
            "unit": "pack",
            "category": "Dairy",
            "supplier_id": "sup-001",
            "price_retail": 980.00,
            "price_wholesale": 920.00,
            "price_credit": 950.00,
            "price_other": 900.00,
            "stock": 45,
            "reorder_level": 15,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "TEA-001",
            "barcodes": ["8901234567895"],
            "name_en": "Ceylon Black Tea 100g",
            "name_si": "ලංකා කළු තේ 100g",
            "name_ta": "இலங்கை கருப்பு தேயிலை 100g",
            "unit": "pack",
            "category": "Beverages",
            "supplier_id": "sup-002",
            "price_retail": 450.00,
            "price_wholesale": 420.00,
            "price_credit": 435.00,
            "price_other": 410.00,
            "stock": 80,
            "reorder_level": 25,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "FLOUR-001",
            "barcodes": ["8901234567896"],
            "name_en": "Wheat Flour 1kg",
            "name_si": "තිරිඟු පිටි 1kg",
            "name_ta": "கோதுமை மாவு 1kg",
            "unit": "kg",
            "category": "Flour",
            "supplier_id": "sup-001",
            "price_retail": 180.00,
            "price_wholesale": 170.00,
            "price_credit": 175.00,
            "price_other": 165.00,
            "stock": 120,
            "reorder_level": 30,
            "weight_based": True,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "SOAP-001",
            "barcodes": ["8901234567897"],
            "name_en": "Bath Soap 100g",
            "name_si": "නාන සබන් 100g",
            "name_ta": "குளியல் சோப்பு 100g",
            "unit": "pcs",
            "category": "Personal Care",
            "supplier_id": "sup-002",
            "price_retail": 120.00,
            "price_wholesale": 110.00,
            "price_credit": 115.00,
            "price_other": 105.00,
            "stock": 200,
            "reorder_level": 50,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "DHAL-001",
            "barcodes": ["8901234567898"],
            "name_en": "Red Lentils 1kg",
            "name_si": "රතු පරිප්පු 1kg",
            "name_ta": "சிவப்பு பருப்பு 1kg",
            "unit": "kg",
            "category": "Pulses",
            "supplier_id": "sup-001",
            "price_retail": 420.00,
            "price_wholesale": 390.00,
            "price_credit": 405.00,
            "price_other": 380.00,
            "stock": 60,
            "reorder_level": 15,
            "weight_based": True,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        # Additional products for better demo
        {
            "id": str(uuid.uuid4()),
            "sku": "BREAD-001",
            "barcodes": ["8901234567899"],
            "name_en": "Bread Loaf",
            "name_si": "පාන්",
            "name_ta": "ரொட்டி",
            "unit": "loaf",
            "category": "Bakery",
            "supplier_id": "sup-003",
            "price_retail": 110.00,
            "price_wholesale": 100.00,
            "price_credit": 105.00,
            "price_other": 95.00,
            "stock": 50,
            "reorder_level": 10,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "SALT-001",
            "barcodes": ["8901234567900"],
            "name_en": "Table Salt 1kg",
            "name_si": "ලුණු 1kg",
            "name_ta": "உப்பு 1kg",
            "unit": "kg",
            "category": "Spices",
            "supplier_id": "sup-001",
            "price_retail": 80.00,
            "price_wholesale": 75.00,
            "price_credit": 77.00,
            "price_other": 70.00,
            "stock": 150,
            "reorder_level": 40,
            "weight_based": True,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "CHILLI-001",
            "barcodes": ["8901234567901"],
            "name_en": "Chilli Powder 100g",
            "name_si": "මිරිස් කුඩු 100g",
            "name_ta": "மிளகாய் பொடி 100g",
            "unit": "pack",
            "category": "Spices",
            "supplier_id": "sup-002",
            "price_retail": 320.00,
            "price_wholesale": 300.00,
            "price_credit": 310.00,
            "price_other": 290.00,
            "stock": 70,
            "reorder_level": 20,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "BISCUIT-001",
            "barcodes": ["8901234567902"],
            "name_en": "Cream Biscuits 200g",
            "name_si": "ක්‍රීම් බිස්කට් 200g",
            "name_ta": "கிரீம் பிஸ்கட் 200g",
            "unit": "pack",
            "category": "Snacks",
            "supplier_id": "sup-003",
            "price_retail": 180.00,
            "price_wholesale": 165.00,
            "price_credit": 172.00,
            "price_other": 160.00,
            "stock": 90,
            "reorder_level": 30,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "NOODLES-001",
            "barcodes": ["8901234567903"],
            "name_en": "Instant Noodles 400g",
            "name_si": "ඉක්මන් නූඩ්ල්ස් 400g",
            "name_ta": "உடனடி நூடுல்ஸ் 400g",
            "unit": "pack",
            "category": "Groceries",
            "supplier_id": "sup-001",
            "price_retail": 290.00,
            "price_wholesale": 270.00,
            "price_credit": 280.00,
            "price_other": 260.00,
            "stock": 110,
            "reorder_level": 35,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "sku": "TOOTHPASTE-001",
            "barcodes": ["8901234567904"],
            "name_en": "Toothpaste 100ml",
            "name_si": "දත් මැදි 100ml",
            "name_ta": "பற்பசை 100ml",
            "unit": "tube",
            "category": "Personal Care",
            "supplier_id": "sup-002",
            "price_retail": 250.00,
            "price_wholesale": 230.00,
            "price_credit": 240.00,
            "price_other": 220.00,
            "stock": 75,
            "reorder_level": 25,
            "weight_based": False,
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]
    products_col.insert_many(products)
    
    # Sample customers with more variety
    customers = [
        {
            "id": "cust-001",
            "name": "Walk-in Customer",
            "phone": "",
            "email": "",
            "address": "",
            "category": "retail",
            "default_tier": "retail",
            "active": True,
            "notes": "Default cash customer",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Nimal Perera",
            "phone": "0771234567",
            "email": "nimal@email.com",
            "address": "45, Temple Road, Colombo 06",
            "category": "retail",
            "default_tier": "retail",
            "active": True,
            "notes": "Regular customer",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Kamal's Store",
            "phone": "0772345678",
            "email": "kamalstore@email.com",
            "address": "12/A, Main Street, Kandy",
            "category": "wholesale",
            "default_tier": "wholesale",
            "active": True,
            "notes": "Wholesale buyer - monthly billing",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Priyanka Silva",
            "phone": "0773456789",
            "email": "priyanka@email.com",
            "address": "78, Sea View Lane, Galle",
            "category": "retail",
            "default_tier": "credit",
            "active": True,
            "notes": "Credit customer - 30 days",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ravi's Supermarket",
            "phone": "0774567890",
            "email": "ravissuper@email.com",
            "address": "23, Market Road, Matara",
            "category": "wholesale",
            "default_tier": "wholesale",
            "active": True,
            "notes": "Bulk buyer - weekly orders",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sunil Fernando",
            "phone": "0775678901",
            "email": "sunil@email.com",
            "address": "56, Park Avenue, Negombo",
            "category": "retail",
            "default_tier": "retail",
            "active": True,
            "notes": "Premium customer",
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    customers_col.insert_many(customers)
    
    # Sample discount rules for demo
    discount_rules = [
        {
            "id": str(uuid.uuid4()),
            "name": "Bulk Rice Discount",
            "rule_type": "category",
            "target_id": "Rice",
            "discount_type": "percent",
            "discount_value": 5.0,
            "max_discount": 0.0,
            "min_quantity": 10.0,
            "max_quantity": 0.0,
            "auto_apply": True,
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Wholesale Sugar Special",
            "rule_type": "category",
            "target_id": "Sugar",
            "discount_type": "fixed",
            "discount_value": 50.0,
            "max_discount": 0.0,
            "min_quantity": 20.0,
            "max_quantity": 0.0,
            "auto_apply": True,
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "General Line Item Discount",
            "rule_type": "line_item",
            "target_id": "",
            "discount_type": "percent",
            "discount_value": 2.0,
            "max_discount": 100.0,
            "min_quantity": 5.0,
            "max_quantity": 0.0,
            "auto_apply": True,
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    discount_rules_col.insert_many(discount_rules)
    
    # Initialize store settings
    settings_col.delete_many({})
    settings_col.insert_one({
        "store_name": "Quick Grocery POS",
        "address": "123, Main Street, Colombo 03",
        "phone": "011-2345678",
        "email": "info@quickgrocery.lk",
        "tax_id": "VAT-123456789",
        "default_language": "si",
        "default_tier": "retail",
        "currency": "LKR",
        "tax_rate": 0.0,
        "receipt_footer": "Thank you for your business! Visit us again.",
        "low_stock_threshold": 10,
        "created_at": datetime.utcnow().isoformat()
    })
    
    return {
        "message": "✅ Production-ready sample data seeded successfully",
        "summary": {
            "products": len(products),
            "customers": len(customers),
            "suppliers": len(suppliers),
            "discount_rules": len(discount_rules)
        },
        "note": "Demo data includes: 15 products, 6 customers, 3 suppliers, 2 discount rules"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
