import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { getTranslation } from './translations';
import Login from './Login';
import DiscountRules from './DiscountRules';
import PriceManagement from './PriceManagement';
import CSVManagement from './CSVManagement';
import InventoryManagement from './InventoryManagement';
import ReportsManagement from './ReportsManagement';
import SettingsManagement from './SettingsManagement';
import DeviceSettings from './DeviceSettings';
import TerminalManagement from './TerminalManagement';
import ProductsManagement from './ProductsManagement';
import CustomersManagement from './CustomersManagement';
import LoyaltyManagement from './LoyaltyManagement';
import Dashboard from './Dashboard';
import LabelPrinting from './LabelPrinting';
import InvoicePrint from './InvoicePrint';
import AdvancedReports from './AdvancedReports';
import StockEntry from './StockEntry';
import StockAdjustments from './StockAdjustments';
import StockMovements from './StockMovements';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Configure axios to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
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
  const [heldBills, setHeldBills] = useState([]);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [payments, setPayments] = useState([]);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState(0);

  // State for product search
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const barcodeInputRef = useRef(null);
  const scanBuffer = useRef('');
  const scanTimeout = useRef(null);
  const barcodeTimerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  const getText = (key) => getTranslation(language, key) || t[language]?.[key] || t.en?.[key] || key;

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // Authentication handlers
  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  // Auto-focus barcode input on mount and cleanup timer
  useEffect(() => {
    if (currentView === 'pos' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
    
    // Cleanup barcode auto-enter timer on unmount
    return () => {
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
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

  // Product search function - searches by name, SKU, or ID
  const handleProductSearch = (searchValue) => {
    setProductSearchTerm(searchValue);
    
    if (!searchValue || searchValue.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const results = products.filter(product => {
      // Search by product name (all languages)
      const nameMatch = 
        product.name_en?.toLowerCase().includes(searchLower) ||
        product.name_si?.includes(searchValue) ||
        product.name_ta?.includes(searchValue);
      
      // Search by SKU
      const skuMatch = product.sku?.toLowerCase().includes(searchLower);
      
      // Search by ID
      const idMatch = product.id?.toLowerCase().includes(searchLower);
      
      return nameMatch || skuMatch || idMatch;
    });

    setSearchResults(results.slice(0, 10)); // Show max 10 results
    setShowSearchResults(results.length > 0);
  };

  // Add product from search results
  const addProductFromSearch = (product) => {
    addToCart(product);
    setProductSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
    // Focus back to barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
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

  const addToCart = async (product) => {
    const priceField = `price_${selectedTier}`;
    const unitPrice = product[priceField] || product.price_retail;

    let updatedCart;
    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    
    if (existingIndex >= 0) {
      // Increment quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].subtotal = newCart[existingIndex].quantity * newCart[existingIndex].unit_price;
      newCart[existingIndex].total = newCart[existingIndex].subtotal - newCart[existingIndex].discount_amount;
      updatedCart = newCart;
    } else {
      // Add new item with all language names for invoice printing
      const newItem = {
        product_id: product.id,
        sku: product.sku,
        name: product.name_en, // English (default for display)
        name_en: product.name_en,
        name_si: product.name_si || product.name_en,
        name_ta: product.name_ta || product.name_en,
        category: product.category || '',
        quantity: 1,
        weight: 0,
        weight_based: product.weight_based,
        unit_price: unitPrice,
        discount_percent: 0,
        discount_amount: 0,
        subtotal: unitPrice,
        total: unitPrice
      };
      updatedCart = [...cart, newItem];
    }
    
    // Apply discount rules automatically
    try {
      const response = await axios.post(`${API_URL}/api/discount-rules/apply`, 
        updatedCart, 
        { params: { price_tier: selectedTier } }
      );
      setCart(response.data.items);
    } catch (error) {
      console.error('Error applying discounts:', error);
      // If discount application fails, still add the item without discount
      setCart(updatedCart);
    }
  };

  const updateCartItem = async (index, field, value) => {
    const newCart = [...cart];
    newCart[index][field] = parseFloat(value) || 0;
    
    // Recalculate
    const qty = newCart[index].quantity;
    const unitPrice = newCart[index].unit_price;
    newCart[index].subtotal = qty * unitPrice;
    
    if (field === 'discount_percent') {
      newCart[index].discount_amount = (newCart[index].subtotal * value) / 100;
      newCart[index].total = newCart[index].subtotal - newCart[index].discount_amount;
      setCart(newCart);
    } else if (field === 'quantity') {
      // Reapply discount rules when quantity changes
      try {
        const response = await axios.post(`${API_URL}/api/discount-rules/apply`, 
          newCart, 
          { params: { price_tier: selectedTier } }
        );
        setCart(response.data.items);
      } catch (error) {
        console.error('Error applying discounts:', error);
        newCart[index].total = newCart[index].subtotal - newCart[index].discount_amount;
        setCart(newCart);
      }
    } else {
      newCart[index].total = newCart[index].subtotal - newCart[index].discount_amount;
      setCart(newCart);
    }
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setBarcodeInput('');
    setPayments([]);
  };

  const fetchHeldBills = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/held-bills`);
      setHeldBills(response.data.bills || []);
    } catch (error) {
      console.error('Error fetching held bills:', error);
    }
  };

  const holdBill = async () => {
    if (cart.length === 0) {
      showNotification('Cart is empty!', 'error');
      return;
    }

    const { subtotal, totalDiscount, total } = calculateTotals();
    
    const heldBill = {
      customer_id: selectedCustomer?.id || null,
      customer_name: selectedCustomer?.name || 'Walk-in',
      price_tier: selectedTier,
      items: cart,
      subtotal,
      total_discount: totalDiscount,
      total,
      terminal_name: 'Terminal 1',
      cashier_name: 'Cashier',
      notes: ''
    };

    try {
      await axios.post(`${API_URL}/api/held-bills`, heldBill);
      showNotification('Bill held successfully!', 'success');
      clearCart();
      fetchHeldBills();
    } catch (error) {
      console.error('Error holding bill:', error);
      showNotification('Failed to hold bill!', 'error');
    }
  };

  const resumeBill = async (billId) => {
    try {
      const response = await axios.get(`${API_URL}/api/held-bills/${billId}`);
      const bill = response.data;
      
      setCart(bill.items);
      setSelectedTier(bill.price_tier);
      if (bill.customer_id) {
        const customer = customers.find(c => c.id === bill.customer_id);
        if (customer) setSelectedCustomer(customer);
      }
      
      await axios.delete(`${API_URL}/api/held-bills/${billId}`);
      fetchHeldBills();
      setShowHeldBills(false);
      showNotification('Bill resumed!', 'success');
    } catch (error) {
      console.error('Error resuming bill:', error);
      showNotification('Failed to resume bill!', 'error');
    }
  };

  const deleteHeldBill = async (billId) => {
    if (!window.confirm('Delete this held bill?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/held-bills/${billId}`);
      fetchHeldBills();
      showNotification('Held bill deleted!', 'success');
    } catch (error) {
      console.error('Error deleting held bill:', error);
      showNotification('Failed to delete bill!', 'error');
    }
  };

  const addPayment = () => {
    if (!paymentMethod || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      showNotification('Invalid payment details!', 'error');
      return;
    }

    const newPayment = {
      method: paymentMethod,
      amount: parseFloat(paymentAmount),
      reference: ''
    };

    setPayments([...payments, newPayment]);
    setPaymentAmount('');
    showNotification('Payment added!', 'success');
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const getTotalPaid = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getRemainingAmount = () => {
    const { total } = calculateTotals();
    return total - getTotalPaid();
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount_amount, 0);
    const total = subtotal - totalDiscount;
    return { subtotal, totalDiscount, total };
  };

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setSelectedTier(customer.default_tier || 'retail');
    
    // Fetch customer loyalty points
    if (customer.id) {
      try {
        const response = await axios.get(`${API_URL}/api/loyalty/customers/${customer.id}/points`);
        setCustomerLoyaltyPoints(response.data.points_balance || 0);
      } catch (error) {
        console.error('Failed to fetch loyalty points', error);
        setCustomerLoyaltyPoints(0);
      }
    }
    
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

  const handleRedeemPoints = async (points) => {
    if (!selectedCustomer || !selectedCustomer.id) {
      showNotification('Please select a customer first', 'error');
      return;
    }

    const { total } = calculateTotals();
    
    try {
      const response = await axios.post(`${API_URL}/api/loyalty/redeem`, {
        customer_id: selectedCustomer.id,
        points: points,
        sale_total: total
      });
      
      setLoyaltyPointsToRedeem(response.data.points_redeemed);
      setLoyaltyDiscount(response.data.discount_amount);
      setCustomerLoyaltyPoints(response.data.new_balance);
      showNotification(`Redeemed ${response.data.points_redeemed} points for LKR ${response.data.discount_amount.toFixed(2)} discount!`, 'success');
    } catch (error) {
      showNotification(error.response?.data?.detail || 'Failed to redeem points', 'error');
    }
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
    const { total } = calculateTotals();
    
    // For split payment mode
    if (showSplitPayment) {
      const totalPaid = getTotalPaid();
      if (totalPaid < total) {
        showNotification(`Remaining amount: LKR ${(total - totalPaid).toFixed(2)}`, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const { subtotal, totalDiscount } = calculateTotals();
      
      // Use split payments if available, otherwise single payment
      const paymentsToUse = showSplitPayment && payments.length > 0 
        ? payments 
        : [{
            method: paymentMethod,
            amount: parseFloat(paymentAmount) || total,
            reference: ''
          }];

      // **STRIPE INTEGRATION**: Handle card payments via Stripe
      let stripePaymentIntent = null;
      if (!showSplitPayment && paymentMethod === 'card') {
        try {
          // Create payment intent for card payment
          const paymentIntentResponse = await axios.post(`${API_URL}/api/payments/create-payment-intent`, {
            amount: total,
            currency: 'lkr',
            payment_method_types: ['card'],
            description: `POS Sale - ${new Date().toISOString()}`,
            invoice_number: ''  // Will be generated by backend
          });
          
          stripePaymentIntent = paymentIntentResponse.data;
          
          // In production, you would now:
          // 1. Use Stripe.js to collect card details
          // 2. Confirm the payment with the client_secret
          // 3. Wait for payment confirmation
          
          // **MOCKED**: For now, we auto-confirm the payment
          await axios.post(`${API_URL}/api/payments/confirm-payment`, {
            payment_intent_id: stripePaymentIntent.payment_intent_id,
            invoice_number: ''  // Will be updated after sale creation
          });
          
          // Add Stripe payment reference to payment data
          paymentsToUse[0].reference = stripePaymentIntent.payment_intent_id;
          
        } catch (stripeError) {
          console.error('Stripe payment error:', stripeError);
          setLoading(false);
          showNotification('Card payment failed! Please try another method.', 'error');
          return;
        }
      }
      
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
        payments: paymentsToUse,
        status: 'completed',
        terminal_name: 'Terminal 1',
        cashier_name: 'Cashier',
        notes: stripePaymentIntent ? `Stripe Payment: ${stripePaymentIntent.payment_intent_id}` : ''
      };

      const response = await axios.post(`${API_URL}/api/sales`, saleData);
      setLastSale(response.data.sale);
      setShowPaymentModal(false);
      setShowSplitPayment(false);
      clearCart();
      showNotification(
        stripePaymentIntent 
          ? 'Card payment successful! (MOCKED)' 
          : 'Sale completed successfully!', 
        'success'
      );
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

  const handlePrintLastInvoice = () => {
    // Check if there's a last sale or recent sale in history
    if (lastSale) {
      setShowInvoice(true);
      setTimeout(() => {
        window.print();
      }, 100);
    } else if (salesHistory && salesHistory.length > 0) {
      // Use the most recent sale from history
      setLastSale(salesHistory[0]);
      setShowInvoice(true);
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      showNotification('No invoice available to print', 'error');
    }
  };

  const getProductName = (item) => {
    if (language === 'si' && item.name_si) return item.name_si;
    if (language === 'ta' && item.name_ta) return item.name_ta;
    return item.name;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Allow Ctrl+P even in input fields for printing
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault();
          handlePrintLastInvoice();
        }
        return;
      }
      
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
      // F5 - Hold Bill
      if (e.key === 'F5') {
        e.preventDefault();
        holdBill();
      }
      // F6 - Show Held Bills
      if (e.key === 'F6') {
        e.preventDefault();
        fetchHeldBills();
        setShowHeldBills(true);
      }
      // Ctrl+P - Print Last Invoice
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrintLastInvoice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomer, selectedTier, salesHistory]);

  const { subtotal, totalDiscount, total } = calculateTotals();

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} language={language} getText={getText} />;
  }

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
              {/* User Info */}
              {currentUser && (
                <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{currentUser.full_name}</div>
                    <div className="text-xs opacity-90 capitalize">{currentUser.role}</div>
                  </div>
                </div>
              )}

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

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                title="Logout"
              >
                🚪 Logout
              </button>
              
              {/* Navigation */}
              <nav className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`nav-button px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === 'dashboard'
                      ? 'bg-white text-primary-600 shadow-md nav-button-active'
                      : 'bg-primary-700 text-white hover:bg-primary-800 hover:shadow-lg'
                  }`}
                  data-testid="nav-dashboard"
                >
                  🏠 {getText('dashboard')}
                </button>
                <button
                  onClick={() => setCurrentView('pos')}
                  className={`nav-button px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === 'pos'
                      ? 'bg-white text-primary-600 shadow-md nav-button-active'
                      : 'bg-primary-700 text-white hover:bg-primary-800 hover:shadow-lg'
                  }`}
                  data-testid="nav-pos"
                >
                  🛒 {getText('pos')}
                </button>
                <button
                  onClick={() => setCurrentView('sales')}
                  className={`nav-button px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === 'sales'
                      ? 'bg-white text-primary-600 shadow-md nav-button-active'
                      : 'bg-primary-700 text-white hover:bg-primary-800 hover:shadow-lg'
                  }`}
                  data-testid="nav-sales"
                >
                  💰 {getText('sales')}
                </button>
                <button
                  onClick={() => setCurrentView('products')}
                  className={`nav-button px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === 'products'
                      ? 'bg-white text-primary-600 shadow-md nav-button-active'
                      : 'bg-primary-700 text-white hover:bg-primary-800 hover:shadow-lg'
                  }`}
                  data-testid="nav-products"
                >
                  📦 {getText('products')}
                </button>
                <button
                  onClick={() => setCurrentView('customers')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'customers'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-customers"
                >
                  {getText('customers')}
                </button>
                <button
                  onClick={() => setCurrentView('loyalty')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'loyalty'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                >
                  🎁 Loyalty
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
                  {getText('discounts')}
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
                  {getText('prices')}
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
                  {getText('csv')}
                </button>
                <button
                  onClick={() => setCurrentView('labels')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'labels'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-labels"
                >
                  {getText('labels')}
                </button>
                <button
                  onClick={() => setCurrentView('stock-entry')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'stock-entry'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-stock-entry"
                >
                  📦 {getText('stockEntry')}
                </button>
                <button
                  onClick={() => setCurrentView('stock-adjustments')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'stock-adjustments'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-stock-adjustments"
                >
                  📝 {getText('stockAdjustments')}
                </button>
                <button
                  onClick={() => setCurrentView('stock-movements')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'stock-movements'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-stock-movements"
                >
                  📊 {getText('stockMovements')}
                </button>
                <button
                  onClick={() => setCurrentView('inventory')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'inventory'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-inventory"
                >
                  {getText('inventory')}
                </button>
                <button
                  onClick={() => setCurrentView('invoices')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'invoices'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-invoices"
                >
                  {getText('invoices')}
                </button>
                <button
                  onClick={() => setCurrentView('reports')}
                  className={`nav-button px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === 'reports'
                      ? 'bg-white text-indigo-600 shadow-md nav-button-active'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                  }`}
                  data-testid="nav-reports"
                >
                  📊 {getText('reports')}
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`nav-button px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === 'analytics'
                      ? 'bg-white text-purple-600 shadow-md nav-button-active'
                      : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                  }`}
                  data-testid="nav-analytics"
                >
                  📈 Analytics
                </button>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`nav-button px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === 'settings'
                      ? 'bg-white text-amber-600 shadow-md nav-button-active'
                      : 'bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg'
                  }`}
                  data-testid="nav-settings"
                >
                  ⚙️ {getText('settings')}
                </button>
                <button
                  onClick={() => setCurrentView('devices')}
                  className={`nav-button px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    currentView === 'devices'
                      ? 'bg-white text-cyan-600 shadow-md nav-button-active'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700 hover:shadow-lg'
                  }`}
                  data-testid="nav-devices"
                >
                  🖨️ Devices
                </button>
                <button
                  onClick={() => setCurrentView('terminals')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    currentView === 'terminals'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                  data-testid="nav-terminals"
                >
                  {getText('terminals')}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setBarcodeInput(value);
                      
                      // Auto-enter functionality for barcode scanners
                      // Clear any existing timer
                      if (barcodeTimerRef.current) {
                        clearTimeout(barcodeTimerRef.current);
                      }
                      
                      // If barcode looks complete (8-13 digits common for barcodes)
                      if (value.length >= 8) {
                        barcodeTimerRef.current = setTimeout(() => {
                          handleBarcodeScanned(value);
                        }, 300); // 300ms delay after last character
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && barcodeInput) {
                        // Clear timer if user manually presses Enter
                        if (barcodeTimerRef.current) {
                          clearTimeout(barcodeTimerRef.current);
                        }
                        handleBarcodeScanned(barcodeInput);
                      }
                    }}
                    className="flex-1 px-4 py-3 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-lg"
                    placeholder="Scan or enter barcode... (auto-adds)"
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
              {/* Product Search */}
              <div className="bg-white rounded-lg shadow-md p-6 relative">
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Search Products by Name, SKU, or ID
                  <span className="shortcut-hint text-gray-500">(F3)</span>
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    onFocus={() => productSearchTerm.length >= 2 && setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchResults.length > 0) {
                        // Add first search result to cart when Enter is pressed
                        addProductFromSearch(searchResults[0]);
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:outline-none focus:border-secondary-500 text-lg"
                    placeholder="Search: Rice, SKU-001, or product ID... (Press Enter)"
                    data-testid="product-search-input"
                  />
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-secondary-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                      {searchResults.map((product, index) => (
                        <div
                          key={product.id}
                          onClick={() => addProductFromSearch(product)}
                          className="p-4 hover:bg-secondary-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                {language === 'si' && product.name_si ? product.name_si : 
                                 language === 'ta' && product.name_ta ? product.name_ta : 
                                 product.name_en}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">SKU:</span> {product.sku}
                                {product.category && (
                                  <span className="ml-3">
                                    <span className="font-medium">Category:</span> {product.category}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Stock: {product.stock} {product.unit}
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-lg font-bold text-primary-600">
                                LKR {product[`price_${selectedTier}`] || product.price_retail}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {selectedTier}
                              </div>
                            </div>
                          </div>
                          {/* Show barcodes if available */}
                          {product.barcodes && product.barcodes.length > 0 && (
                            <div className="text-xs text-gray-500 mt-2">
                              Barcode: {product.barcodes[0]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* No Results Message */}
                  {showSearchResults && searchResults.length === 0 && productSearchTerm.length >= 2 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4">
                      <div className="text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium">No products found</p>
                        <p className="text-sm mt-1">Try a different search term</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Search Tips */}
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Search by:</span> Product Name (සිංහල/தமිழ්/English) · SKU · Product ID
                  <br />
                  <span className="font-medium">Tip:</span> Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> to add first result to cart
                </div>
              </div>

              {/* Shopping Cart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    {getText('cart')} ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        fetchHeldBills();
                        setShowHeldBills(true);
                      }}
                      className="px-3 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition btn-press"
                      data-testid="show-held-btn"
                    >
                      📋 Held ({heldBills.length})
                    </button>
                    <button
                      onClick={holdBill}
                      disabled={cart.length === 0}
                      className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition btn-press"
                      data-testid="hold-bill-btn"
                    >
                      ⏸️ Hold (F5)
                    </button>
                    <button
                      onClick={clearCart}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition btn-press"
                      data-testid="clear-cart-btn"
                    >
                      🗑️ Clear (F3)
                    </button>
                  </div>
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
                      {tier === 'retail' && (
                        <span className="ml-1 text-xs">🏷️</span>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Discount Rules Indicator */}
                {selectedTier === 'retail' ? (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                      <span>✓</span>
                      <span>Discount rules active</span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <span>ℹ️</span>
                      <span>Discounts only apply to Retail tier</span>
                    </p>
                  </div>
                )}
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

        {currentView === 'dashboard' && (
          <Dashboard language={language} getText={getText} onNavigate={setCurrentView} />
        )}

        {currentView === 'products' && (
          <ProductsManagement language={language} getText={getText} />
        )}

        {currentView === 'customers' && (
          <CustomersManagement language={language} getText={getText} />
        )}

        {currentView === 'loyalty' && (
          <LoyaltyManagement language={language} />
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

        {currentView === 'labels' && (
          <LabelPrinting language={language} getText={getText} />
        )}

        {currentView === 'stock-entry' && (
          <StockEntry language={language} />
        )}

        {currentView === 'stock-adjustments' && (
          <StockAdjustments language={language} currentUser={currentUser} />
        )}

        {currentView === 'stock-movements' && (
          <StockMovements language={language} />
        )}

        {currentView === 'inventory' && (
          <InventoryManagement language={language} getText={getText} />
        )}

        {currentView === 'invoices' && (
          <InvoicePrint language={language} getText={getText} />
        )}

        {currentView === 'reports' && (
          <ReportsManagement language={language} getText={getText} />
        )}

        {currentView === 'analytics' && (
          <AdvancedReports language={language} getText={getText} />
        )}

        {currentView === 'settings' && (
          <SettingsManagement language={language} getText={getText} />
        )}

        {currentView === 'devices' && (
          <DeviceSettings language={language} getText={getText} />
        )}

        {currentView === 'terminals' && (
          <TerminalManagement language={language} getText={getText} />
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
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{getText('payment')}</h2>
              <button
                onClick={() => setShowSplitPayment(!showSplitPayment)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  showSplitPayment ? 'bg-accent-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Split Payment
              </button>
            </div>
            
            {!showSplitPayment ? (
              /* Single Payment Mode */
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
            ) : (
              /* Split Payment Mode */
              <div className="space-y-4">
                {/* Add Payment Form */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Add Payment</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="qr">QR/Wallet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addPayment}
                    className="w-full px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition"
                  >
                    + Add Payment
                  </button>
                </div>

                {/* Payments List */}
                {payments.length > 0 && (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Payments Added</h3>
                    <div className="space-y-2">
                      {payments.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                          <div>
                            <span className="font-medium capitalize">{payment.method}</span>
                            <span className="text-lg font-bold text-primary-600 ml-4">
                              LKR {payment.amount.toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={() => removePayment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Total Bill:</span>
                    <span className="font-semibold">LKR {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Total Paid:</span>
                    <span className="font-semibold text-secondary-600">LKR {getTotalPaid().toFixed(2)}</span>
                  </div>
                  <div className="border-t border-primary-200 pt-2">
                    <div className={`flex justify-between text-lg font-bold ${
                      getRemainingAmount() > 0 ? 'text-red-600' : 'text-secondary-600'
                    }`}>
                      <span>{getRemainingAmount() > 0 ? 'Remaining:' : 'Change:'}</span>
                      <span>LKR {Math.abs(getRemainingAmount()).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowSplitPayment(false);
                  setPayments([]);
                }}
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

      {/* Held Bills Modal */}
      {showHeldBills && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Held Bills</h2>

            {heldBills.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No held bills</p>
              </div>
            ) : (
              <div className="space-y-4">
                {heldBills.map(bill => (
                  <div key={bill.id} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {bill.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(bill.created_at).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bill.items.length} items • {bill.price_tier}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          LKR {bill.total.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {bill.terminal_name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3 mb-3">
                      <div className="text-sm text-gray-600 space-y-1">
                        {bill.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="font-medium">LKR {item.total.toFixed(2)}</span>
                          </div>
                        ))}
                        {bill.items.length > 3 && (
                          <div className="text-xs text-gray-400">
                            ... and {bill.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => resumeBill(bill.id)}
                        className="flex-1 px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-medium transition"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => deleteHeldBill(bill.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowHeldBills(false)}
                className="w-full px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
