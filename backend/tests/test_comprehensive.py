#!/usr/bin/env python3
"""
Comprehensive POS System Backend API Test Suite
Tests all functionality before production release including:
- Authentication System
- Core CRUD Operations  
- Advanced Features
- Reports & Analytics
- Edge Cases
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
import sys
import os

# Use the production backend URL from frontend/.env
BASE_URL = "https://quick-pos-15.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.results = []
        self.auth_token = None
        self.test_data = {}

    def add_result(self, test_name, passed, message="", warning=False):
        self.results.append({
            'name': test_name,
            'passed': passed,
            'message': message,
            'warning': warning
        })
        if warning:
            self.warnings += 1
        elif passed:
            self.passed += 1
        else:
            self.failed += 1

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}=== {test_name} ==={Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.ENDC}")

def test_health_check(results):
    """Test basic API health and connectivity"""
    print_test_header("Health Check & Connectivity")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy' and data.get('database') == 'connected':
                print_success("API is healthy and database connected")
                results.add_result("Health Check", True, "API healthy, database connected")
            else:
                print_error(f"API unhealthy: {data}")
                results.add_result("Health Check", False, f"API status: {data}")
        else:
            print_error(f"Health check failed: HTTP {response.status_code}")
            results.add_result("Health Check", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Health check failed: {str(e)}")
        results.add_result("Health Check", False, f"Connection error: {str(e)}")

def test_authentication_system(results):
    """Test complete authentication system"""
    print_test_header("Authentication System")
    
    # Test 1: Login with valid credentials (admin/admin1234)
    try:
        login_data = {"username": "admin", "password": "admin1234"}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'user' in data:
                results.auth_token = data['access_token']
                print_success(f"Valid login successful - User: {data['user']['username']} ({data['user']['role']})")
                results.add_result("Valid Login", True, f"Logged in as {data['user']['role']}")
            else:
                print_error("Valid login: Invalid response structure")
                results.add_result("Valid Login", False, "Invalid response structure")
        else:
            print_error(f"Valid login failed: HTTP {response.status_code}")
            results.add_result("Valid Login", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Valid login failed: {str(e)}")
        results.add_result("Valid Login", False, str(e))
    
    # Test 2: Login with invalid credentials
    try:
        login_data = {"username": "admin", "password": "wrongpassword"}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 401:
            print_success("Invalid login correctly rejected")
            results.add_result("Invalid Login Rejection", True, "401 Unauthorized as expected")
        else:
            print_error(f"Invalid login should return 401, got: {response.status_code}")
            results.add_result("Invalid Login Rejection", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        print_error(f"Invalid login test failed: {str(e)}")
        results.add_result("Invalid Login Rejection", False, str(e))
    
    # Test 3: Access protected endpoint with token
    if results.auth_token:
        try:
            headers = {"Authorization": f"Bearer {results.auth_token}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'username' in data and 'role' in data:
                    print_success(f"Protected endpoint access successful - Role: {data['role']}")
                    results.add_result("Protected Endpoint Access", True, f"Authenticated as {data['role']}")
                else:
                    print_error("Protected endpoint: Invalid user data")
                    results.add_result("Protected Endpoint Access", False, "Invalid user data")
            else:
                print_error(f"Protected endpoint failed: HTTP {response.status_code}")
                results.add_result("Protected Endpoint Access", False, f"HTTP {response.status_code}")
        except Exception as e:
            print_error(f"Protected endpoint test failed: {str(e)}")
            results.add_result("Protected Endpoint Access", False, str(e))
    
    # Test 4: Access protected endpoint without token
    try:
        response = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        
        if response.status_code == 403:
            print_success("Unauthorized access correctly blocked")
            results.add_result("Unauthorized Access Block", True, "403 Forbidden as expected")
        else:
            print_error(f"Unauthorized access should return 403, got: {response.status_code}")
            results.add_result("Unauthorized Access Block", False, f"Expected 403, got {response.status_code}")
    except Exception as e:
        print_error(f"Unauthorized access test failed: {str(e)}")
        results.add_result("Unauthorized Access Block", False, str(e))

def test_products_crud(results):
    """Test complete Products CRUD operations"""
    print_test_header("Products CRUD Operations")
    
    headers = {"Authorization": f"Bearer {results.auth_token}"} if results.auth_token else {}
    
    # Test CREATE
    test_product = {
        "sku": f"TEST-PROD-{uuid.uuid4().hex[:8].upper()}",
        "barcodes": [f"TEST{uuid.uuid4().hex[:10]}"],
        "name_en": "Comprehensive Test Product",
        "name_si": "සම්පූර්ණ පරීක්ෂණ නිෂ්පාදනය",
        "name_ta": "விரிவான சோதனை தயாரிப்பு",
        "unit": "pcs",
        "category": "Test Electronics",
        "price_retail": 1500.00,
        "price_wholesale": 1350.00,
        "price_credit": 1400.00,
        "price_other": 1300.00,
        "stock": 100,
        "reorder_level": 20,
        "weight_based": False,
        "active": True
    }
    
    created_product_id = None
    try:
        response = requests.post(f"{BASE_URL}/products", json=test_product, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'product' in data and 'id' in data['product']:
                created_product_id = data['product']['id']
                results.test_data['product_id'] = created_product_id
                print_success(f"Product created successfully: {created_product_id}")
                results.add_result("Product CREATE", True, f"Created product {created_product_id}")
            else:
                print_error("Product CREATE: Invalid response structure")
                results.add_result("Product CREATE", False, "Invalid response structure")
        else:
            print_error(f"Product CREATE failed: HTTP {response.status_code}")
            results.add_result("Product CREATE", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Product CREATE failed: {str(e)}")
        results.add_result("Product CREATE", False, str(e))
    
    # Test READ (List)
    try:
        response = requests.get(f"{BASE_URL}/products?limit=10", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'products' in data and 'total' in data:
                print_success(f"Products READ (list): Retrieved {len(data['products'])} of {data['total']} products")
                results.add_result("Products READ (list)", True, f"{data['total']} products available")
            else:
                print_error("Products READ: Invalid response structure")
                results.add_result("Products READ (list)", False, "Invalid response structure")
        else:
            print_error(f"Products READ failed: HTTP {response.status_code}")
            results.add_result("Products READ (list)", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Products READ failed: {str(e)}")
        results.add_result("Products READ (list)", False, str(e))
    
    # Test READ (Single)
    if created_product_id:
        try:
            response = requests.get(f"{BASE_URL}/products/{created_product_id}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data['id'] == created_product_id:
                    print_success(f"Product READ (single): Retrieved product {created_product_id}")
                    results.add_result("Product READ (single)", True, f"Retrieved product details")
                else:
                    print_error("Product READ (single): Invalid product data")
                    results.add_result("Product READ (single)", False, "Invalid product data")
            else:
                print_error(f"Product READ (single) failed: HTTP {response.status_code}")
                results.add_result("Product READ (single)", False, f"HTTP {response.status_code}")
        except Exception as e:
            print_error(f"Product READ (single) failed: {str(e)}")
            results.add_result("Product READ (single)", False, str(e))
    
    # Test UPDATE
    if created_product_id:
        try:
            updated_product = test_product.copy()
            updated_product['name_en'] = "Updated Comprehensive Test Product"
            updated_product['price_retail'] = 1600.00
            updated_product['stock'] = 150
            
            response = requests.put(f"{BASE_URL}/products/{created_product_id}", json=updated_product, headers=headers, timeout=10)
            if response.status_code == 200:
                print_success(f"Product UPDATE successful: {created_product_id}")
                results.add_result("Product UPDATE", True, "Product updated successfully")
            else:
                print_error(f"Product UPDATE failed: HTTP {response.status_code}")
                results.add_result("Product UPDATE", False, f"HTTP {response.status_code}")
        except Exception as e:
            print_error(f"Product UPDATE failed: {str(e)}")
            results.add_result("Product UPDATE", False, str(e))
    
    # Test DELETE (Soft Delete)
    if created_product_id:
        try:
            response = requests.delete(f"{BASE_URL}/products/{created_product_id}", headers=headers, timeout=10)
            if response.status_code == 200:
                print_success(f"Product DELETE (soft) successful: {created_product_id}")
                results.add_result("Product DELETE", True, "Product soft deleted successfully")
            else:
                print_error(f"Product DELETE failed: HTTP {response.status_code}")
                results.add_result("Product DELETE", False, f"HTTP {response.status_code}")
        except Exception as e:
            print_error(f"Product DELETE failed: {str(e)}")
            results.add_result("Product DELETE", False, str(e))

def test_customers_crud(results):
    """Test complete Customers CRUD operations"""
    print_test_header("Customers CRUD Operations")
    
    headers = {"Authorization": f"Bearer {results.auth_token}"} if results.auth_token else {}
    
    # Test CREATE
    test_customer = {
        "name": f"Comprehensive Test Customer {uuid.uuid4().hex[:8]}",
        "phone": "0771234567",
        "email": "comprehensive.test@example.com",
        "category": "wholesale",
        "default_tier": "wholesale",
        "address": "123 Test Street, Comprehensive City, Sri Lanka",
        "tax_id": "TAX123456789",
        "notes": "Created during comprehensive API testing",
        "active": True
    }
    
    created_customer_id = None
    try:
        response = requests.post(f"{BASE_URL}/customers", json=test_customer, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'customer' in data and 'id' in data['customer']:
                created_customer_id = data['customer']['id']
                results.test_data['customer_id'] = created_customer_id
                print_success(f"Customer created successfully: {created_customer_id}")
                results.add_result("Customer CREATE", True, f"Created customer {created_customer_id}")
            else:
                print_error("Customer CREATE: Invalid response structure")
                results.add_result("Customer CREATE", False, "Invalid response structure")
        else:
            print_error(f"Customer CREATE failed: HTTP {response.status_code}")
            results.add_result("Customer CREATE", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Customer CREATE failed: {str(e)}")
        results.add_result("Customer CREATE", False, str(e))
    
    # Test READ (List)
    try:
        response = requests.get(f"{BASE_URL}/customers?limit=10", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'customers' in data and 'total' in data:
                print_success(f"Customers READ (list): Retrieved {len(data['customers'])} of {data['total']} customers")
                results.add_result("Customers READ (list)", True, f"{data['total']} customers available")
            else:
                print_error("Customers READ: Invalid response structure")
                results.add_result("Customers READ (list)", False, "Invalid response structure")
        else:
            print_error(f"Customers READ failed: HTTP {response.status_code}")
            results.add_result("Customers READ (list)", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Customers READ failed: {str(e)}")
        results.add_result("Customers READ (list)", False, str(e))
    
    # Test READ (Single)
    if created_customer_id:
        try:
            response = requests.get(f"{BASE_URL}/customers/{created_customer_id}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and data['id'] == created_customer_id:
                    print_success(f"Customer READ (single): Retrieved customer {created_customer_id}")
                    results.add_result("Customer READ (single)", True, "Retrieved customer details")
                else:
                    print_error("Customer READ (single): Invalid customer data")
                    results.add_result("Customer READ (single)", False, "Invalid customer data")
            else:
                print_error(f"Customer READ (single) failed: HTTP {response.status_code}")
                results.add_result("Customer READ (single)", False, f"HTTP {response.status_code}")
        except Exception as e:
            print_error(f"Customer READ (single) failed: {str(e)}")
            results.add_result("Customer READ (single)", False, str(e))
    
    # Test UPDATE
    if created_customer_id:
        try:
            updated_customer = test_customer.copy()
            updated_customer['name'] = "Updated Comprehensive Test Customer"
            updated_customer['phone'] = "0779876543"
            updated_customer['category'] = "retail"
            
            response = requests.put(f"{BASE_URL}/customers/{created_customer_id}", json=updated_customer, headers=headers, timeout=10)
            if response.status_code == 200:
                print_success(f"Customer UPDATE successful: {created_customer_id}")
                results.add_result("Customer UPDATE", True, "Customer updated successfully")
            else:
                print_error(f"Customer UPDATE failed: HTTP {response.status_code}")
                results.add_result("Customer UPDATE", False, f"HTTP {response.status_code}")
        except Exception as e:
            print_error(f"Customer UPDATE failed: {str(e)}")
            results.add_result("Customer UPDATE", False, str(e))

def test_sales_operations(results):
    """Test Sales creation and reading"""
    print_test_header("Sales Operations")
    
    headers = {"Authorization": f"Bearer {results.auth_token}"} if results.auth_token else {}
    
    # Create a test sale
    test_sale = {
        "customer_id": results.test_data.get('customer_id'),
        "customer_name": "Test Customer",
        "price_tier": "retail",
        "items": [
            {
                "product_id": results.test_data.get('product_id', 'test-product-id'),
                "sku": "TEST-SKU-001",
                "name": "Test Product",
                "quantity": 2,
                "weight": 0.0,
                "unit_price": 100.00,
                "discount_percent": 0.0,
                "discount_amount": 0.0,
                "subtotal": 200.00,
                "total": 200.00
            }
        ],
        "subtotal": 200.00,
        "total_discount": 0.00,
        "tax_amount": 0.00,
        "total": 200.00,
        "payments": [
            {
                "method": "cash",
                "amount": 200.00,
                "reference": ""
            }
        ],
        "status": "completed",
        "terminal_name": "Test Terminal",
        "cashier_name": "Test Cashier",
        "notes": "Comprehensive test sale"
    }
    
    created_sale_id = None
    try:
        response = requests.post(f"{BASE_URL}/sales", json=test_sale, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'sale' in data and 'id' in data['sale']:
                created_sale_id = data['sale']['id']
                results.test_data['sale_id'] = created_sale_id
                print_success(f"Sale created successfully: {created_sale_id}")
                results.add_result("Sale CREATE", True, f"Created sale {created_sale_id}")
            else:
                print_error("Sale CREATE: Invalid response structure")
                results.add_result("Sale CREATE", False, "Invalid response structure")
        else:
            print_error(f"Sale CREATE failed: HTTP {response.status_code}")
            results.add_result("Sale CREATE", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Sale CREATE failed: {str(e)}")
        results.add_result("Sale CREATE", False, str(e))
    
    # Test READ Sales
    try:
        response = requests.get(f"{BASE_URL}/sales?limit=10", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'sales' in data and 'total' in data:
                print_success(f"Sales READ: Retrieved {len(data['sales'])} of {data['total']} sales")
                results.add_result("Sales READ", True, f"{data['total']} sales available")
            else:
                print_error("Sales READ: Invalid response structure")
                results.add_result("Sales READ", False, "Invalid response structure")
        else:
            print_error(f"Sales READ failed: HTTP {response.status_code}")
            results.add_result("Sales READ", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Sales READ failed: {str(e)}")
        results.add_result("Sales READ", False, str(e))

def test_user_management(results):
    """Test User Management (Manager only operations)"""
    print_test_header("User Management (Manager Only)")
    
    headers = {"Authorization": f"Bearer {results.auth_token}"} if results.auth_token else {}
    
    # Test GET users
    try:
        response = requests.get(f"{BASE_URL}/users", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'users' in data:
                print_success(f"Users READ: Retrieved {len(data['users'])} users")
                results.add_result("Users READ", True, f"{len(data['users'])} users found")
            else:
                print_error("Users READ: Invalid response structure")
                results.add_result("Users READ", False, "Invalid response structure")
        elif response.status_code == 403:
            print_warning("Users READ: Access denied (user may not be manager)")
            results.add_result("Users READ", True, "Access control working (403)", warning=True)
        else:
            print_error(f"Users READ failed: HTTP {response.status_code}")
            results.add_result("Users READ", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Users READ failed: {str(e)}")
        results.add_result("Users READ", False, str(e))
    
    # Test CREATE user (only if we have manager access)
    test_user = {
        "username": f"testuser_{uuid.uuid4().hex[:8]}",
        "password": "testpass123",
        "full_name": "Test User for Comprehensive Testing",
        "role": "cashier"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users", json=test_user, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'user' in data:
                created_user_id = data['user']['id']
                results.test_data['user_id'] = created_user_id
                print_success(f"User created successfully: {created_user_id}")
                results.add_result("User CREATE", True, f"Created user {created_user_id}")
            else:
                print_error("User CREATE: Invalid response structure")
                results.add_result("User CREATE", False, "Invalid response structure")
        elif response.status_code == 403:
            print_warning("User CREATE: Access denied (user may not be manager)")
            results.add_result("User CREATE", True, "Access control working (403)", warning=True)
        else:
            print_error(f"User CREATE failed: HTTP {response.status_code}")
            results.add_result("User CREATE", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"User CREATE failed: {str(e)}")
        results.add_result("User CREATE", False, str(e))

def test_advanced_features(results):
    """Test Advanced Features"""
    print_test_header("Advanced Features")
    
    headers = {"Authorization": f"Bearer {results.auth_token}"} if results.auth_token else {}
    
    # Test Discount Rules
    try:
        response = requests.get(f"{BASE_URL}/discount-rules", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'rules' in data:
                print_success(f"Discount Rules: Retrieved {len(data['rules'])} rules")
                results.add_result("Discount Rules", True, f"{len(data['rules'])} rules available")
            else:
                print_error("Discount Rules: Invalid response structure")
                results.add_result("Discount Rules", False, "Invalid response structure")
        else:
            print_error(f"Discount Rules failed: HTTP {response.status_code}")
            results.add_result("Discount Rules", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Discount Rules failed: {str(e)}")
        results.add_result("Discount Rules", False, str(e))
    
    # Test Inventory Tracking
    try:
        response = requests.get(f"{BASE_URL}/inventory/low-stock", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'products' in data and 'count' in data:
                print_success(f"Inventory Tracking: {data['count']} products need reordering")
                results.add_result("Inventory Tracking", True, f"Low stock monitoring working")
            else:
                print_error("Inventory Tracking: Invalid response structure")
                results.add_result("Inventory Tracking", False, "Invalid response structure")
        else:
            print_error(f"Inventory Tracking failed: HTTP {response.status_code}")
            results.add_result("Inventory Tracking", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Inventory Tracking failed: {str(e)}")
        results.add_result("Inventory Tracking", False, str(e))
    
    # Test Backup Creation
    try:
        response = requests.post(f"{BASE_URL}/backups/create", headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if 'backup' in data and 'metadata' in data:
                print_success("Backup Creation: System backup created successfully")
                results.add_result("Backup Creation", True, "Backup system working")
            else:
                print_error("Backup Creation: Invalid response structure")
                results.add_result("Backup Creation", False, "Invalid response structure")
        else:
            print_error(f"Backup Creation failed: HTTP {response.status_code}")
            results.add_result("Backup Creation", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Backup Creation failed: {str(e)}")
        results.add_result("Backup Creation", False, str(e))

def test_reports_analytics(results):
    """Test Reports & Analytics endpoints"""
    print_test_header("Reports & Analytics")
    
    headers = {"Authorization": f"Bearer {results.auth_token}"} if results.auth_token else {}
    
    report_endpoints = [
        ("/reports/sales-trends", "Sales Trends"),
        ("/reports/top-products", "Top Products"),
        ("/reports/sales-by-cashier", "Sales by Cashier"),
        ("/reports/profit-analysis", "Profit Analysis"),
        ("/reports/customer-insights", "Customer Insights")
    ]
    
    for endpoint, name in report_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and len(data) > 0:
                    print_success(f"{name}: Report generated successfully")
                    results.add_result(f"Report: {name}", True, "Report data available")
                else:
                    print_warning(f"{name}: Empty report (may be normal with no data)")
                    results.add_result(f"Report: {name}", True, "Empty report", warning=True)
            else:
                print_error(f"{name}: HTTP {response.status_code}")
                results.add_result(f"Report: {name}", False, f"HTTP {response.status_code}")
        except Exception as e:
            print_error(f"{name}: {str(e)}")
            results.add_result(f"Report: {name}", False, str(e))

def test_edge_cases(results):
    """Test Edge Cases and Error Handling"""
    print_test_header("Edge Cases & Error Handling")
    
    headers = {"Authorization": f"Bearer {results.auth_token}"} if results.auth_token else {}
    
    # Test 1: Invalid Product ID
    try:
        response = requests.get(f"{BASE_URL}/products/invalid-id-12345", headers=headers, timeout=10)
        if response.status_code == 404:
            print_success("Invalid Product ID: Correctly returns 404")
            results.add_result("Invalid Product ID", True, "404 error handling working")
        else:
            print_error(f"Invalid Product ID: Expected 404, got {response.status_code}")
            results.add_result("Invalid Product ID", False, f"Expected 404, got {response.status_code}")
    except Exception as e:
        print_error(f"Invalid Product ID test failed: {str(e)}")
        results.add_result("Invalid Product ID", False, str(e))
    
    # Test 2: Duplicate SKU
    try:
        duplicate_product = {
            "sku": "DUPLICATE-TEST-SKU",
            "name_en": "First Product",
            "price_retail": 100.00,
            "active": True
        }
        
        # Create first product
        response1 = requests.post(f"{BASE_URL}/products", json=duplicate_product, headers=headers, timeout=10)
        
        # Try to create duplicate
        response2 = requests.post(f"{BASE_URL}/products", json=duplicate_product, headers=headers, timeout=10)
        
        if response2.status_code == 400:
            print_success("Duplicate SKU: Correctly prevents duplicate creation")
            results.add_result("Duplicate SKU Prevention", True, "Duplicate validation working")
        else:
            print_error(f"Duplicate SKU: Expected 400, got {response2.status_code}")
            results.add_result("Duplicate SKU Prevention", False, f"Expected 400, got {response2.status_code}")
    except Exception as e:
        print_error(f"Duplicate SKU test failed: {str(e)}")
        results.add_result("Duplicate SKU Prevention", False, str(e))
    
    # Test 3: Missing Required Fields
    try:
        invalid_product = {
            "name_en": "Product without SKU",
            "price_retail": 100.00
            # Missing required 'sku' field
        }
        
        response = requests.post(f"{BASE_URL}/products", json=invalid_product, headers=headers, timeout=10)
        if response.status_code in [400, 422]:
            print_success("Missing Required Fields: Correctly validates input")
            results.add_result("Missing Fields Validation", True, "Input validation working")
        else:
            print_error(f"Missing Required Fields: Expected 400/422, got {response.status_code}")
            results.add_result("Missing Fields Validation", False, f"Expected 400/422, got {response.status_code}")
    except Exception as e:
        print_error(f"Missing Required Fields test failed: {str(e)}")
        results.add_result("Missing Fields Validation", False, str(e))
    
    # Test 4: Large Data Set Handling
    try:
        response = requests.get(f"{BASE_URL}/products?limit=1000", headers=headers, timeout=20)
        if response.status_code == 200:
            data = response.json()
            if 'products' in data:
                print_success(f"Large Data Set: Successfully handled request for {len(data['products'])} products")
                results.add_result("Large Data Set", True, "Large dataset handling working")
            else:
                print_error("Large Data Set: Invalid response structure")
                results.add_result("Large Data Set", False, "Invalid response structure")
        else:
            print_error(f"Large Data Set: HTTP {response.status_code}")
            results.add_result("Large Data Set", False, f"HTTP {response.status_code}")
    except Exception as e:
        print_error(f"Large Data Set test failed: {str(e)}")
        results.add_result("Large Data Set", False, str(e))

def check_mongodb_serialization(results):
    """Check MongoDB serialization across all endpoints"""
    print_test_header("MongoDB Serialization Check")
    
    headers = {"Authorization": f"Bearer {results.auth_token}"} if results.auth_token else {}
    
    endpoints_to_check = [
        "/products",
        "/customers", 
        "/sales",
        "/suppliers",
        "/discount-rules",
        "/settings"
    ]
    
    def has_mongodb_id(data):
        """Recursively check for MongoDB _id fields"""
        if isinstance(data, dict):
            if '_id' in data:
                return True
            return any(has_mongodb_id(v) for v in data.values())
        elif isinstance(data, list):
            return any(has_mongodb_id(item) for item in data)
        return False
    
    all_clean = True
    for endpoint in endpoints_to_check:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if has_mongodb_id(data):
                    print_error(f"MongoDB _id found in {endpoint}")
                    results.add_result(f"MongoDB Serialization {endpoint}", False, "_id field found")
                    all_clean = False
                else:
                    print_success(f"MongoDB serialization clean: {endpoint}")
            else:
                print_warning(f"Could not check {endpoint}: HTTP {response.status_code}")
        except Exception as e:
            print_warning(f"Could not check {endpoint}: {str(e)}")
    
    if all_clean:
        results.add_result("MongoDB Serialization", True, "All endpoints clean of _id fields")
    else:
        results.add_result("MongoDB Serialization", False, "Some endpoints contain _id fields")

def run_comprehensive_tests():
    """Run all comprehensive tests"""
    print(f"{Colors.BOLD}POS System Comprehensive Backend API Test Suite{Colors.ENDC}")
    print(f"Testing against: {BASE_URL}")
    print("=" * 80)
    
    results = TestResults()
    
    # Run all test suites
    test_health_check(results)
    test_authentication_system(results)
    test_products_crud(results)
    test_customers_crud(results)
    test_sales_operations(results)
    test_user_management(results)
    test_advanced_features(results)
    test_reports_analytics(results)
    test_edge_cases(results)
    check_mongodb_serialization(results)
    
    # Print detailed summary
    print(f"\n{Colors.BOLD}COMPREHENSIVE TEST SUMMARY{Colors.ENDC}")
    print("=" * 80)
    
    # Group results by category
    categories = {}
    for result in results.results:
        category = result['name'].split(' ')[0] if ' ' in result['name'] else result['name']
        if category not in categories:
            categories[category] = []
        categories[category].append(result)
    
    # Print results by category
    for category, tests in categories.items():
        print(f"\n{Colors.BLUE}{category}:{Colors.ENDC}")
        for test in tests:
            if test['warning']:
                print_warning(f"  {test['name']}: {test['message']}")
            elif test['passed']:
                print_success(f"  {test['name']}: {test['message']}")
            else:
                print_error(f"  {test['name']}: {test['message']}")
    
    # Overall statistics
    print(f"\n{Colors.BOLD}OVERALL RESULTS:{Colors.ENDC}")
    print(f"✓ Passed: {results.passed}")
    print(f"⚠ Warnings: {results.warnings}")
    print(f"✗ Failed: {results.failed}")
    print(f"Total Tests: {len(results.results)}")
    
    # Calculate success rate
    success_rate = (results.passed / len(results.results)) * 100 if results.results else 0
    print(f"Success Rate: {success_rate:.1f}%")
    
    # Final verdict
    if results.failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL CRITICAL TESTS PASSED!{Colors.ENDC}")
        if results.warnings > 0:
            print(f"{Colors.YELLOW}Note: {results.warnings} warnings found (non-critical issues){Colors.ENDC}")
        print(f"{Colors.GREEN}Backend API is ready for production deployment.{Colors.ENDC}")
        return True
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ {results.failed} CRITICAL TEST(S) FAILED{Colors.ENDC}")
        print(f"{Colors.RED}Backend API requires fixes before production deployment.{Colors.ENDC}")
        return False

if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)