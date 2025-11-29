#!/usr/bin/env python3
"""
POS System Backend API Test Suite
Tests Phase 6 completion features and MongoDB serialization fixes
"""

import requests
import json
import uuid
from datetime import datetime
import sys

# Use the production backend URL from frontend/.env
BASE_URL = "https://quick-pos-15.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}=== {test_name} ==={Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.ENDC}")

def check_no_mongodb_id(data, endpoint_name):
    """Check that response doesn't contain MongoDB _id fields"""
    if isinstance(data, dict):
        if '_id' in data:
            print_error(f"{endpoint_name}: Found _id field in response")
            return False
        for key, value in data.items():
            if not check_no_mongodb_id(value, endpoint_name):
                return False
    elif isinstance(data, list):
        for item in data:
            if not check_no_mongodb_id(item, endpoint_name):
                return False
    return True

def test_health_check():
    """Test basic API health"""
    print_test_header("Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy':
                print_success("API is healthy and database connected")
                return True
            else:
                print_error(f"API unhealthy: {data}")
                return False
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check failed: {str(e)}")
        return False

def test_mongodb_serialization():
    """Test MongoDB serialization fixes - no _id fields in responses"""
    print_test_header("MongoDB Serialization Fix Verification")
    
    endpoints_to_test = [
        ("/products", "Products"),
        ("/customers", "Customers"), 
        ("/sales", "Sales"),
        ("/discount-rules", "Discount Rules")
    ]
    
    all_passed = True
    
    for endpoint, name in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if check_no_mongodb_id(data, name):
                    print_success(f"{name}: No _id fields found")
                else:
                    print_error(f"{name}: Found _id fields in response")
                    all_passed = False
            else:
                print_error(f"{name}: HTTP {response.status_code}")
                all_passed = False
        except Exception as e:
            print_error(f"{name}: {str(e)}")
            all_passed = False
    
    return all_passed

def test_products_api():
    """Test Products Management API endpoints"""
    print_test_header("Products Management API")
    
    test_results = []
    
    # Test GET /api/products with limit
    try:
        response = requests.get(f"{BASE_URL}/products?limit=10", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'products' in data and 'total' in data:
                print_success(f"GET /products: Retrieved {len(data['products'])} products")
                test_results.append(True)
            else:
                print_error("GET /products: Invalid response structure")
                test_results.append(False)
        else:
            print_error(f"GET /products: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"GET /products: {str(e)}")
        test_results.append(False)
    
    # Test GET /api/products/barcode/{barcode} - use sample barcode
    try:
        response = requests.get(f"{BASE_URL}/products/barcode/8901234567890", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'id' in data and 'sku' in data:
                print_success("GET /products/barcode: Found product by barcode")
                test_results.append(True)
            else:
                print_error("GET /products/barcode: Invalid product structure")
                test_results.append(False)
        elif response.status_code == 404:
            print_warning("GET /products/barcode: No product found with test barcode (expected if no seed data)")
            test_results.append(True)  # 404 is acceptable if no seed data
        else:
            print_error(f"GET /products/barcode: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"GET /products/barcode: {str(e)}")
        test_results.append(False)
    
    # Test POST /api/products - create new product
    test_product = {
        "sku": f"TEST-{uuid.uuid4().hex[:8].upper()}",
        "barcodes": [f"TEST{uuid.uuid4().hex[:10]}"],
        "name_en": "Test Product for API Testing",
        "name_si": "පරීක්ෂණ නිෂ්පාදනය",
        "name_ta": "சோதனை தயாரிப்பு",
        "unit": "pcs",
        "category": "Test Category",
        "price_retail": 100.00,
        "price_wholesale": 90.00,
        "stock": 50,
        "reorder_level": 10,
        "active": True
    }
    
    created_product_id = None
    try:
        response = requests.post(f"{BASE_URL}/products", json=test_product, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'message' in data and 'product' in data:
                created_product_id = data['product']['id']
                print_success(f"POST /products: Created product {created_product_id}")
                test_results.append(True)
            else:
                print_error("POST /products: Invalid response structure")
                test_results.append(False)
        else:
            print_error(f"POST /products: HTTP {response.status_code} - {response.text}")
            test_results.append(False)
    except Exception as e:
        print_error(f"POST /products: {str(e)}")
        test_results.append(False)
    
    # Test PUT /api/products/{id} - update product
    if created_product_id:
        try:
            updated_product = test_product.copy()
            updated_product['name_en'] = "Updated Test Product"
            updated_product['price_retail'] = 120.00
            
            response = requests.put(f"{BASE_URL}/products/{created_product_id}", json=updated_product, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    print_success(f"PUT /products: Updated product {created_product_id}")
                    test_results.append(True)
                else:
                    print_error("PUT /products: Invalid response structure")
                    test_results.append(False)
            else:
                print_error(f"PUT /products: HTTP {response.status_code}")
                test_results.append(False)
        except Exception as e:
            print_error(f"PUT /products: {str(e)}")
            test_results.append(False)
    
    # Test DELETE /api/products/{id} - soft delete product
    if created_product_id:
        try:
            response = requests.delete(f"{BASE_URL}/products/{created_product_id}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    print_success(f"DELETE /products: Soft deleted product {created_product_id}")
                    test_results.append(True)
                else:
                    print_error("DELETE /products: Invalid response structure")
                    test_results.append(False)
            else:
                print_error(f"DELETE /products: HTTP {response.status_code}")
                test_results.append(False)
        except Exception as e:
            print_error(f"DELETE /products: {str(e)}")
            test_results.append(False)
    
    return all(test_results)

def test_customers_api():
    """Test Customers Management API endpoints"""
    print_test_header("Customers Management API")
    
    test_results = []
    
    # Test GET /api/customers with limit
    try:
        response = requests.get(f"{BASE_URL}/customers?limit=10", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'customers' in data and 'total' in data:
                print_success(f"GET /customers: Retrieved {len(data['customers'])} customers")
                test_results.append(True)
            else:
                print_error("GET /customers: Invalid response structure")
                test_results.append(False)
        else:
            print_error(f"GET /customers: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"GET /customers: {str(e)}")
        test_results.append(False)
    
    # Test POST /api/customers - create new customer
    test_customer = {
        "name": f"Test Customer {uuid.uuid4().hex[:8]}",
        "phone": "0771234567",
        "email": "test@example.com",
        "category": "retail",
        "default_tier": "retail",
        "address": "Test Address, Colombo",
        "active": True
    }
    
    created_customer_id = None
    try:
        response = requests.post(f"{BASE_URL}/customers", json=test_customer, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'message' in data and 'customer' in data:
                created_customer_id = data['customer']['id']
                print_success(f"POST /customers: Created customer {created_customer_id}")
                test_results.append(True)
            else:
                print_error("POST /customers: Invalid response structure")
                test_results.append(False)
        else:
            print_error(f"POST /customers: HTTP {response.status_code} - {response.text}")
            test_results.append(False)
    except Exception as e:
        print_error(f"POST /customers: {str(e)}")
        test_results.append(False)
    
    # Test GET /api/customers/{id}
    if created_customer_id:
        try:
            response = requests.get(f"{BASE_URL}/customers/{created_customer_id}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'name' in data:
                    print_success(f"GET /customers/{{id}}: Retrieved customer {created_customer_id}")
                    test_results.append(True)
                else:
                    print_error("GET /customers/{id}: Invalid customer structure")
                    test_results.append(False)
            else:
                print_error(f"GET /customers/{{id}}: HTTP {response.status_code}")
                test_results.append(False)
        except Exception as e:
            print_error(f"GET /customers/{{id}}: {str(e)}")
            test_results.append(False)
    
    # Test PUT /api/customers/{id} - update customer
    if created_customer_id:
        try:
            updated_customer = test_customer.copy()
            updated_customer['name'] = "Updated Test Customer"
            updated_customer['phone'] = "0779876543"
            
            response = requests.put(f"{BASE_URL}/customers/{created_customer_id}", json=updated_customer, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    print_success(f"PUT /customers: Updated customer {created_customer_id}")
                    test_results.append(True)
                else:
                    print_error("PUT /customers: Invalid response structure")
                    test_results.append(False)
            else:
                print_error(f"PUT /customers: HTTP {response.status_code}")
                test_results.append(False)
        except Exception as e:
            print_error(f"PUT /customers: {str(e)}")
            test_results.append(False)
    
    return all(test_results)

def test_dashboard_apis():
    """Test Dashboard Data APIs"""
    print_test_header("Dashboard Data APIs")
    
    test_results = []
    
    # Test GET /api/products for total count
    try:
        response = requests.get(f"{BASE_URL}/products", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'total' in data:
                print_success(f"Dashboard Products Count: {data['total']} products")
                test_results.append(True)
            else:
                print_error("Dashboard Products: Missing total count")
                test_results.append(False)
        else:
            print_error(f"Dashboard Products: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"Dashboard Products: {str(e)}")
        test_results.append(False)
    
    # Test GET /api/customers for total count
    try:
        response = requests.get(f"{BASE_URL}/customers", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'total' in data:
                print_success(f"Dashboard Customers Count: {data['total']} customers")
                test_results.append(True)
            else:
                print_error("Dashboard Customers: Missing total count")
                test_results.append(False)
        else:
            print_error(f"Dashboard Customers: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"Dashboard Customers: {str(e)}")
        test_results.append(False)
    
    # Test GET /api/inventory/low-stock for alerts
    try:
        response = requests.get(f"{BASE_URL}/inventory/low-stock", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'products' in data and 'count' in data:
                print_success(f"Dashboard Low Stock: {data['count']} products need reordering")
                test_results.append(True)
            else:
                print_error("Dashboard Low Stock: Invalid response structure")
                test_results.append(False)
        else:
            print_error(f"Dashboard Low Stock: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"Dashboard Low Stock: {str(e)}")
        test_results.append(False)
    
    # Test GET /api/sales for recent sales
    try:
        response = requests.get(f"{BASE_URL}/sales?limit=10", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'sales' in data and 'total' in data:
                print_success(f"Dashboard Recent Sales: {len(data['sales'])} recent sales")
                test_results.append(True)
            else:
                print_error("Dashboard Recent Sales: Invalid response structure")
                test_results.append(False)
        else:
            print_error(f"Dashboard Recent Sales: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"Dashboard Recent Sales: {str(e)}")
        test_results.append(False)
    
    return all(test_results)

def test_additional_endpoints():
    """Test additional important endpoints"""
    print_test_header("Additional API Endpoints")
    
    test_results = []
    
    # Test GET /api/suppliers
    try:
        response = requests.get(f"{BASE_URL}/suppliers", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'suppliers' in data and 'total' in data:
                print_success(f"GET /suppliers: Retrieved {len(data['suppliers'])} suppliers")
                test_results.append(True)
            else:
                print_error("GET /suppliers: Invalid response structure")
                test_results.append(False)
        else:
            print_error(f"GET /suppliers: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"GET /suppliers: {str(e)}")
        test_results.append(False)
    
    # Test GET /api/settings
    try:
        response = requests.get(f"{BASE_URL}/settings", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                print_success("GET /settings: Retrieved store settings")
                test_results.append(True)
            else:
                print_error("GET /settings: Invalid response structure")
                test_results.append(False)
        else:
            print_error(f"GET /settings: HTTP {response.status_code}")
            test_results.append(False)
    except Exception as e:
        print_error(f"GET /settings: {str(e)}")
        test_results.append(False)
    
    return all(test_results)

def run_all_tests():
    """Run all test suites"""
    print(f"{Colors.BOLD}POS System Backend API Test Suite{Colors.ENDC}")
    print(f"Testing against: {BASE_URL}")
    print("=" * 60)
    
    test_results = []
    
    # Run all test suites
    test_results.append(("Health Check", test_health_check()))
    test_results.append(("MongoDB Serialization", test_mongodb_serialization()))
    test_results.append(("Products API", test_products_api()))
    test_results.append(("Customers API", test_customers_api()))
    test_results.append(("Dashboard APIs", test_dashboard_apis()))
    test_results.append(("Additional Endpoints", test_additional_endpoints()))
    
    # Print summary
    print(f"\n{Colors.BOLD}TEST SUMMARY{Colors.ENDC}")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        if result:
            print_success(f"{test_name}: PASSED")
            passed += 1
        else:
            print_error(f"{test_name}: FAILED")
            failed += 1
    
    print(f"\n{Colors.BOLD}OVERALL RESULTS:{Colors.ENDC}")
    print(f"✓ Passed: {passed}")
    print(f"✗ Failed: {failed}")
    print(f"Total: {len(test_results)}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! Backend API is working correctly.{Colors.ENDC}")
        return True
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ {failed} TEST(S) FAILED. Please check the issues above.{Colors.ENDC}")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)