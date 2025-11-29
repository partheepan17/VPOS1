import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const COLORS = ['#008080', '#00CED1', '#20B2AA', '#48D1CC', '#40E0D0', '#7FFFD4'];

function AdvancedReports({ language, getText }) {
  const [loading, setLoading] = useState(false);
  const [salesTrends, setSalesTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [profitAnalysis, setProfitAnalysis] = useState(null);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchAllReports();
  }, [selectedPeriod, selectedDays]);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const [trends, products, cashiers, profit, customers] = await Promise.all([
        axios.get(`${API_URL}/api/reports/sales-trends?period=${selectedPeriod}&days=${selectedDays}`),
        axios.get(`${API_URL}/api/reports/top-products?limit=10&days=${selectedDays}`),
        axios.get(`${API_URL}/api/reports/sales-by-cashier?days=${selectedDays}`),
        axios.get(`${API_URL}/api/reports/profit-analysis?days=${selectedDays}`),
        axios.get(`${API_URL}/api/reports/customer-insights?days=${selectedDays}`)
      ]);

      setSalesTrends(trends.data.trends || []);
      setTopProducts(products.data.products || []);
      setCashierPerformance(cashiers.data.cashiers || []);
      setProfitAnalysis(profit.data);
      setCustomerInsights(customers.data.customers || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && salesTrends.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading advanced reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Advanced Reports & Analytics</h2>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button
            onClick={fetchAllReports}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Profit Summary Cards */}
      {profitAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-primary-600">
              LKR {profitAnalysis.total_revenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
            <p className="text-3xl font-bold text-orange-600">
              LKR {profitAnalysis.estimated_cost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Estimated Profit</p>
            <p className="text-3xl font-bold text-secondary-600">
              LKR {profitAnalysis.estimated_profit.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
            <p className="text-3xl font-bold text-blue-600">
              {profitAnalysis.profit_margin.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Sales Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#008080" strokeWidth={2} name="Revenue (LKR)" />
            <Line type="monotone" dataKey="count" stroke="#00CED1" strokeWidth={2} name="Sales Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products & Cashier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 10 Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#008080" name="Revenue (LKR)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Cashier Performance</h3>
          {cashierPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cashierPerformance}
                  dataKey="revenue"
                  nameKey="cashier"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.cashier}: LKR ${entry.revenue.toFixed(0)}`}
                >
                  {cashierPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No cashier data available
            </div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top Products Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Times Sold</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.slice(0, 10).map((product, index) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {product.quantity_sold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    LKR {product.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {product.times_sold}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top Customers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Purchases</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Purchase</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerInsights.slice(0, 10).map((customer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {customer.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {customer.purchase_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    LKR {customer.total_spent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                    LKR {customer.avg_purchase.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdvancedReports;
