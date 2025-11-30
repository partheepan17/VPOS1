from pymongo import MongoClient, ASCENDING
import os

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
DATABASE_NAME = os.environ.get('DATABASE_NAME', 'pos_system')
client = MongoClient(MONGO_URL, maxPoolSize=50, minPoolSize=10)
db = client[DATABASE_NAME]

print(f"✅ MongoDB connected successfully to {db.name}")

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
customers_col.create_index([('phone', ASCENDING)])
users_col.create_index([('username', ASCENDING)], unique=True)


def serialize_doc(doc):
    """Helper to serialize MongoDB documents by removing _id"""
    if doc and '_id' in doc:
        doc.pop('_id')
    return doc
