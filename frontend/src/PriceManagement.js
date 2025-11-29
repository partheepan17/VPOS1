import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function PriceManagement({ language, getText }) {
  const [products, setProducts] = useState([]);
  const [editedPrices, setEditedPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRule, setBulkRule] = useState({
    tier: 'wholesale',
    formula: 'retail_minus_percent',
    value: 5
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products?limit=500`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePriceChange = (productId, tier, value) => {
    setEditedPrices(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [tier]: parseFloat(value) || 0
      }
    }));
  };

  const savePrice = async (productId) => {
    if (!editedPrices[productId]) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    setLoading(true);
    try {
      const updatedProduct = {
        ...product,
        ...editedPrices[productId]
      };

      await axios.put(`${API_URL}/api/products/${productId}`, updatedProduct);
      showNotification('Price updated!', 'success');

      // Update local state
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
      
      // Clear edited prices for this product
      setEditedPrices(prev => {
        const newEdited = { ...prev };
        delete newEdited[productId];
        return newEdited;
      });
    } catch (error) {
      console.error('Error updating price:', error);
      showNotification('Failed to update price!', 'error');
    }
    setLoading(false);
  };

  const saveAllPrices = async () => {
    if (Object.keys(editedPrices).length === 0) {
      showNotification('No changes to save!', 'error');
      return;
    }

    setLoading(true);
    let successCount = 0;

    for (const [productId, prices] of Object.entries(editedPrices)) {
      const product = products.find(p => p.id === productId);
      if (!product) continue;

      try {
        const updatedProduct = { ...product, ...prices };
        await axios.put(`${API_URL}/api/products/${productId}`, updatedProduct);
        successCount++;
      } catch (error) {
        console.error('Error updating price for product:', productId, error);
      }
    }

    showNotification(`Updated ${successCount} products!`, 'success');
    setEditedPrices({});
    fetchProducts();
    setLoading(false);
  };

  const applyBulkRule = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/prices/bulk-update`, bulkRule);
      showNotification(response.data.message, 'success');
      setShowBulkModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error applying bulk rule:', error);
      showNotification('Failed to apply bulk rule!', 'error');
    }
    setLoading(false);
  };

  const getDisplayPrice = (product, tier) => {
    const priceField = `price_${tier}`;
    if (editedPrices[product.id]?.[priceField] !== undefined) {
      return editedPrices[product.id][priceField];
    }
    return product[priceField] || 0;
  };

  const hasChanges = (productId) => {
    return editedPrices[productId] !== undefined;
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
        <h2 className="text-2xl font-bold text-gray-800">Price Management Grid</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition"
            data-testid="bulk-update-btn"
          >
            Bulk Update
          </button>
          {Object.keys(editedPrices).length > 0 && (
            <button
              onClick={saveAllPrices}
              disabled={loading}
              className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
              data-testid="save-all-btn"
            >
              {loading ? 'Saving...' : `Save All (${Object.keys(editedPrices).length})`}
            </button>
          )}
        </div>
      </div>

      {/* Price Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Product
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Retail
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-primary-50">
                    Wholesale
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Credit
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-primary-50">
                    Other
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${hasChanges(product.id) ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit">
                      <div>
                        <div className="font-semibold">{product.name_en}</div>
                        <div className="text-xs text-gray-500">{product.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={getDisplayPrice(product, 'retail')}
                        onChange={(e) => handlePriceChange(product.id, 'price_retail', e.target.value)}
                        className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                        data-testid={`price-retail-${product.sku}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center bg-primary-50">
                      <input
                        type="number"
                        step="0.01"
                        value={getDisplayPrice(product, 'wholesale')}
                        onChange={(e) => handlePriceChange(product.id, 'price_wholesale', e.target.value)}
                        className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                        data-testid={`price-wholesale-${product.sku}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={getDisplayPrice(product, 'credit')}
                        onChange={(e) => handlePriceChange(product.id, 'price_credit', e.target.value)}
                        className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                        data-testid={`price-credit-${product.sku}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center bg-primary-50">
                      <input
                        type="number"
                        step="0.01"
                        value={getDisplayPrice(product, 'other')}
                        onChange={(e) => handlePriceChange(product.id, 'price_other', e.target.value)}
                        className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                        data-testid={`price-other-${product.sku}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {hasChanges(product.id) && (
                        <button
                          onClick={() => savePrice(product.id)}
                          className="px-3 py-1 bg-secondary-500 hover:bg-secondary-600 text-white rounded text-xs"
                        >
                          Save
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Bulk Price Update</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Tier</label>
                <select
                  value={bulkRule.tier}
                  onChange={(e) => setBulkRule(prev => ({ ...prev, tier: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="wholesale">Wholesale</option>
                  <option value="credit">Credit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formula</label>
                <select
                  value={bulkRule.formula}
                  onChange={(e) => setBulkRule(prev => ({ ...prev, formula: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="retail_minus_percent">Retail - Percentage</option>
                  <option value="retail_minus_fixed">Retail - Fixed Amount</option>
                  <option value="retail_multiply">Retail × Multiplier</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value {bulkRule.formula === 'retail_minus_percent' ? '(%)' : 
                         bulkRule.formula === 'retail_minus_fixed' ? '(LKR)' : '(×)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bulkRule.value}
                  onChange={(e) => setBulkRule(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="5"
                />
              </div>

              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Example:</strong><br />
                  {bulkRule.formula === 'retail_minus_percent' && 
                    `Wholesale = Retail - ${bulkRule.value}%`}
                  {bulkRule.formula === 'retail_minus_fixed' && 
                    `Wholesale = Retail - ${bulkRule.value} LKR`}
                  {bulkRule.formula === 'retail_multiply' && 
                    `Wholesale = Retail × ${bulkRule.value}`}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This will update all products. Changes are immediate.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={applyBulkRule}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
              >
                {loading ? 'Applying...' : 'Apply Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriceManagement;
