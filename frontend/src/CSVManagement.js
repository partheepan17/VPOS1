import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function CSVManagement({ language, getText }) {
  const [selectedType, setSelectedType] = useState('products');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setValidationResult(null);
    } else {
      showNotification('Please select a valid CSV file!', 'error');
    }
  };

  const handleExport = async (type) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/export/${type}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showNotification(`${type} exported successfully!`, 'success');
    } catch (error) {
      console.error('Error exporting:', error);
      showNotification(`Failed to export ${type}!`, 'error');
    }
    setLoading(false);
  };

  const handleValidate = async () => {
    if (!file) {
      showNotification('Please select a file first!', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/import/${selectedType}/validate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setValidationResult(response.data);
      if (response.data.valid) {
        showNotification('Validation passed! Ready to import.', 'success');
      } else {
        showNotification('Validation failed! Check errors below.', 'error');
      }
    } catch (error) {
      console.error('Error validating:', error);
      showNotification('Failed to validate file!', 'error');
      setValidationResult(null);
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!file) {
      showNotification('Please select a file first!', 'error');
      return;
    }

    if (validationResult && !validationResult.valid) {
      showNotification('Please fix validation errors first!', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to import ${selectedType}? This may update existing data.`)) {
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/import/${selectedType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showNotification(response.data.message, 'success');
      setFile(null);
      setValidationResult(null);
    } catch (error) {
      console.error('Error importing:', error);
      const errorMsg = error.response?.data?.detail?.errors?.[0] || 'Import failed!';
      showNotification(errorMsg, 'error');
    }
    setLoading(false);
  };

  const dataTypes = [
    { value: 'products', label: 'Products', icon: '📦' },
    { value: 'customers', label: 'Customers', icon: '👥' },
    { value: 'suppliers', label: 'Suppliers', icon: '🏭' },
    { value: 'discount-rules', label: 'Discount Rules', icon: '💰' },
    { value: 'sales', label: 'Sales', icon: '📊', exportOnly: true }
  ];

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

      <h2 className="text-2xl font-bold text-gray-800">CSV Import/Export</h2>

      {/* Data Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataTypes.map(type => (
          <div
            key={type.value}
            className={`p-6 rounded-lg border-2 cursor-pointer transition ${
              selectedType === type.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-primary-300'
            }`}
            onClick={() => setSelectedType(type.value)}
            data-testid={`csv-type-${type.value}`}
          >
            <div className="text-3xl mb-2">{type.icon}</div>
            <div className="font-semibold text-gray-800">{type.label}</div>
            {type.exportOnly && (
              <span className="text-xs text-gray-500">(Export only)</span>
            )}
          </div>
        ))}
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📤 Export</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download current {selectedType} data as CSV file
        </p>
        <button
          onClick={() => handleExport(selectedType)}
          disabled={loading}
          className="px-6 py-3 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
          data-testid="export-btn"
        >
          {loading ? 'Exporting...' : `Export ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`}
        </button>
      </div>

      {/* Import Section */}
      {!dataTypes.find(t => t.value === selectedType)?.exportOnly && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📥 Import</h3>
          
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                data-testid="csv-file-input"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleValidate}
                disabled={!file || loading}
                className="px-6 py-3 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                data-testid="validate-btn"
              >
                {loading ? 'Validating...' : 'Validate'}
              </button>
              <button
                onClick={handleImport}
                disabled={!file || loading || (validationResult && !validationResult.valid)}
                className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                data-testid="import-btn"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className={`p-4 rounded-lg ${
                validationResult.valid ? 'bg-secondary-50 border border-secondary-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {validationResult.valid ? (
                    <span className="text-secondary-600 font-semibold">✓ Validation Passed</span>
                  ) : (
                    <span className="text-red-600 font-semibold">✗ Validation Failed</span>
                  )}
                </div>
                
                <div className="text-sm text-gray-700 mb-2">
                  <p>Total rows: {validationResult.total_count}</p>
                  <p>Valid rows: {validationResult.valid_count}</p>
                  {!validationResult.valid && (
                    <p className="text-red-600">Errors: {validationResult.errors?.length || 0}</p>
                  )}
                </div>

                {/* Error List */}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-sm text-red-700 mb-2">Errors:</p>
                    <ul className="list-disc list-inside text-xs text-red-600 max-h-40 overflow-y-auto">
                      {validationResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <li>... and {validationResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Preview */}
                {validationResult.preview && validationResult.preview.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-sm text-gray-700 mb-2">Preview (first 5 rows):</p>
                    <div className="overflow-x-auto max-h-40">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            {Object.keys(validationResult.preview[0]).slice(0, 5).map(key => (
                              <th key={key} className="px-2 py-1 text-left">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {validationResult.preview.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-t">
                              {Object.values(row).slice(0, 5).map((value, i) => (
                                <td key={i} className="px-2 py-1">{String(value).substring(0, 20)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-800 mb-2">CSV Format Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {selectedType === 'products' && (
                  <>
                    <li>• Required: sku, name_en, price_retail</li>
                    <li>• Optional: name_si, name_ta, barcodes (comma-separated), category, price_wholesale, price_credit, price_other</li>
                    <li>• Existing products (matched by SKU) will be updated</li>
                  </>
                )}
                {selectedType === 'customers' && (
                  <>
                    <li>• Required: name</li>
                    <li>• Optional: phone, email, category (retail/wholesale/credit/other), default_tier</li>
                  </>
                )}
                {selectedType === 'suppliers' && (
                  <>
                    <li>• Required: name</li>
                    <li>• Optional: phone, email, address, tax_id, notes</li>
                  </>
                )}
                {selectedType === 'discount-rules' && (
                  <>
                    <li>• Required: name, rule_type, discount_type, discount_value</li>
                    <li>• rule_type: line_item, product, category, group</li>
                    <li>• discount_type: percent, fixed</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CSVManagement;
