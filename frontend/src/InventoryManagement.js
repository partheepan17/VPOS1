import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function InventoryManagement({ language, getText }) {
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('receive');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchAlerts();
    fetchLogs();
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

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/inventory/alerts`);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchLogs = async (productId = '') => {
    try {
      const url = productId 
        ? `${API_URL}/api/inventory/logs?product_id=${productId}&limit=50`
        : `${API_URL}/api/inventory/logs?limit=50`;
      const response = await axios.get(url);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const openModal = (type, product) => {
    setModalType(type);
    setSelectedProduct(product);
    setQuantity('');
    setNotes('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    setLoading(true);
    try {
      const endpoint = modalType === 'receive' 
        ? '/api/inventory/receive'
        : '/api/inventory/adjust';
      
      await axios.post(`${API_URL}${endpoint}`, null, {
        params: {
          product_id: selectedProduct.id,
          quantity: parseFloat(quantity),
          notes
        }
      });

      showNotification(`Stock ${modalType === 'receive' ? 'received' : 'adjusted'} successfully!`, 'success');
      setShowModal(false);
      fetchProducts();
      fetchAlerts();
      fetchLogs();
    } catch (error) {
      console.error('Error updating inventory:', error);
      showNotification('Failed to update inventory!', 'error');
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => 
    p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (product) => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (product.stock <= product.reorder_level) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'In Stock', color: 'bg-secondary-100 text-secondary-800' };
  };

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

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedView === 'overview'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('alerts')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedView === 'alerts'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setSelectedView('logs')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedView === 'logs'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Total Products</div>
              <div className="text-3xl font-bold text-primary-600">{products.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Low Stock</div>
              <div className="text-3xl font-bold text-yellow-600">{alerts.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Out of Stock</div>
              <div className="text-3xl font-bold text-red-600">
                {products.filter(p => p.stock === 0).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Total Stock Value</div>
              <div className="text-3xl font-bold text-secondary-600">
                {products.reduce((sum, p) => sum + (p.stock * p.price_retail), 0).toFixed(0)}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map(product => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name_en}</div>
                          <div className="text-xs text-gray-500">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold">
                          {product.stock} {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {product.reorder_level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-2">
                          <button
                            onClick={() => openModal('receive', product)}
                            className="text-secondary-600 hover:text-secondary-800 font-medium"
                          >
                            Receive
                          </button>
                          <button
                            onClick={() => openModal('adjust', product)}
                            className="text-accent-600 hover:text-accent-800 font-medium"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => {
                              fetchLogs(product.id);
                              setSelectedView('logs');
                            }}
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Alerts View */}
      {selectedView === 'alerts' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Low Stock Alerts</h3>
            <p className="text-sm text-gray-600 mt-1">Products that need to be reordered</p>
          </div>
          
          {alerts.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">All products have sufficient stock!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Suggested Order</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map(product => (
                    <tr key={product.id} className={product.stock === 0 ? 'bg-red-50' : 'bg-yellow-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name_en}</div>
                        <div className="text-xs text-gray-500">{product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-lg font-bold ${product.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {product.reorder_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-semibold text-secondary-600">
                          {product.suggested_order_qty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          product.stock_status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.stock_status === 'critical' ? 'Critical' : 'Low'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openModal('receive', product)}
                          className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded text-sm"
                        >
                          Receive Stock
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

      {/* Logs View */}
      {selectedView === 'logs' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Inventory Transaction Logs</h3>
            <p className="text-sm text-gray-600 mt-1">Recent inventory movements</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Previous</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">New</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.product_name}</div>
                      <div className="text-xs text-gray-500">{log.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.log_type === 'receive' ? 'bg-secondary-100 text-secondary-800' :
                        log.log_type === 'sale' ? 'bg-red-100 text-red-800' :
                        'bg-accent-100 text-accent-800'
                      }`}>
                        {log.log_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-center font-semibold ${
                      log.quantity > 0 ? 'text-secondary-600' : 'text-red-600'
                    }`}>
                      {log.quantity > 0 ? '+' : ''}{log.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {log.previous_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                      {log.new_stock}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.notes || log.reference || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {modalType === 'receive' ? 'Receive Stock' : 'Adjust Stock'}
            </h2>

            <div className="mb-4 p-4 bg-primary-50 rounded-lg">
              <div className="text-sm text-gray-600">Product</div>
              <div className="text-lg font-semibold text-gray-900">{selectedProduct.name_en}</div>
              <div className="text-sm text-gray-500">{selectedProduct.sku}</div>
              <div className="text-sm text-gray-600 mt-2">Current Stock: <span className="font-bold">{selectedProduct.stock}</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {modalType === 'receive' ? 'Quantity to Receive' : 'New Stock Level'} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-lg"
                  placeholder={modalType === 'receive' ? 'Enter quantity' : 'Enter new stock level'}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Add notes about this transaction..."
                />
              </div>

              {modalType === 'receive' && quantity && (
                <div className="p-3 bg-secondary-50 rounded-lg">
                  <div className="text-sm text-gray-700">
                    New stock will be: <span className="font-bold text-secondary-600">
                      {(parseFloat(selectedProduct.stock) + parseFloat(quantity || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;
