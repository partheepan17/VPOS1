import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function FeatureManagement({ language }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeCategory, setActiveCategory] = useState('inventory');

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/system/settings`);
      setSettings(response.data);
    } catch (error) {
      showNotification('Failed to load settings', 'error');
    }
  };

  const handleToggle = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await axios.post(`${API_URL}/api/system/settings`, newSettings);
      showNotification('Setting updated successfully', 'success');
    } catch (error) {
      showNotification('Failed to update setting', 'error');
      fetchSettings(); // Revert on error
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Reset all settings to default values? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/system/settings/reset`);
      setSettings(response.data.settings);
      showNotification('Settings reset to defaults', 'success');
    } catch (error) {
      showNotification('Failed to reset settings', 'error');
    }
    setLoading(false);
  };

  if (!settings) {
    return <div className="p-8">Loading...</div>;
  }

  const categories = {
    inventory: {
      icon: '📦',
      label: 'Inventory Management',
      settings: [
        {
          key: 'allow_negative_stock',
          label: 'Allow Negative Stock',
          description: 'Allow sales even when product stock is 0 or negative. Useful for pre-orders or made-to-order items.',
          type: 'boolean',
          danger: false
        },
        {
          key: 'show_low_stock_alerts',
          label: 'Low Stock Alerts',
          description: 'Show alerts on dashboard when products are below reorder level.',
          type: 'boolean'
        },
        {
          key: 'auto_deduct_inventory',
          label: 'Auto-Deduct Inventory',
          description: 'Automatically reduce stock when sales are completed.',
          type: 'boolean'
        },
        {
          key: 'track_batch_expiry',
          label: 'Track Batch & Expiry',
          description: 'Enable batch number and expiry date tracking for products.',
          type: 'boolean'
        }
      ]
    },
    sales: {
      icon: '💰',
      label: 'Sales & Checkout',
      settings: [
        {
          key: 'require_customer_selection',
          label: 'Require Customer Selection',
          description: 'Force selection of a customer before completing sale.',
          type: 'boolean'
        },
        {
          key: 'allow_hold_bills',
          label: 'Allow Hold Bills',
          description: 'Enable ability to hold bills and resume later.',
          type: 'boolean'
        },
        {
          key: 'enable_split_payment',
          label: 'Enable Split Payment',
          description: 'Allow customers to pay using multiple payment methods.',
          type: 'boolean'
        },
        {
          key: 'auto_print_receipt',
          label: 'Auto-Print Receipt',
          description: 'Automatically print receipt after payment completion.',
          type: 'boolean'
        },
        {
          key: 'show_product_images',
          label: 'Show Product Images',
          description: 'Display product images in POS (requires image URLs).',
          type: 'boolean'
        }
      ]
    },
    loyalty: {
      icon: '🎁',
      label: 'Loyalty Program',
      settings: [
        {
          key: 'loyalty_enabled',
          label: 'Enable Loyalty Program',
          description: 'Turn on/off the entire loyalty points system.',
          type: 'boolean'
        },
        {
          key: 'auto_apply_loyalty_points',
          label: 'Auto-Apply Points',
          description: 'Automatically award points after each sale.',
          type: 'boolean'
        },
        {
          key: 'loyalty_visible_in_pos',
          label: 'Show in POS',
          description: 'Display loyalty points in checkout screen.',
          type: 'boolean'
        }
      ]
    },
    discounts: {
      icon: '🏷️',
      label: 'Discounts',
      settings: [
        {
          key: 'auto_apply_discounts',
          label: 'Auto-Apply Discount Rules',
          description: 'Automatically apply discount rules based on product/quantity.',
          type: 'boolean'
        },
        {
          key: 'allow_manual_discount',
          label: 'Allow Manual Discounts',
          description: 'Cashiers can manually add discounts to items.',
          type: 'boolean'
        },
        {
          key: 'require_manager_approval_discount',
          label: 'Require Manager Approval',
          description: 'Manual discounts require manager authentication.',
          type: 'boolean'
        }
      ]
    },
    barcode: {
      icon: '⌨️',
      label: 'Barcode & Input',
      settings: [
        {
          key: 'barcode_auto_submit',
          label: 'Barcode Auto-Submit',
          description: 'Automatically add product after barcode is entered (no Enter key needed).',
          type: 'boolean'
        },
        {
          key: 'focus_barcode_on_load',
          label: 'Auto-Focus Barcode Input',
          description: 'Automatically focus barcode input when POS loads.',
          type: 'boolean'
        }
      ]
    },
    printing: {
      icon: '🖨️',
      label: 'Printing',
      settings: [
        {
          key: 'auto_print_on_payment',
          label: 'Auto-Print on Payment',
          description: 'Automatically print invoice immediately after payment.',
          type: 'boolean'
        },
        {
          key: 'print_customer_copy',
          label: 'Print Customer Copy',
          description: 'Print customer copy of receipt.',
          type: 'boolean'
        },
        {
          key: 'print_store_copy',
          label: 'Print Store Copy',
          description: 'Print additional store copy for records.',
          type: 'boolean'
        }
      ]
    },
    notifications: {
      icon: '🔔',
      label: 'Notifications',
      settings: [
        {
          key: 'sound_on_scan',
          label: 'Sound on Barcode Scan',
          description: 'Play sound when barcode is scanned.',
          type: 'boolean'
        },
        {
          key: 'sound_on_payment',
          label: 'Sound on Payment',
          description: 'Play sound when payment is successful.',
          type: 'boolean'
        },
        {
          key: 'show_success_animations',
          label: 'Success Animations',
          description: 'Show animations for successful actions.',
          type: 'boolean'
        }
      ]
    },
    email: {
      icon: '📧',
      label: 'Email',
      settings: [
        {
          key: 'email_receipts_enabled',
          label: 'Enable Email Receipts',
          description: 'Allow sending receipts via email (requires SMTP configuration).',
          type: 'boolean'
        },
        {
          key: 'auto_email_on_request',
          label: 'Auto-Email on Request',
          description: 'Automatically email receipt when customer provides email.',
          type: 'boolean'
        }
      ]
    },
    advanced: {
      icon: '⚙️',
      label: 'Advanced',
      settings: [
        {
          key: 'cache_products',
          label: 'Cache Products',
          description: 'Cache product data for faster loading.',
          type: 'boolean'
        },
        {
          key: 'enable_audit_log',
          label: 'Enable Audit Log',
          description: 'Log all user actions for security and compliance.',
          type: 'boolean'
        },
        {
          key: 'debug_mode',
          label: 'Debug Mode',
          description: 'Enable debug logging (for development only).',
          type: 'boolean',
          danger: true
        }
      ]
    }
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Feature Management</h1>
          <p className="text-gray-600 mt-1">Control system features and behavior</p>
        </div>
        <button
          onClick={handleResetToDefaults}
          disabled={loading}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Category Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Categories</h3>
            <div className="space-y-1">
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    activeCategory === key
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="col-span-9">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <span className="text-4xl">{categories[activeCategory].icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {categories[activeCategory].label}
                </h2>
                <p className="text-sm text-gray-500">
                  {categories[activeCategory].settings.length} settings available
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {categories[activeCategory].settings.map((setting) => (
                <div
                  key={setting.key}
                  className={`p-4 border rounded-lg transition ${
                    setting.danger ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{setting.label}</h3>
                        {setting.danger && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            ⚠️ Caution
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    
                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[setting.key] || false}
                          onChange={(e) => handleToggle(setting.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  {settings[setting.key] && (
                    <div className="mt-2 px-3 py-2 bg-green-100 text-green-800 text-xs rounded">
                      ✅ Enabled
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureManagement;
