import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Barcode from 'react-barcode';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function LabelPrinting({ language, getText }) {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [barcodeType, setBarcodeType] = useState('EAN13');
  const [labelType, setLabelType] = useState('full');
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState(null);
  const [useThermalPrinter, setUseThermalPrinter] = useState(false);
  const labelRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products?limit=500&active_only=true`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const applyFilters = () => {
    let filtered = products;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name_en.toLowerCase().includes(term) ||
        p.name_si.includes(term) ||
        p.name_ta.includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcodes.some(b => b.includes(term))
      );
    }

    setFilteredProducts(filtered);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handlePrint = () => {
    if (selectedProducts.length === 0) {
      showNotification('Please select at least one product to print labels', 'error');
      return;
    }
    
    if (useThermalPrinter) {
      handleThermalPrint();
    } else {
      window.print();
      showNotification(`Printing ${selectedProducts.length} labels`, 'success');
    }
  };

  const handleThermalPrint = async () => {
    try {
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      
      showNotification('Generating thermal labels...', 'success');
      
      // Generate labels for each product using backend API
      for (const product of selectedProductsData) {
        const barcode = product.barcodes.length > 0 ? product.barcodes[0] : product.sku;
        
        // Open label in new tab for printing
        const response = await axios.post(
          `${API_URL}/api/barcode/generate-label`,
          {
            code: barcode,
            product_name: product.name_en,
            price: product.price_retail,
            format: barcodeType === 'QR' ? 'CODE128' : barcodeType
          },
          { responseType: 'blob' }
        );
        
        // Create blob URL and open in new tab
        const blob = new Blob([response.data], { type: 'image/png' });
        const url = window.URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        
        // Small delay between prints
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      showNotification(`Sent ${selectedProductsData.length} labels to printer`, 'success');
    } catch (error) {
      console.error('Error printing thermal labels:', error);
      showNotification('Failed to generate thermal labels', 'error');
    }
  };

  const handleGeneratePDF = async () => {
    if (selectedProducts.length === 0) {
      showNotification('Please select at least one product to generate PDF', 'error');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      const labelsPerRow = 3;
      const labelsPerColumn = 5;
      const labelWidth = pageWidth / labelsPerRow;
      const labelHeight = pageHeight / labelsPerColumn;

      for (let i = 0; i < selectedProductsData.length; i++) {
        const row = Math.floor(i / labelsPerRow) % labelsPerColumn;
        const col = i % labelsPerRow;
        const pageNum = Math.floor(i / (labelsPerRow * labelsPerColumn));

        if (i > 0 && i % (labelsPerRow * labelsPerColumn) === 0) {
          pdf.addPage();
        }

        const x = col * labelWidth;
        const y = row * labelHeight;

        const labelElement = document.getElementById(`label-${selectedProductsData[i].id}`);
        if (labelElement) {
          const canvas = await html2canvas(labelElement, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', x + 2, y + 2, labelWidth - 4, labelHeight - 4);
        }
      }

      pdf.save('product-labels.pdf');
      showNotification('PDF generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('Failed to generate PDF', 'error');
    }
  };

  const getSelectedProductsData = () => {
    return products.filter(p => selectedProducts.includes(p.id));
  };

  const renderLabel = (product) => {
    const barcode = product.barcodes.length > 0 ? product.barcodes[0] : product.sku;
    
    return (
      <div
        id={`label-${product.id}`}
        className="label-item bg-white border-2 border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center"
        style={{ width: '8cm', minHeight: '5cm', pageBreakInside: 'avoid' }}
      >
        {/* Barcode/QR Code */}
        <div className="mb-2">
          {barcodeType === 'QR' ? (
            <QRCodeCanvas
              value={barcode}
              size={80}
              level="M"
              includeMargin={true}
            />
          ) : (
            <Barcode
              value={barcode}
              format={barcodeType}
              width={1.5}
              height={40}
              fontSize={10}
              displayValue={true}
            />
          )}
        </div>

        {/* Product Details */}
        <div className="text-center w-full">
          {/* Product Names (Sinhala & Tamil) */}
          {product.name_si && (
            <div className="text-sm font-semibold text-gray-800 sinhala-text mb-1">
              {product.name_si}
            </div>
          )}
          {product.name_ta && (
            <div className="text-xs font-medium text-gray-700 tamil-text mb-1">
              {product.name_ta}
            </div>
          )}
          
          {/* English Name */}
          <div className="text-xs text-gray-600 mb-2">
            {product.name_en}
          </div>

          {/* SKU */}
          <div className="text-xs text-gray-500 mb-1">
            SKU: {product.sku}
          </div>

          {/* Price */}
          <div className="text-lg font-bold text-primary-600 mb-2">
            LKR {product.price_retail.toFixed(2)}
          </div>

          {/* Dates */}
          <div className="text-xs text-gray-600 border-t border-gray-200 pt-1">
            {product.packed_date && (
              <div>Packed: {new Date(product.packed_date).toLocaleDateString()}</div>
            )}
            {product.expire_date && (
              <div>Expire: {new Date(product.expire_date).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>
    );
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
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-gray-800">Label Printing</h2>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            disabled={selectedProducts.length === 0}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
          >
            🖨️ Print Labels ({selectedProducts.length})
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={selectedProducts.length === 0}
            className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
          >
            📄 Generate PDF ({selectedProducts.length})
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Label Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Barcode Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Type</label>
            <select
              value={barcodeType}
              onChange={(e) => setBarcodeType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="EAN13">EAN-13</option>
              <option value="EAN8">EAN-8</option>
              <option value="CODE128">Code 128</option>
              <option value="QR">QR Code</option>
            </select>
          </div>

          {/* Label Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Label Type</label>
            <select
              value={labelType}
              onChange={(e) => setLabelType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="full">Full Label (All Details)</option>
              <option value="simple">Simple (Barcode + Price)</option>
              <option value="minimal">Minimal (Barcode Only)</option>
            </select>
          </div>

          {/* Printer Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Printer Type</label>
            <div className="flex items-center h-10 gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={!useThermalPrinter}
                  onChange={() => setUseThermalPrinter(false)}
                  className="mr-2"
                />
                <span className="text-sm">🖨️ Standard</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={useThermalPrinter}
                  onChange={() => setUseThermalPrinter(true)}
                  className="mr-2"
                />
                <span className="text-sm">🔥 Thermal</span>
              </label>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
        
        {useThermalPrinter && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🔥 Thermal Printer Mode:</strong> Labels will be generated as individual images optimized for thermal printers (40mm x 25mm).
            </p>
          </div>
        )}
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Select Products</h3>
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition"
          >
            {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Select</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Barcode</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.name_en}</div>
                    <div className="text-xs text-gray-500">{product.sku}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">
                    {product.barcodes.length > 0 ? product.barcodes[0] : '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    LKR {product.price_retail.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">
                    {product.stock} {product.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Preview - Hidden on screen, visible during print */}
      <div className="print-only">
        <div className="labels-grid">
          {getSelectedProductsData().map(product => (
            <div key={product.id} className="label-wrapper">
              {renderLabel(product)}
            </div>
          ))}
        </div>
      </div>

      {/* CSS for Print */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .labels-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5mm;
            padding: 5mm;
          }
          .label-wrapper {
            page-break-inside: avoid;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
        .sinhala-text {
          font-family: 'Noto Sans Sinhala', sans-serif;
        }
        .tamil-text {
          font-family: 'Noto Sans Tamil', sans-serif;
        }
      `}</style>
    </div>
  );
}

export default LabelPrinting;
