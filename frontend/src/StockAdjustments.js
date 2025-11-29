import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { translations } from './translations';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function StockAdjustments({ language, currentUser }) {
  const t = translations[language];
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('ALL');
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    reason: 'DAMAGE',
    batch_number: '',
    notes: ''
  });

  const reasons = [
    { value: 'DAMAGE', label: 'Damaged' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'THEFT', label: 'Theft/Loss' },
    { value: 'INTERNAL_USE', label: 'Internal Use' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchAdjustments();
  }, [filter]);

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

  const fetchAdjustments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stock-adjustments?status=${filter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAdjustments(response.data.adjustments || []);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/stock-adjustments`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const msg = currentUser?.role === 'manager' 
        ? 'Stock adjustment applied successfully!' 
        : 'Adjustment request submitted for manager approval';
      alert(msg);
      
      setShowForm(false);
      setFormData({
        product_id: '',
        quantity: '',
        reason: 'DAMAGE',
        batch_number: '',
        notes: ''
      });
      fetchAdjustments();
      fetchProducts();
    } catch (error) {
      console.error('Error creating adjustment:', error);
      alert('Error creating adjustment: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleApproval = async (adjustmentId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this adjustment?`)) {
      return;
    }
    
    try {
      await axios.put(
        `${API_URL}/api/stock-adjustments/${adjustmentId}/approve?action=${action}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      alert(`Adjustment ${action}d successfully!`);
      fetchAdjustments();
      fetchProducts();
    } catch (error) {
      console.error('Error processing adjustment:', error);
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product[`name_${language}`] || product.name_en : 'Unknown';
  };

  const getProductStock = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.stock : 0;
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getReasonLabel = (reason) => {
    return reasons.find(r => r.value === reason)?.label || reason;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📝 Stock Adjustments</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            {showForm ? 'View Adjustments' : '+ New Adjustment'}
          </button>
        </div>

        {showForm ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Create Stock Adjustment</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Product *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product[`name_${language}`] || product.name_en} ({product.sku}) - Stock: {product.stock}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Quantity to Reduce *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                    required
                  />
                  {formData.product_id && (
                    <p className="text-sm text-gray-600 mt-1">
                      Current stock: {getProductStock(formData.product_id)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Reason *</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    {reasons.map(reason => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Batch Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="If applicable"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="Describe the reason for adjustment..."
                />
              </div>

              {currentUser?.role !== 'manager' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This adjustment will be submitted for manager approval before being applied to inventory.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  {currentUser?.role === 'manager' ? 'Apply Adjustment' : 'Submit for Approval'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Adjustment Requests</h2>
              
              <div className="flex gap-2">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === status
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2">Reason</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Requested</th>
                    <th className="px-4 py-2">Notes</th>
                    {currentUser?.role === 'manager' && <th className="px-4 py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((adj) => (
                    <tr key={adj.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{getProductName(adj.product_id)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-red-600">-{adj.quantity}</td>
                      <td className="px-4 py-2 text-center">{getReasonLabel(adj.reason)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(adj.status)}`}>
                          {adj.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center text-sm">
                        {new Date(adj.requested_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{adj.notes || '-'}</td>
                      {currentUser?.role === 'manager' && (
                        <td className="px-4 py-2 text-center">
                          {adj.status === 'PENDING' && (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleApproval(adj.id, 'approve')}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleApproval(adj.id, 'reject')}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {adjustments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No adjustment requests found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockAdjustments;
