import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function StoreCustomization({ language }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('store-info');
  const [logoPreview, setLogoPreview] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/store/settings`);
      setSettings(response.data);
      if (response.data.logo_base64) {
        setLogoPreview(response.data.logo_base64);
      }
    } catch (error) {
      showNotification('Failed to load settings', 'error');
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/store/settings`, settings);
      showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      showNotification('Failed to save settings', 'error');
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Logo file size should be less than 2MB', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/api/store/logo/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLogoPreview(response.data.logo_data);
      setSettings({ ...settings, logo_base64: response.data.logo_data });
      showNotification('Logo uploaded successfully!', 'success');
    } catch (error) {
      showNotification('Failed to upload logo', 'error');
    }
    setLoading(false);
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm('Delete store logo?')) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/store/logo`);
      setLogoPreview(null);
      setSettings({ ...settings, logo_base64: null });
      showNotification('Logo deleted', 'success');
    } catch (error) {
      showNotification('Failed to delete logo', 'error');
    }
    setLoading(false);
  };

  if (!settings) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Store Customization</h1>
        <div className="flex gap-2 flex-wrap">
          {['store-info', 'receipt', 'labels', 'email'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'store-info' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Store Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={settings.store_phone}
                  onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={settings.store_email}
                  onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="text"
                  value={settings.store_website}
                  onChange={(e) => setSettings({ ...settings, store_website: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={settings.store_address}
                  onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                <input
                  type="text"
                  value={settings.tax_id}
                  onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'receipt' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Receipt Customization</h2>
            
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo</label>
              {logoPreview && (
                <div className="mb-3 flex items-center gap-4">
                  <img src={logoPreview} alt="Store Logo" className="h-20 border rounded" />
                  <button
                    onClick={handleDeleteLogo}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete Logo
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.show_logo}
                  onChange={(e) => setSettings({ ...settings, show_logo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show logo on receipt</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.show_store_info}
                  onChange={(e) => setSettings({ ...settings, show_store_info: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show store information</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.show_tax_id}
                  onChange={(e) => setSettings({ ...settings, show_tax_id: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show tax ID on receipt</span>
              </label>
            </div>

            {/* Custom Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Header (optional)</label>
              <input
                type="text"
                value={settings.receipt_header}
                onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="e.g., 'Welcome to our store!'"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Footer</label>
              <textarea
                value={settings.receipt_footer}
                onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="2"
                placeholder="e.g., 'Thank you for your business!'"
              />
            </div>
          </div>
        )}

        {activeTab === 'labels' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Barcode Label Settings</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label Template</label>
                <select
                  value={settings.label_template}
                  onChange={(e) => setSettings({ ...settings, label_template: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="standard">Standard</option>
                  <option value="compact">Compact</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Label Size</label>
                <select
                  value={settings.label_size}
                  onChange={(e) => setSettings({ ...settings, label_size: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="40x25">40x25mm (Small)</option>
                  <option value="50x30">50x30mm (Medium)</option>
                  <option value="60x40">60x40mm (Large)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.show_price_on_label}
                  onChange={(e) => setSettings({ ...settings, show_price_on_label: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show price on label</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.show_barcode_text}
                  onChange={(e) => setSettings({ ...settings, show_barcode_text: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Show barcode number below barcode</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Email configuration allows you to send receipts to customers via email.
                You'll need SMTP credentials from your email provider.
              </p>
            </div>

            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={settings.email_enabled}
                onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="font-medium">Enable Email Receipts</span>
            </label>

            {settings.email_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.smtp_host}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username/Email</label>
                  <input
                    type="text"
                    value={settings.smtp_username}
                    onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter password"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                  <input
                    type="email"
                    value={settings.smtp_from_email}
                    onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="w-full mt-6 px-6 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default StoreCustomization;
