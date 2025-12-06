import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function TemplateManagement({ language, getText }) {
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchTemplates();
    fetchProducts();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showNotification('Failed to fetch templates', 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products?limit=1000`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      showNotification('Please enter a template name', 'error');
      return;
    }
    if (selectedProducts.length === 0) {
      showNotification('Please select at least one product', 'error');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/templates`, {
        name: templateName,
        product_ids: selectedProducts
      });
      showNotification('Template created successfully!', 'success');
      fetchTemplates();
      resetForm();
    } catch (error) {
      console.error('Error creating template:', error);
      showNotification(error.response?.data?.detail || 'Failed to create template', 'error');
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      await axios.put(`${API_URL}/api/templates/${editingTemplate.id}`, {
        name: templateName,
        product_ids: selectedProducts
      });
      showNotification('Template updated successfully!', 'success');
      fetchTemplates();
      resetForm();
    } catch (error) {
      console.error('Error updating template:', error);
      showNotification('Failed to update template', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/templates/${templateId}`);
      showNotification('Template deleted successfully!', 'success');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showNotification('Failed to delete template', 'error');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setSelectedProducts(template.product_ids);
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setTemplateName('');
    setSelectedProducts([]);
    setSearchTerm('');
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return productId;
    if (language === 'si' && product.name_si) return product.name_si;
    if (language === 'ta' && product.name_ta) return product.name_ta;
    return product.name_en;
  };

  const filteredProducts = products.filter(p =>
    p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name_si.includes(searchTerm) ||
    p.name_ta.includes(searchTerm) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">⚡ Quick Sale Templates</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
        >
          ➕ Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <div key={template.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-800">{template.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Products:</strong> {template.product_ids.length}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Used:</strong> {template.usage_count} times
              </div>
              {template.last_used && (
                <div className="text-xs text-gray-500">
                  Last used: {new Date(template.last_used).toLocaleDateString()}
                </div>
              )}
              
              {/* Product List Preview */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Products:</div>
                <div className="flex flex-wrap gap-1">
                  {template.product_ids.slice(0, 5).map(pid => (
                    <span key={pid} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                      {getProductName(pid)}
                    </span>
                  ))}
                  {template.product_ids.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{template.product_ids.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No templates yet</p>
          <p className="text-sm">Create your first quick sale template to speed up checkout!</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Template Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Rice Combo, Breakfast Pack, Weekly Groceries"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Product Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, SKU..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Selected Products Count */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedProducts.length}</strong> products selected
                </p>
              </div>

              {/* Products List */}
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Select</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{product.name_en}</div>
                          <div className="text-xs text-gray-500">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">
                          LKR {product.price_retail.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">
                          {product.stock} {product.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
              >
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateManagement;
