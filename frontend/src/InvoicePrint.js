import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function InvoicePrint({ language, getText }) {
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceLanguage, setInvoiceLanguage] = useState('si');
  const [notification, setNotification] = useState(null);

  const translations = {
    si: {
      invoice: 'ඉන්වොයිසිය',
      storeName: 'වෙළඳසැල',
      invoiceNo: 'ඉන්වොයිසි අංකය',
      date: 'දිනය',
      time: 'වේලාව',
      customer: 'ගනුදෙනුකරු',
      item: 'භාණ්ඩය',
      qty: 'ප්‍රමාණය',
      price: 'මිල',
      total: 'එකතුව',
      subtotal: 'උප එකතුව',
      discount: 'වට්ටම',
      grandTotal: 'මුළු එකතුව',
      payment: 'ගෙවීම',
      cash: 'මුදල්',
      card: 'කාඩ්',
      qr: 'QR',
      change: 'ඉතිරිය',
      thankYou: 'ස්තූතියි!',
      cashier: 'අයකැමි'
    },
    ta: {
      invoice: 'இன்வாய்ஸ்',
      storeName: 'கடை',
      invoiceNo: 'இன்வாய்ஸ் எண்',
      date: 'தேதி',
      time: 'நேரம்',
      customer: 'வாடிக்கையாளர்',
      item: 'பொருள்',
      qty: 'அளவு',
      price: 'விலை',
      total: 'மொத்தம்',
      subtotal: 'துணை மொத்தம்',
      discount: 'தள்ளுபடி',
      grandTotal: 'பெரும் மொத்தம்',
      payment: 'பணம்',
      cash: 'பணம்',
      card: 'அட்டை',
      qr: 'QR',
      change: 'மாற்றம்',
      thankYou: 'நன்றி!',
      cashier: 'காசாளர்'
    },
    en: {
      invoice: 'Invoice',
      storeName: 'Store',
      invoiceNo: 'Invoice No',
      date: 'Date',
      time: 'Time',
      customer: 'Customer',
      item: 'Item',
      qty: 'Qty',
      price: 'Price',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      grandTotal: 'Grand Total',
      payment: 'Payment',
      cash: 'Cash',
      card: 'Card',
      qr: 'QR',
      change: 'Change',
      thankYou: 'Thank You!',
      cashier: 'Cashier'
    }
  };

  useEffect(() => {
    fetchSales();
    fetchSettings();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSales = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/sales?limit=100`);
      setSales(response.data.sales || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/settings`);
      setSettings(response.data || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handlePrintInvoice = (sale) => {
    setSelectedSale(sale);
    setTimeout(() => {
      window.print();
      showNotification('Invoice sent to printer', 'success');
    }, 100);
  };

  const getTranslation = (key) => {
    return translations[invoiceLanguage][key] || key;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  const calculateChange = (sale) => {
    const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    return totalPaid - sale.total;
  };

  const filteredSales = sales.filter(sale =>
    sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`toast px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-secondary-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header - Hidden during print */}
      <div className="no-print">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Invoice Printing</h2>
          <div className="flex gap-3">
            <select
              value={invoiceLanguage}
              onChange={(e) => setInvoiceLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="si">සිංහල (Sinhala)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sale.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {sale.items.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      LKR {sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sale.status === 'completed' ? 'bg-secondary-100 text-secondary-800' :
                        sale.status === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePrintInvoice(sale)}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition"
                      >
                        🖨️ Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Print Template - Only visible during print */}
      {selectedSale && (
        <div className="print-only invoice-container">
          <div className="invoice-content">
            {/* Store Header */}
            <div className="text-center mb-4 pb-3 border-b-2 border-gray-800">
              <h1 className="text-2xl font-bold mb-1">
                {settings?.store_name || 'POS System'}
              </h1>
              {settings?.address && (
                <p className="text-sm">{settings.address}</p>
              )}
              {settings?.phone && (
                <p className="text-sm">Tel: {settings.phone}</p>
              )}
              {settings?.email && (
                <p className="text-sm">{settings.email}</p>
              )}
            </div>

            {/* Invoice Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-center mb-3">
                {getTranslation('invoice')}
              </h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>{getTranslation('invoiceNo')}:</strong> {selectedSale.invoice_number}
                </div>
                <div className="text-right">
                  <strong>{getTranslation('date')}:</strong> {formatDate(selectedSale.created_at)}
                </div>
                <div>
                  <strong>{getTranslation('customer')}:</strong> {selectedSale.customer_name || 'Walk-in'}
                </div>
                <div className="text-right">
                  <strong>{getTranslation('time')}:</strong> {formatTime(selectedSale.created_at)}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-4 text-sm">
              <thead className="border-b-2 border-gray-800">
                <tr>
                  <th className="text-left py-2">{getTranslation('item')}</th>
                  <th className="text-center">{getTranslation('qty')}</th>
                  <th className="text-right">{getTranslation('price')}</th>
                  <th className="text-right">{getTranslation('total')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td className="py-2">{item.name}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{item.unit_price.toFixed(2)}</td>
                    <td className="text-right font-semibold">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t-2 border-gray-800 pt-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{getTranslation('subtotal')}:</span>
                <span>LKR {selectedSale.subtotal.toFixed(2)}</span>
              </div>
              {selectedSale.total_discount > 0 && (
                <div className="flex justify-between text-sm mb-1 text-red-600">
                  <span>{getTranslation('discount')}:</span>
                  <span>- LKR {selectedSale.total_discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-400 pt-2">
                <span>{getTranslation('grandTotal')}:</span>
                <span>LKR {selectedSale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-4 text-sm">
              <strong>{getTranslation('payment')}:</strong>
              <div className="ml-4 mt-1">
                {selectedSale.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{getTranslation(payment.method)}:</span>
                    <span>LKR {payment.amount.toFixed(2)}</span>
                  </div>
                ))}
                {calculateChange(selectedSale) > 0 && (
                  <div className="flex justify-between font-semibold mt-1 pt-1 border-t border-gray-300">
                    <span>{getTranslation('change')}:</span>
                    <span>LKR {calculateChange(selectedSale).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-gray-800 pt-3 text-sm">
              <p className="font-bold mb-1">{getTranslation('thankYou')}</p>
              <p>{getTranslation('cashier')}: {selectedSale.cashier_name}</p>
              <p className="text-xs mt-2">Powered by POS System</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .invoice-container {
            width: 80mm;
            margin: 0 auto;
            font-family: 'Courier New', monospace;
          }
          .invoice-content {
            padding: 10mm;
          }
          body {
            background: white;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default InvoicePrint;
