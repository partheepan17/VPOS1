import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function DiscountRules({ language, getText }) {
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    rule_type: 'line_item',
    target_id: '',
    discount_type: 'percent',
    discount_value: 0,
    max_discount: 0,
    min_quantity: 0,
    max_quantity: 0,
    auto_apply: false
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/discount-rules`);
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('Error fetching discount rules:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ruleData = {
        ...formData,
        id: editingRule?.id || undefined,
        active: true,
        created_at: editingRule?.created_at || new Date().toISOString()
      };

      if (editingRule) {
        await axios.put(`${API_URL}/api/discount-rules/${editingRule.id}`, ruleData);
        showNotification('Discount rule updated!', 'success');
      } else {
        await axios.post(`${API_URL}/api/discount-rules`, ruleData);
        showNotification('Discount rule created!', 'success');
      }

      fetchRules();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving discount rule:', error);
      showNotification('Failed to save discount rule!', 'error');
    }
    setLoading(false);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      rule_type: rule.rule_type,
      target_id: rule.target_id || '',
      discount_type: rule.discount_type,
      discount_value: rule.discount_value,
      max_discount: rule.max_discount || 0,
      min_quantity: rule.min_quantity || 0,
      max_quantity: rule.max_quantity || 0,
      auto_apply: rule.auto_apply || false
    });
    setShowModal(true);
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      await axios.delete(`${API_URL}/api/discount-rules/${ruleId}`);
      showNotification('Discount rule deleted!', 'success');
      fetchRules();
    } catch (error) {
      console.error('Error deleting discount rule:', error);
      showNotification('Failed to delete discount rule!', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rule_type: 'line_item',
      target_id: '',
      discount_type: 'percent',
      discount_value: 0,
      max_discount: 0,
      min_quantity: 0,
      max_quantity: 0,
      auto_apply: false
    });
    setEditingRule(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

      {/* Important Notice Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-blue-800">ℹ️ Important: Discount Rules Apply to Retail Tier Only</h3>
            <p className="text-sm text-blue-700 mt-1">
              Automatic discount rules are <strong>only applied</strong> when the <strong>"Retail"</strong> price tier is selected. 
              Wholesale, Credit, and Other tiers have their own pricing and do not receive additional discounts.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Discount Rules</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
          data-testid="add-discount-rule-btn"
        >
          + Add Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">No discount rules yet</p>
            <p className="text-sm">Create your first discount rule to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Cap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto Apply</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rule.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                        {rule.rule_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.discount_value}{rule.discount_type === 'percent' ? '%' : ' LKR'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.max_discount > 0 ? `${rule.max_discount} LKR` : 'No cap'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.min_quantity > 0 || rule.max_quantity > 0 ? (
                        `${rule.min_quantity || 0} - ${rule.max_quantity || '∞'}`
                      ) : 'Any'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {rule.auto_apply ? (
                        <span className="px-2 py-1 bg-secondary-100 text-secondary-800 rounded text-xs">Yes</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingRule ? 'Edit Discount Rule' : 'Add Discount Rule'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="e.g., Sugar Discount - Max 3kg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Type *</label>
                  <select
                    name="rule_type"
                    value={formData.rule_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  >
                    <option value="line_item">Line Item (All Products)</option>
                    <option value="product">Specific Product</option>
                    <option value="category">Category</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                {(formData.rule_type === 'product' || formData.rule_type === 'category') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target {formData.rule_type === 'product' ? 'Product ID' : 'Category'}
                    </label>
                    <input
                      type="text"
                      name="target_id"
                      value={formData.target_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                      placeholder={formData.rule_type === 'category' ? 'e.g., Sugar' : 'Product ID'}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type *</label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (LKR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value *</label>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder={formData.discount_type === 'percent' ? '10' : '100'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Discount Cap (LKR) - Optional
                </label>
                <input
                  type="number"
                  name="max_discount"
                  value={formData.max_discount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Leave 0 for no cap"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum discount amount that can be applied (e.g., 50 LKR max on Sugar)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Quantity</label>
                  <input
                    type="number"
                    name="min_quantity"
                    value={formData.min_quantity}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Quantity</label>
                  <input
                    type="number"
                    name="max_quantity"
                    value={formData.max_quantity}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="0 for unlimited"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="auto_apply"
                  checked={formData.auto_apply}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Auto-apply this rule during checkout
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                >
                  {loading ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscountRules;
