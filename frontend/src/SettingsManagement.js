import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function SettingsManagement({ language, getText }) {
  const [settings, setSettings] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    tax_id: '',
    default_language: 'si',
    default_tier: 'retail',
    currency: 'LKR',
    tax_rate: 0
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backups, setBackups] = useState([]);
  const [backupData, setBackupData] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/backups`);
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/settings`, settings);
      showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Failed to save settings!', 'error');
    }
    setLoading(false);
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/backups/create`);
      setBackupData(response.data.backup);
      
      // Download backup as JSON file
      const blob = new Blob([JSON.stringify(response.data.backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pos_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showNotification('Backup created and downloaded!', 'success');
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      showNotification('Failed to create backup!', 'error');
    }
    setLoading(false);
  };

  const handleRestoreBackup = async (file) => {
    if (!window.confirm('This will replace all current data. Continue?')) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          await axios.post(`${API_URL}/api/backups/restore`, backupData);
          showNotification('Backup restored successfully!', 'success');
          window.location.reload(); // Reload to reflect changes
        } catch (error) {
          console.error('Error restoring backup:', error);
          showNotification('Failed to restore backup!', 'error');
        }
        setLoading(false);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading backup file:', error);
      showNotification('Failed to read backup file!', 'error');
      setLoading(false);
    }
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

      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

      {/* Store Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Store Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
            <input
              type="text"
              value={settings.store_name}
              onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="text"
              value={settings.store_phone}
              onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={settings.store_email}
              onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
            <input
              type="text"
              value={settings.tax_id}
              onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={settings.store_address}
              onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* System Defaults */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">System Defaults</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
            <select
              value={settings.default_language}
              onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="en">English</option>
              <option value="si">සිංහල (Sinhala)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Price Tier</label>
            <select
              value={settings.default_tier}
              onChange={(e) => setSettings({ ...settings, default_tier: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="credit">Credit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.tax_rate}
              onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="px-8 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Backup & Restore</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Create Backup</h4>
            <p className="text-sm text-gray-600 mb-4">
              Download a JSON backup of all your data (products, customers, suppliers, settings)
            </p>
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="w-full px-6 py-3 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
            >
              {loading ? 'Creating...' : 'Create & Download Backup'}
            </button>
          </div>

          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Restore Backup</h4>
            <p className="text-sm text-gray-600 mb-4">
              Upload a backup JSON file to restore your data
            </p>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleRestoreBackup(file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
          </div>
        </div>

        {/* Backup History */}
        {backups.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-gray-800 mb-3">Recent Backups</h4>
            <div className="space-y-2">
              {backups.slice(0, 5).map(backup => (
                <div key={backup.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(backup.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {backup.products_count} products • {backup.customers_count} customers • {backup.suppliers_count} suppliers
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    backup.type === 'manual' ? 'bg-accent-100 text-accent-800' : 'bg-secondary-100 text-secondary-800'
                  }`}>
                    {backup.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Open Payment</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">F2</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Clear Cart</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">F3</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Focus Barcode Input</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">F4</kbd>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Hold Bill</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">F5</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Show Held Bills</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">F6</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsManagement;
