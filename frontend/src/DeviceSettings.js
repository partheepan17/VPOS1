import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function DeviceSettings({ language, getText }) {
  const [deviceConfig, setDeviceConfig] = useState({
    // Printer Settings
    printer_type: 'standard', // standard, thermal, both
    thermal_printer_ip: '',
    thermal_printer_port: '9100',
    thermal_printer_name: '',
    standard_printer_name: '',
    auto_print_receipt: false,
    print_copies: 1,
    
    // Barcode Scanner Settings
    barcode_scanner_type: 'usb', // usb, bluetooth, integrated
    barcode_prefix: '',
    barcode_suffix: 'Enter',
    auto_add_to_cart: true,
    beep_on_scan: true,
    
    // Cash Drawer Settings
    cash_drawer_enabled: false,
    cash_drawer_kick_code: '\x1B\x70\x00',
    
    // Display Settings
    customer_display_enabled: false,
    customer_display_port: 'COM2',
    
    // Keyboard Shortcuts
    shortcut_new_sale: 'F1',
    shortcut_complete_sale: 'F2',
    shortcut_hold_bill: 'F5',
    shortcut_search_product: 'F3',
    shortcut_print_invoice: 'Ctrl+P',
    shortcut_new_customer: 'Ctrl+N',
    shortcut_barcode_focus: 'F4'
  });
  
  const [testResults, setTestResults] = useState({});
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDeviceSettings();
  }, []);

  const fetchDeviceSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/settings/devices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data) {
        setDeviceConfig({ ...deviceConfig, ...response.data });
      }
    } catch (error) {
      console.error('Error fetching device settings:', error);
    }
  };

  const saveDeviceSettings = async () => {
    try {
      await axios.post(`${API_URL}/api/settings/devices`, deviceConfig, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showNotification('Device settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving device settings:', error);
      showNotification('Failed to save device settings', 'error');
    }
  };

  const testPrinter = async (type) => {
    setTestResults({ ...testResults, [type]: 'testing' });
    try {
      await axios.post(`${API_URL}/api/devices/test-printer`, 
        { printer_type: type, config: deviceConfig },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setTestResults({ ...testResults, [type]: 'success' });
      showNotification(`${type} printer test successful!`, 'success');
    } catch (error) {
      setTestResults({ ...testResults, [type]: 'failed' });
      showNotification(`${type} printer test failed`, 'error');
    }
  };

  const testBarcodeScanner = () => {
    showNotification('Scan a barcode to test...', 'info');
    // The actual test happens when user scans something
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🖨️ Device & Hardware Settings</h1>

        {notification && (
          <div className={`mb-4 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' :
            notification.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Printer Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🖨️ Printer Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Printer Type</label>
                <select
                  value={deviceConfig.printer_type}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, printer_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard Printer (Letter/A4)</option>
                  <option value="thermal">Thermal Receipt Printer (ESC/POS)</option>
                  <option value="both">Both (Standard + Thermal)</option>
                </select>
              </div>

              {(deviceConfig.printer_type === 'thermal' || deviceConfig.printer_type === 'both') && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Thermal Printer Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Printer Name/Model</label>
                        <input
                          type="text"
                          value={deviceConfig.thermal_printer_name}
                          onChange={(e) => setDeviceConfig({ ...deviceConfig, thermal_printer_name: e.target.value })}
                          placeholder="e.g., Epson TM-T20, Star TSP143"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm mb-1">IP Address</label>
                          <input
                            type="text"
                            value={deviceConfig.thermal_printer_ip}
                            onChange={(e) => setDeviceConfig({ ...deviceConfig, thermal_printer_ip: e.target.value })}
                            placeholder="192.168.1.100"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Port</label>
                          <input
                            type="text"
                            value={deviceConfig.thermal_printer_port}
                            onChange={(e) => setDeviceConfig({ ...deviceConfig, thermal_printer_port: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => testPrinter('thermal')}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {testResults.thermal === 'testing' ? 'Testing...' : 'Test Thermal Printer'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {(deviceConfig.printer_type === 'standard' || deviceConfig.printer_type === 'both') && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Standard Printer Settings</h3>
                  <div>
                    <label className="block text-sm mb-1">Printer Name</label>
                    <input
                      type="text"
                      value={deviceConfig.standard_printer_name}
                      onChange={(e) => setDeviceConfig({ ...deviceConfig, standard_printer_name: e.target.value })}
                      placeholder="System default printer"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => testPrinter('standard')}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {testResults.standard === 'testing' ? 'Testing...' : 'Test Standard Printer'}
                  </button>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Print Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={deviceConfig.auto_print_receipt}
                      onChange={(e) => setDeviceConfig({ ...deviceConfig, auto_print_receipt: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Auto-print receipt after sale</span>
                  </label>
                  <div>
                    <label className="block text-sm mb-1">Number of Copies</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={deviceConfig.print_copies}
                      onChange={(e) => setDeviceConfig({ ...deviceConfig, print_copies: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Scanner Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              📷 Barcode Scanner Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Scanner Type</label>
                <select
                  value={deviceConfig.barcode_scanner_type}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, barcode_scanner_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="usb">USB Barcode Scanner</option>
                  <option value="bluetooth">Bluetooth Scanner</option>
                  <option value="integrated">Integrated/Webcam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Scan Prefix (Optional)</label>
                <input
                  type="text"
                  value={deviceConfig.barcode_prefix}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, barcode_prefix: e.target.value })}
                  placeholder="Characters before barcode"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Scan Suffix</label>
                <select
                  value={deviceConfig.barcode_suffix}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, barcode_suffix: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Enter">Enter</option>
                  <option value="Tab">Tab</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deviceConfig.auto_add_to_cart}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, auto_add_to_cart: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Auto-add scanned items to cart</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deviceConfig.beep_on_scan}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, beep_on_scan: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Beep sound on successful scan</span>
                </label>
              </div>

              <button
                onClick={testBarcodeScanner}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Test Barcode Scanner
              </button>
            </div>

            {/* Cash Drawer */}
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                💰 Cash Drawer
              </h3>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={deviceConfig.cash_drawer_enabled}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, cash_drawer_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Enable automatic cash drawer opening</span>
              </label>
              {deviceConfig.cash_drawer_enabled && (
                <div>
                  <label className="block text-sm mb-1">Kick Code (ESC/POS)</label>
                  <input
                    type="text"
                    value={deviceConfig.cash_drawer_kick_code}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, cash_drawer_kick_code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              ⌨️ Keyboard Shortcuts
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">New Sale</label>
                <input
                  type="text"
                  value={deviceConfig.shortcut_new_sale}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, shortcut_new_sale: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="F1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Complete Sale / Pay</label>
                <input
                  type="text"
                  value={deviceConfig.shortcut_complete_sale}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, shortcut_complete_sale: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="F2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Search Product</label>
                <input
                  type="text"
                  value={deviceConfig.shortcut_search_product}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, shortcut_search_product: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="F3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Focus Barcode Input</label>
                <input
                  type="text"
                  value={deviceConfig.shortcut_barcode_focus}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, shortcut_barcode_focus: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="F4"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Hold Bill</label>
                <input
                  type="text"
                  value={deviceConfig.shortcut_hold_bill}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, shortcut_hold_bill: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="F5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Print Invoice</label>
                <input
                  type="text"
                  value={deviceConfig.shortcut_print_invoice}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, shortcut_print_invoice: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="Ctrl+P"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">New Customer</label>
                <input
                  type="text"
                  value={deviceConfig.shortcut_new_customer}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, shortcut_new_customer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  placeholder="Ctrl+N"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">💡 Keyboard Shortcut Tips:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Use function keys (F1-F12) for quick access</li>
                <li>• Combine with Ctrl, Alt, or Shift for more shortcuts</li>
                <li>• Format: "F1", "Ctrl+P", "Alt+N", "Shift+F5"</li>
                <li>• Changes take effect immediately after saving</li>
              </ul>
            </div>
          </div>

          {/* Customer Display (Optional) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🖥️ Customer Display (Optional)
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deviceConfig.customer_display_enabled}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, customer_display_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold">Enable customer-facing display</span>
              </label>
              
              {deviceConfig.customer_display_enabled && (
                <div>
                  <label className="block text-sm mb-1">Serial Port</label>
                  <input
                    type="text"
                    value={deviceConfig.customer_display_port}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, customer_display_port: e.target.value })}
                    placeholder="COM2 or /dev/ttyUSB0"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                Customer display shows item name, quantity, and price during checkout.
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={saveDeviceSettings}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            💾 Save Device Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceSettings;
