import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';
import DiscountRules from './DiscountRules';
import PriceManagement from './PriceManagement';
import CSVManagement from './CSVManagement';
import InventoryManagement from './InventoryManagement';
import ReportsManagement from './ReportsManagement';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('pos');
  const [language, setLanguage] = useState('si'); // si, ta, en
  const [cart, setCart] = useState([]);
  const [selectedTier, setSelectedTier] = useState('retail');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const barcodeInputRef = useRef(null);
  const scanBuffer = useRef('');
  const scanTimeout = useRef(null);

  // Language translations
  const t = {
    en: {
      pos: 'POS',
      products: 'Products',
      customers: 'Customers',
      reports: 'Reports',
      settings: 'Settings',
      scanBarcode: 'Scan/Enter Barcode',
      cart: 'Shopping Cart',
      empty: 'Empty',
      item: 'Item',
      qty: 'Qty',
      weight: 'Weight',
      price: 'Price',
      discount: 'Disc',
      total: 'Total',
      subtotal: 'Subtotal',
      totalDiscount: 'Total Discount',
      grandTotal: 'Grand Total',
      selectTier: 'Price Tier',
      retail: 'Retail',
      wholesale: 'Wholesale',
      credit: 'Credit',
      other: 'Other',
      pay: 'Pay',
      clear: 'Clear',
      customer: 'Customer',
      selectCustomer: 'Select Customer',
      payment: 'Payment',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      card: 'Card',
      qr: 'QR/Wallet',
      amount: 'Amount',
      confirm: 'Confirm',
      cancel: 'Cancel',
      invoice: 'Invoice',
      print: 'Print',
      newSale: 'New Sale',
      salesHistory: 'Sales History',
      invoiceNo: 'Invoice No',
      date: 'Date',
      actions: 'Actions',
      view: 'View',
      loadSampleData: 'Load Sample Data',
    },
    si: {
      pos: 'විකුණුම්',
      products: 'භාණ්ඩ',
      customers: 'ගනුදෙනුකරුවන්',
      reports: 'වාර්තා',
      settings: 'සැකසීම්',
      scanBarcode: 'බාර්කෝඩ් ස්කෑන් කරන්න',
      cart: 'කරත්තය',
      empty: 'හිස්',
      item: 'භාණ්ඩය',
      qty: 'ප්‍රමාණය',
      weight: 'බර',
      price: 'මිල',
      discount: 'වට්ටම',
      total: 'එකතුව',
      subtotal: 'උප එකතුව',
      totalDiscount: 'මුළු වට්ටම',
      grandTotal: 'මුළු එකතුව',
      selectTier: 'මිල මට්ටම',
      retail: 'සිල්ලර',
      wholesale: 'තොග',
      credit: 'ණය',
      other: 'වෙනත්',
      pay: 'ගෙවන්න',
      clear: 'හිස් කරන්න',
      customer: 'ගනුදෙනුකරු',
      selectCustomer: 'ගනුදෙනුකරු තෝරන්න',
      payment: 'ගෙවීම',
      paymentMethod: 'ගෙවීමේ ක්‍රමය',
      cash: 'මුදල්',
      card: 'කාඩ්පත',
      qr: 'QR/පසුම්බිය',
      amount: 'මුදල',
      confirm: 'තහවුරු කරන්න',
      cancel: 'අවලංගු',
      invoice: 'බිල්පත',
      print: 'මුද්‍රණය',
      newSale: 'නව විකිණීම',
      salesHistory: 'විකුණුම් ඉතිහාසය',
      invoiceNo: 'බිල්පත් අංකය',
      date: 'දිනය',
      actions: 'ක්‍රියා',
      view: 'බලන්න',
      loadSampleData: 'නියැදි දත්ත පූරණය',
    },
    ta: {
      pos: 'விற்பனை',
      products: 'பொருட்கள்',
      customers: 'வாடிக்கையாளர்கள்',
      reports: 'அறிக்கைகள்',
      settings: 'அமைப்புகள்',
      scanBarcode: 'பார்கோடு ஸ்கேன் செய்யவும்',
      cart: 'வண்டி',
      empty: 'வெற்று',
      item: 'பொருள்',
      qty: 'அளவு',
      weight: 'எடை',
      price: 'விலை',
      discount: 'தள்ளுபடி',
      total: 'மொத்தம்',
      subtotal: 'துணை மொத்தம்',
      totalDiscount: 'மொத்த தள்ளுபடி',
      grandTotal: 'மொத்த தொகை',
      selectTier: 'விலை நிலை',
      retail: 'சில்லறை',
      wholesale: 'மொத்த',
      credit: 'கடன்',
      other: 'மற்றவை',
      pay: 'செலுத்து',
      clear: 'அழி',
      customer: 'வாடிக்கையாளர்',
      selectCustomer: 'வாடிக்கையாளரைத் தேர்ந்தெடு',
      payment: 'கட்டணம்',
      paymentMethod: 'கட்டண முறை',
      cash: 'பண',
      card: 'அட்டை',
      qr: 'QR/பணப்பை',
      amount: 'தொகை',
      confirm: 'உறுதிப்படுத்து',
      cancel: 'ரத்து',
      invoice: 'விலைப்பட்டியல்',
      print: 'அச்சிடு',
      newSale: 'புதிய விற்பனை',
      salesHistory: 'விற்பனை வரலாறு',
      invoiceNo: 'விலைப்பட்டியல் எண்',
      date: 'தேதி',
      actions: 'நடவடிக்கைகள்',
      view: 'பார்',
      loadSampleData: 'மாதிரி தரவு ஏற்று',
    }
  };

  const getText = (key) => t[language][key] || t.en[key] || key;

  // Auto-focus barcode input on mount
  useEffect(() => {
    if (currentView === 'pos' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [currentView]);

  // Barcode scanner detection (detects rapid keyboard input)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentView !== 'pos') return;
      if (e.target.tagName === 'INPUT' && e.target !== barcodeInputRef.current) return;

      // Accumulate characters
      scanBuffer.current += e.key;

      // Clear previous timeout
      if (scanTimeout.current) {
        clearTimeout(scanTimeout.current);
      }

      // Set new timeout - if no input for 100ms, process the scan
      scanTimeout.current = setTimeout(() => {
        const scannedCode = scanBuffer.current;
        if (scannedCode.length > 3 && scannedCode !== 'Enter') {
          handleBarcodeScanned(scannedCode.replace('Enter', ''));
        }
        scanBuffer.current = '';
      }, 100);
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
    };
  }, [currentView, cart, selectedTier]);

  // Load initial data
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchSalesHistory();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products?limit=500`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/customers?limit=100`);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSalesHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/sales?limit=20`);
      setSalesHistory(response.data.sales || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const handleBarcodeScanned = async (barcode) => {
    try {
      const response = await axios.get(`${API_URL}/api/products/barcode/${barcode}`);
      const product = response.data;
      addToCart(product);
      showNotification(`Added: ${product.name_en}`, 'success');
      setBarcodeInput('');
    } catch (error) {
      showNotification('Product not found!', 'error');
      setBarcodeInput('');
    }
  };

  const addToCart = (product) => {
    const priceField = `price_${selectedTier}`;
    const unitPrice = product[priceField] || product.price_retail;

    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    
    if (existingIndex >= 0) {
      // Increment quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].subtotal = newCart[existingIndex].quantity * newCart[existingIndex].unit_price;
      newCart[existingIndex].total = newCart[existingIndex].subtotal - newCart[existingIndex].discount_amount;
      setCart(newCart);
    } else {
      // Add new item
      const newItem = {
        product_id: product.id,
        sku: product.sku,
        name: product.name_en,
        name_si: product.name_si,
        name_ta: product.name_ta,
        quantity: 1,
        weight: 0,
        weight_based: product.weight_based,
        unit_price: unitPrice,
        discount_percent: 0,
        discount_amount: 0,
        subtotal: unitPrice,
        total: unitPrice
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItem = (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = parseFloat(value) || 0;
    
    // Recalculate
    const qty = newCart[index].quantity;
    const unitPrice = newCart[index].unit_price;
    newCart[index].subtotal = qty * unitPrice;
    
    if (field === 'discount_percent') {
      newCart[index].discount_amount = (newCart[index].subtotal * value) / 100;
    }
    
    newCart[index].total = newCart[index].subtotal - newCart[index].discount_amount;
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setBarcodeInput('');
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount_amount, 0);
    const total = subtotal - totalDiscount;
    return { subtotal, totalDiscount, total };
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSelectedTier(customer.default_tier || 'retail');
    
    // Update cart prices based on tier
    const newCart = cart.map(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const priceField = `price_${customer.default_tier}`;
        const unitPrice = product[priceField] || product.price_retail;
        const subtotal = item.quantity * unitPrice;
        return {
          ...item,
          unit_price: unitPrice,
          subtotal,
          total: subtotal - item.discount_amount
        };
      }
      return item;
    });
    setCart(newCart);
  };

  const openPaymentModal = () => {
    if (cart.length === 0) {
      showNotification('Cart is empty!', 'error');
      return;
    }
    const { total } = calculateTotals();
    setPaymentAmount(total.toFixed(2));
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      const { subtotal, totalDiscount, total } = calculateTotals();
      
      const saleData = {
        invoice_number: '',
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || 'Walk-in',
        price_tier: selectedTier,
        items: cart,
        subtotal,
        total_discount: totalDiscount,
        tax_amount: 0,
        total,
        payments: [{
          method: paymentMethod,
          amount: parseFloat(paymentAmount) || total,
          reference: ''
        }],
        status: 'completed',
        terminal_name: 'Terminal 1',
        cashier_name: 'Cashier',
        notes: ''
      };

      const response = await axios.post(`${API_URL}/api/sales`, saleData);
      setLastSale(response.data.sale);
      setShowPaymentModal(false);
      clearCart();
      showNotification('Sale completed successfully!', 'success');
      setShowInvoice(true);
      fetchSalesHistory();
    } catch (error) {
      console.error('Payment error:', error);
      showNotification('Payment failed!', 'error');
    }
    setLoading(false);
  };

  const loadSampleData = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/seed-data`);
      showNotification('Sample data loaded successfully!', 'success');
      fetchProducts();
      fetchCustomers();
    } catch (error) {
      console.error('Error loading sample data:', error);
      showNotification('Failed to load sample data!', 'error');
    }
    setLoading(false);
  };

  const printInvoice = () => {
    window.print();
  };

  const getProductName = (item) => {
    if (language === 'si' && item.name_si) return item.name_si;
    if (language === 'ta' && item.name_ta) return item.name_ta;
    return item.name;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // F2 - Pay
      if (e.key === 'F2') {
        e.preventDefault();
        openPaymentModal();
      }
      // F3 - Clear
      if (e.key === 'F3') {
        e.preventDefault();
        clearCart();
      }
      // F4 - Focus barcode
      if (e.key === 'F4') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  const { subtotal, totalDiscount, total } = calculateTotals();

  return (
    <div className="App">
      {/* Notification Toast */}
      {notification && (
        <div className={`toast px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-secondary-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">POS System</h1>
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white text-primary-600 font-medium focus:outline-none focus:ring-2 focus:ring-secondary-400"
                data-testid="language-selector"
              >
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
                <option value="en">English</option>
              </select>
              
              {/* Navigation */}
              <nav className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentView('pos')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'pos'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-pos"
                >
                  {getText('pos')}
                </button>
                <button
                  onClick={() => setCurrentView('sales')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'sales'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-sales"
                >
                  Sales
                </button>
                <button
                  onClick={() => setCurrentView('discounts')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'discounts'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-discounts"
                >
                  Discounts
                </button>
                <button
                  onClick={() => setCurrentView('prices')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'prices'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-prices"
                >
                  Prices
                </button>
                <button
                  onClick={() => setCurrentView('csv')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'csv'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-csv"
                >
                  CSV
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {currentView === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Scan & Cart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Barcode Scanner */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  {getText('scanBarcode')}
                  <span className="shortcut-hint text-gray-500">(F4)</span>
                </label>
                <div className="flex gap-3">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && barcodeInput) {
                        handleBarcodeScanned(barcodeInput);
                      }
                    }}
                    className="flex-1 px-4 py-3 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-lg"
                    placeholder="Scan or enter barcode..."
                    autoFocus
                    data-testid="barcode-input"
                  />
                  <button
                    onClick={loadSampleData}
                    className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-medium transition btn-press"
                    data-testid="load-sample-btn"
                  >
                    {getText('loadSampleData')}
                  </button>
                </div>
              </div>

              {/* Shopping Cart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {getText('cart')} ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition btn-press"
                    data-testid="clear-cart-btn"
                  >
                    {getText('clear')} <span className="shortcut-hint">(F3)</span>
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg font-medium">{getText('empty')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div
                        key={index}
                        className="cart-item bg-gray-50 border border-gray-200 rounded-lg p-4"
                        data-testid={`cart-item-${index}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className={`font-semibold text-gray-800 ${language === 'si' ? 'sinhala-text' : language === 'ta' ? 'tamil-text' : ''}`}>
                              {getProductName(item)}
                            </h3>
                            <p className="text-sm text-gray-500">{item.sku}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-500 hover:text-red-700"
                            data-testid={`remove-item-${index}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-600">{getText('qty')}</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                              data-testid={`qty-${index}`}
                            />
                          </div>
                          
                          {item.weight_based && (
                            <div>
                              <label className="text-xs text-gray-600">{getText('weight')}</label>
                              <input
                                type="number"
                                step="0.1"
                                value={item.weight}
                                onChange={(e) => updateCartItem(index, 'weight', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                                data-testid={`weight-${index}`}
                              />
                            </div>
                          )}
                          
                          <div>
                            <label className="text-xs text-gray-600">{getText('price')}</label>
                            <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                              {item.unit_price.toFixed(2)}
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs text-gray-600">{getText('discount')} %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={item.discount_percent}
                              onChange={(e) => updateCartItem(index, 'discount_percent', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                              data-testid={`discount-${index}`}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-2 flex justify-end">
                          <span className="text-lg font-bold text-primary-600">
                            LKR {item.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Customer & Totals */}
            <div className="space-y-6">
              {/* Customer Selection */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{getText('customer')}</h3>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value);
                    if (customer) handleCustomerSelect(customer);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  data-testid="customer-select"
                >
                  <option value="">{getText('selectCustomer')}</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Tier */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{getText('selectTier')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['retail', 'wholesale', 'credit', 'other'].map(tier => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        selectedTier === tier
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      data-testid={`tier-${tier}`}
                    >
                      {getText(tier)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg shadow-md p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>{getText('subtotal')}:</span>
                    <span className="font-semibold">LKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>{getText('totalDiscount')}:</span>
                    <span className="font-semibold">- LKR {totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-primary-300 pt-3">
                    <div className="flex justify-between text-2xl font-bold text-primary-700">
                      <span>{getText('grandTotal')}:</span>
                      <span data-testid="grand-total">LKR {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={openPaymentModal}
                  disabled={cart.length === 0}
                  className="w-full mt-6 px-6 py-4 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white text-xl font-bold rounded-lg transition btn-press"
                  data-testid="pay-btn"
                >
                  {getText('pay')} <span className="shortcut-hint">(F2)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'discounts' && (
          <DiscountRules language={language} getText={getText} />
        )}

        {currentView === 'prices' && (
          <PriceManagement language={language} getText={getText} />
        )}

        {currentView === 'csv' && (
          <CSVManagement language={language} getText={getText} />
        )}

        {currentView === 'sales' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{getText('salesHistory')}</h2>
            
            {salesHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No sales yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {getText('invoiceNo')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {getText('customer')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {getText('date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {getText('total')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {getText('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesHistory.map(sale => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                          LKR {sale.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              setLastSale(sale);
                              setShowInvoice(true);
                            }}
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            {getText('view')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{getText('payment')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('paymentMethod')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['cash', 'card', 'qr'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        paymentMethod === method
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      data-testid={`payment-${method}`}
                    >
                      {getText(method)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-lg"
                  data-testid="payment-amount"
                />
              </div>

              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex justify-between text-xl font-bold text-primary-700">
                  <span>{getText('total')}:</span>
                  <span>LKR {total.toFixed(2)}</span>
                </div>
                {parseFloat(paymentAmount) > total && (
                  <div className="flex justify-between text-lg text-secondary-600 mt-2">
                    <span>Change:</span>
                    <span>LKR {(parseFloat(paymentAmount) - total).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition"
                data-testid="cancel-payment-btn"
              >
                {getText('cancel')}
              </button>
              <button
                onClick={processPayment}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition btn-press"
                data-testid="confirm-payment-btn"
              >
                {loading ? 'Processing...' : getText('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && lastSale && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto fade-in print-area">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-center text-primary-600 mb-2">
                {getText('invoice')}
              </h2>
              <div className="text-center text-gray-600">
                <p className="font-semibold">My Grocery Store</p>
                <p className="text-sm">123 Main Street, Colombo</p>
                <p className="text-sm">Tel: 0112345678</p>
              </div>
            </div>

            <div className="border-t border-b border-gray-300 py-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>{getText('invoiceNo')}:</strong> {lastSale.invoice_number}</p>
                  <p><strong>{getText('date')}:</strong> {new Date(lastSale.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p><strong>{getText('customer')}:</strong> {lastSale.customer_name}</p>
                  <p><strong>Terminal:</strong> {lastSale.terminal_name}</p>
                </div>
              </div>
            </div>

            <table className="w-full mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-sm">{getText('item')}</th>
                  <th className="px-3 py-2 text-right text-sm">{getText('qty')}</th>
                  <th className="px-3 py-2 text-right text-sm">{getText('price')}</th>
                  <th className="px-3 py-2 text-right text-sm">{getText('discount')}</th>
                  <th className="px-3 py-2 text-right text-sm">{getText('total')}</th>
                </tr>
              </thead>
              <tbody>
                {lastSale.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className={`px-3 py-2 text-sm ${language === 'si' ? 'sinhala-text' : language === 'ta' ? 'tamil-text' : ''}`}>
                      {getProductName(item)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-sm">{item.unit_price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-sm">{item.discount_amount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-sm font-semibold">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-gray-300 pt-4 mb-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>{getText('subtotal')}:</span>
                    <span>LKR {lastSale.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>{getText('totalDiscount')}:</span>
                    <span>- LKR {lastSale.total_discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-primary-700 border-t pt-2">
                    <span>{getText('grandTotal')}:</span>
                    <span>LKR {lastSale.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 mb-6">
              <p>Thank you for your business!</p>
              <p className="sinhala-text">ස්තූතියි!</p>
              <p className="tamil-text">நன்றி!</p>
            </div>

            <div className="flex gap-3 print:hidden">
              <button
                onClick={printInvoice}
                className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition btn-press"
                data-testid="print-invoice-btn"
              >
                {getText('print')}
              </button>
              <button
                onClick={() => setShowInvoice(false)}
                className="flex-1 px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-medium transition btn-press"
                data-testid="new-sale-btn"
              >
                {getText('newSale')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
