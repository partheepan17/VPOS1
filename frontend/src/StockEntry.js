import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { translations } from './translations';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function StockEntry({ language }) {
  const t = translations[language];
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [grnRecords, setGrnRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  });
  
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: '',
    cost_price: '',
    batch_number: '',
    expiry_date: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchGRNRecords();
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

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchGRNRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/grn`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGrnRecords(response.data.grns || []);
    } catch (error) {
      console.error('Error fetching GRN records:', error);
    }
  };

  const addItemToGRN = () => {
    if (!newItem.product_id || !newItem.quantity || !newItem.cost_price) {
      alert('Please fill in product, quantity, and cost price');
      return;
    }
    
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem }]
    });
    
    setNewItem({
      product_id: '',
      quantity: '',
      cost_price: '',
      batch_number: '',
      expiry_date: ''
    });
  };

  const removeItemFromGRN = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Please add at least one item to the GRN');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/api/grn`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert('Stock entry (GRN) created successfully!');
      setShowForm(false);
      setFormData({
        supplier_id: '',
        received_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
      });
      fetchGRNRecords();
      fetchProducts();
    } catch (error) {
      console.error('Error creating GRN:', error);
      alert('Error creating stock entry: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product[`name_${language}`] || product.name_en : 'Unknown';
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📦 Stock Entry (GRN)</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            {showForm ? 'View Records' : '+ New Stock Entry'}
          </button>
        </div>

        {showForm ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Create Goods Received Note (GRN)</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Supplier *</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Received Date *</label>
                  <input
                    type="date"
                    value={formData.received_date}
                    onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Add Items</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">Product *</label>
                    <select
                      value={newItem.product_id}
                      onChange={(e) => setNewItem({ ...newItem, product_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product[`name_${language}`] || product.name_en} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Cost Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.cost_price}
                      onChange={(e) => setNewItem({ ...newItem, cost_price: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Batch #</label>
                    <input
                      type="text"
                      value={newItem.batch_number}
                      onChange={(e) => setNewItem({ ...newItem, batch_number: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={newItem.expiry_date}
                      onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={addItemToGRN}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Item
                </button>
              </div>

              {formData.items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold mb-4">Items in GRN ({formData.items.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-right">Quantity</th>
                          <th className="px-4 py-2 text-right">Cost Price</th>
                          <th className="px-4 py-2 text-right">Total</th>
                          <th className="px-4 py-2">Batch</th>
                          <th className="px-4 py-2">Expiry</th>
                          <th className="px-4 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{getProductName(item.product_id)}</td>
                            <td className="px-4 py-2 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">{parseFloat(item.cost_price).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-semibold">
                              {(parseFloat(item.quantity) * parseFloat(item.cost_price)).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-center">{item.batch_number || '-'}</td>
                            <td className="px-4 py-2 text-center">{item.expiry_date || '-'}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeItemFromGRN(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan="3" className="px-4 py-2 text-right">Total Cost:</td>
                          <td className="px-4 py-2 text-right">
                            LKR {formData.items.reduce((sum, item) => 
                              sum + (parseFloat(item.quantity) * parseFloat(item.cost_price)), 0
                            ).toFixed(2)}
                          </td>
                          <td colSpan="3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  Create GRN
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
            <h2 className="text-2xl font-bold mb-6">GRN Records</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">GRN Number</th>
                    <th className="px-4 py-2 text-left">Supplier</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Items</th>
                    <th className="px-4 py-2 text-right">Total Cost</th>
                    <th className="px-4 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {grnRecords.map((grn) => (
                    <tr key={grn.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-sm">{grn.grn_number}</td>
                      <td className="px-4 py-2">{getSupplierName(grn.supplier_id)}</td>
                      <td className="px-4 py-2 text-center">
                        {new Date(grn.received_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-center">{grn.items?.length || 0}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        LKR {grn.total_cost?.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{grn.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {grnRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No GRN records found. Create your first stock entry!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockEntry;
