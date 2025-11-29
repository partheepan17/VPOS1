import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function ReportsManagement({ language, getText }) {
  const [selectedReport, setSelectedReport] = useState('summary');
  const [dateRange, setDateRange] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Report data
  const [salesSummary, setSalesSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [discountUsage, setDiscountUsage] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [customerStats, setCustomerStats] = useState([]);

  useEffect(() => {
    loadReport();
  }, [selectedReport, dateRange, startDate, endDate]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case 'custom':
        return { start: startDate, end: endDate };
      default:
        start.setDate(start.getDate() - 7);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const loadReport = async () => {
    setLoading(true);
    const range = getDateRange();
    
    try {
      switch (selectedReport) {
        case 'summary':
          const summaryRes = await axios.get(`${API_URL}/api/reports/sales-summary`, {
            params: { start_date: range.start, end_date: range.end }
          });
          setSalesSummary(summaryRes.data);
          break;
          
        case 'products':
          const productsRes = await axios.get(`${API_URL}/api/reports/top-products`, {
            params: { start_date: range.start, end_date: range.end, limit: 20 }
          });
          setTopProducts(productsRes.data.products || []);
          break;
          
        case 'categories':
          const categoriesRes = await axios.get(`${API_URL}/api/reports/top-categories`, {
            params: { start_date: range.start, end_date: range.end }
          });
          setTopCategories(categoriesRes.data.categories || []);
          break;
          
        case 'discounts':
          const discountsRes = await axios.get(`${API_URL}/api/reports/discount-usage`, {
            params: { start_date: range.start, end_date: range.end }
          });
          setDiscountUsage(discountsRes.data);
          break;
          
        case 'daily':
          const dailyRes = await axios.get(`${API_URL}/api/reports/daily-sales`, {
            params: { days: dateRange === '30days' ? 30 : 7 }
          });
          setDailySales(dailyRes.data.daily_sales || []);
          break;
          
        case 'customers':
          const customersRes = await axios.get(`${API_URL}/api/reports/customer-stats`, {
            params: { start_date: range.start, end_date: range.end }
          });
          setCustomerStats(customersRes.data.customers || []);
          break;
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }
    
    setLoading(false);
  };

  const exportReport = async () => {
    try {
      const range = getDateRange();
      const response = await axios.get(`${API_URL}/api/export/sales`, {
        params: { start_date: range.start, end_date: range.end },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${range.start}_to_${range.end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const SimpleBarChart = ({ data, labelKey, valueKey, title }) => {
    const maxValue = Math.max(...data.map(d => d[valueKey] || 0));
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-700 text-sm">{title}</h4>
        {data.map((item, index) => {
          const percentage = (item[valueKey] / maxValue) * 100;
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{item[labelKey]}</span>
                <span className="font-semibold text-gray-900">
                  {typeof item[valueKey] === 'number' ? item[valueKey].toFixed(2) : item[valueKey]}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        
        <div className="flex gap-3 flex-wrap">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </>
          )}
          
          <button
            onClick={exportReport}
            className="px-6 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'summary', label: 'Sales Summary', icon: '📊' },
            { key: 'products', label: 'Top Products', icon: '🏆' },
            { key: 'categories', label: 'Top Categories', icon: '📦' },
            { key: 'discounts', label: 'Discount Usage', icon: '💰' },
            { key: 'daily', label: 'Daily Trend', icon: '📈' },
            { key: 'customers', label: 'Customers', icon: '👥' }
          ].map(report => (
            <button
              key={report.key}
              onClick={() => setSelectedReport(report.key)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedReport === report.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {report.icon} {report.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      )}

      {/* Sales Summary Report */}
      {!loading && selectedReport === 'summary' && salesSummary && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Total Sales</div>
              <div className="text-3xl font-bold text-primary-600">
                LKR {salesSummary.total_sales.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Total Invoices</div>
              <div className="text-3xl font-bold text-secondary-600">
                {salesSummary.total_invoices}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Average Sale</div>
              <div className="text-3xl font-bold text-accent-600">
                LKR {salesSummary.average_sale.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Total Discounts</div>
              <div className="text-3xl font-bold text-red-600">
                LKR {salesSummary.total_discount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Sales by Tier */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Price Tier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(salesSummary.tier_summary).map(([tier, data]) => (
                <div key={tier} className="p-4 bg-primary-50 rounded-lg">
                  <div className="text-sm text-gray-600 capitalize">{tier}</div>
                  <div className="text-2xl font-bold text-primary-700 mt-1">
                    LKR {data.total.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {data.count} invoices
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Products Report */}
      {!loading && selectedReport === 'products' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-gray-800">Top 20 Selling Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-orange-600' :
                        'text-gray-500'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-secondary-600">
                      {product.quantity_sold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-primary-600">
                      LKR {product.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Categories Report */}
      {!loading && selectedReport === 'categories' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Category Performance</h3>
          <SimpleBarChart 
            data={topCategories.slice(0, 10)}
            labelKey="category"
            valueKey="revenue"
            title="Revenue by Category"
          />
        </div>
      )}

      {/* Discount Usage Report */}
      {!loading && selectedReport === 'discounts' && discountUsage && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Total Discounts Given</div>
              <div className="text-3xl font-bold text-red-600">
                LKR {discountUsage.total_discount.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Invoices with Discount</div>
              <div className="text-3xl font-bold text-accent-600">
                {discountUsage.invoices_with_discount}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">Discount Rate</div>
              <div className="text-3xl font-bold text-primary-600">
                {discountUsage.discount_percentage.toFixed(1)}%
              </div>
            </div>
          </div>

          {discountUsage.rule_usage && discountUsage.rule_usage.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Discount Rules Usage</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule Name</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Times Applied</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Discount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {discountUsage.rule_usage.map((rule, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rule.rule_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-accent-600">
                          {rule.times_applied}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-red-600">
                          LKR {rule.total_discount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Sales Trend */}
      {!loading && selectedReport === 'daily' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Daily Sales Trend</h3>
          <div className="space-y-4">
            {dailySales.map(day => {
              const maxRevenue = Math.max(...dailySales.map(d => d.revenue));
              const percentage = (day.revenue / maxRevenue) * 100;
              
              return (
                <div key={day.date} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-700">{day.date}</div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">Invoices: <span className="font-semibold">{day.invoices}</span></span>
                      <span className="text-gray-600">Items: <span className="font-semibold">{day.items_sold}</span></span>
                      <span className="text-primary-600 font-bold">LKR {day.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Stats */}
      {!loading && selectedReport === 'customers' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-gray-800">Top Customers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Purchases</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Purchase</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerStats.slice(0, 20).map((customer, index) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-accent-600">
                      {customer.total_purchases}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-primary-600">
                      LKR {customer.total_spent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-secondary-600">
                      LKR {customer.avg_purchase.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsManagement;
