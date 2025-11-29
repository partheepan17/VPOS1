import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Dashboard({ language, getText }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    recentSales: [],
    todaySales: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, customersRes, lowStockRes, salesRes] = await Promise.all([
        axios.get(`${API_URL}/api/products?limit=1000`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/api/customers?limit=1000`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/api/products/low-stock`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/api/sales?limit=10`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todaySalesData = salesRes.data.sales.filter(sale => 
        sale.created_at.startsWith(today) && sale.status === 'completed'
      );
      
      const todayRevenue = todaySalesData.reduce((sum, sale) => sum + sale.total, 0);

      setStats({
        totalProducts: productsRes.data.total || 0,
        totalCustomers: customersRes.data.total || 0,
        lowStockProducts: lowStockRes.data.products?.length || 0,
        recentSales: salesRes.data.sales.slice(0, 5) || [],
        todaySales: todaySalesData.length,
        todayRevenue: todayRevenue
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Sales</p>
              <p className="text-3xl font-bold text-primary-600">{stats.todaySales}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Invoices: {stats.todaySales}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
              <p className="text-3xl font-bold text-secondary-600">LKR {stats.todayRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Completed sales only</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">In inventory</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
              <p className="text-3xl font-bold text-red-600">{stats.lowStockProducts}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Need reordering</p>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Sales</h3>
        
        {stats.recentSales.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No recent sales</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sale.customer_name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {sale.items.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      LKR {sale.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sale.status === 'completed' ? 'bg-secondary-100 text-secondary-800' :
                        sale.status === 'hold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '#'}
            className="px-4 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-medium transition text-center"
          >
            View Products
          </button>
          <button
            onClick={() => window.location.href = '#'}
            className="px-4 py-3 bg-secondary-50 hover:bg-secondary-100 text-secondary-700 rounded-lg font-medium transition text-center"
          >
            Inventory
          </button>
          <button
            onClick={() => window.location.href = '#'}
            className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition text-center"
          >
            Reports
          </button>
          <button
            onClick={() => window.location.href = '#'}
            className="px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition text-center"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
