import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { translations } from './translations';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function StockMovements({ language }) {
  const t = translations[language];
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchLowStock();
    fetchExpiringBatches();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/low-stock`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLowStockProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  const fetchExpiringBatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/expiring-soon?days=30`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExpiringBatches(response.data.expiring_batches || []);
    } catch (error) {
      console.error('Error fetching expiring batches:', error);
    }
  };

  const fetchMovements = async (productId) => {
    try {
      const response = await axios.get(`${API_URL}/api/stock-movements/${productId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMovements(response.data.movements || []);
      setSelectedProduct(response.data.product);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const getMovementTypeBadge = (type) => {
    const colors = {
      GRN: 'bg-green-100 text-green-800',
      SALE: 'bg-blue-100 text-blue-800',
      ADJUSTMENT: 'bg-red-100 text-red-800',
      OPENING: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getMovementIcon = (type) => {
    const icons = {
      GRN: '📦',
      SALE: '🛒',
      ADJUSTMENT: '⚠️',
      OPENING: '🔓'
    };
    return icons[type] || '📝';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Stock Movements & Alerts</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🔴 Low Stock Alert ({lowStockProducts.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lowStockProducts.map(product => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer"
                  onClick={() => fetchMovements(product.id)}
                >
                  <div>
                    <p className="font-semibold">{product[`name_${language}`] || product.name_en}</p>
                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{product.stock}</p>
                    <p className="text-xs text-gray-500">Reorder: {product.reorder_level}</p>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-center text-gray-500 py-4">All products have sufficient stock ✓</p>
              )}
            </div>
          </div>

          {/* Expiring Soon Alert */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              ⏰ Expiring Soon ({expiringBatches.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expiringBatches.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{item.product[`name_${language}`] || item.product.name_en}</p>
                      <p className="text-sm text-gray-600">Batch: {item.batch.batch_number || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600">
                        {new Date(item.batch.expiry_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.batch.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
              {expiringBatches.length === 0 && (
                <p className="text-center text-gray-500 py-4">No batches expiring in next 30 days ✓</p>
              )}
            </div>
          </div>
        </div>

        {/* Product Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">View Stock Movement History</h2>
          <select
            onChange={(e) => e.target.value && fetchMovements(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a product to view its movement history...</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product[`name_${language}`] || product.name_en} ({product.sku}) - Stock: {product.stock}
              </option>
            ))}
          </select>
        </div>

        {/* Movement History */}
        {selectedProduct && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {selectedProduct[`name_${language}`] || selectedProduct.name_en}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current Stock</p>
                  <p className="text-2xl font-bold text-green-600">{selectedProduct.stock}</p>
                </div>
                <div>
                  <p className="text-gray-600">Reorder Level</p>
                  <p className="text-2xl font-bold">{selectedProduct.reorder_level}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Cost</p>
                  <p className="text-2xl font-bold">LKR {selectedProduct.weighted_avg_cost?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Purchase</p>
                  <p className="text-2xl font-bold">LKR {selectedProduct.last_purchase_price?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Movement History ({movements.length})</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Date/Time</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Cost</th>
                    <th className="px-4 py-2 text-left">Reason</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        {new Date(movement.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 justify-center ${getMovementTypeBadge(movement.type)}`}>
                          {getMovementIcon(movement.type)} {movement.type}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right font-semibold ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {movement.cost_price?.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm">{movement.reason}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{movement.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {movements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No movement history found for this product.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockMovements;
