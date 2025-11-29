import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function TerminalManagement({ language, getText }) {
  const [terminals, setTerminals] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentTerminalId] = useState(localStorage.getItem('terminal_id') || 'terminal-main');
  const [currentTerminalName] = useState(localStorage.getItem('terminal_name') || 'Main Terminal');
  const [formData, setFormData] = useState({
    name: '',
    ip_address: ''
  });

  useEffect(() => {
    fetchTerminals();
    fetchSyncStatus();
    
    // Register current terminal if not exists
    registerCurrentTerminal();
    
    // Set up heartbeat interval (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 30000);

    // Set up sync check interval (every 60 seconds)
    const syncInterval = setInterval(() => {
      fetchSyncStatus();
    }, 60000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(syncInterval);
    };
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const registerCurrentTerminal = async () => {
    try {
      // Check if terminal exists
      const response = await axios.get(`${API_URL}/api/terminals`);
      const exists = response.data.terminals.find(t => t.id === currentTerminalId);
      
      if (!exists) {
        // Register this terminal
        await axios.post(`${API_URL}/api/terminals`, {
          id: currentTerminalId,
          name: currentTerminalName,
          ip_address: window.location.hostname,
          status: 'active'
        });
      }
      
      // Send initial heartbeat
      sendHeartbeat();
    } catch (error) {
      console.error('Error registering terminal:', error);
    }
  };

  const sendHeartbeat = async () => {
    try {
      await axios.post(`${API_URL}/api/terminals/${currentTerminalId}/heartbeat`);
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  };

  const fetchTerminals = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/terminals`);
      setTerminals(response.data.terminals || []);
    } catch (error) {
      console.error('Error fetching terminals:', error);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/sync/status`);
      setSyncStatus(response.data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/terminals`, formData);
      showNotification('Terminal registered!', 'success');
      setShowModal(false);
      setFormData({ name: '', ip_address: '' });
      fetchTerminals();
      fetchSyncStatus();
    } catch (error) {
      console.error('Error registering terminal:', error);
      showNotification(error.response?.data?.detail || 'Failed to register terminal!', 'error');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-secondary-100 text-secondary-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '✓';
      case 'warning':
        return '⚠';
      case 'offline':
        return '✗';
      default:
        return '?';
    }
  };

  const getTimeSince = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Multi-Terminal Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition"
        >
          + Register Terminal
        </button>
      </div>

      {/* Current Terminal Info */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg shadow-md p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold mb-1">Current Terminal</h3>
            <p className="text-2xl font-bold">{currentTerminalName}</p>
            <p className="text-sm opacity-90">ID: {currentTerminalId}</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90 mb-1">Status</div>
            <div className="px-4 py-2 bg-white bg-opacity-20 rounded-lg">
              <span className="text-2xl">✓</span>
              <span className="ml-2 font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status Cards */}
      {syncStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Terminals</div>
            <div className="text-3xl font-bold text-primary-600">{syncStatus.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Active Terminals</div>
            <div className="text-3xl font-bold text-secondary-600">{syncStatus.active}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Offline Terminals</div>
            <div className="text-3xl font-bold text-red-600">{syncStatus.offline}</div>
          </div>
        </div>
      )}

      {/* Terminals List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">All Terminals</h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time status of all registered POS terminals
          </p>
        </div>

        {terminals.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">No terminals registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terminal</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Last Sync</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Registered</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {terminals.map(terminal => {
                  const status = syncStatus?.terminals?.find(t => t.id === terminal.id)?.status || terminal.status;
                  const isCurrent = terminal.id === currentTerminalId;
                  
                  return (
                    <tr key={terminal.id} className={isCurrent ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {terminal.name}
                              {isCurrent && (
                                <span className="ml-2 px-2 py-1 bg-primary-500 text-white text-xs rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{terminal.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                          {getStatusIcon(status)} {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {terminal.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {getTimeSince(terminal.last_sync)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {new Date(terminal.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">How Multi-Terminal Sync Works</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <span className="text-primary-600 font-bold mr-3">1.</span>
            <p><strong>Real-time Status:</strong> Each terminal sends heartbeat every 30 seconds to confirm it's online</p>
          </div>
          <div className="flex items-start">
            <span className="text-primary-600 font-bold mr-3">2.</span>
            <p><strong>Shared Database:</strong> All terminals connect to the same MongoDB database for instant data access</p>
          </div>
          <div className="flex items-start">
            <span className="text-primary-600 font-bold mr-3">3.</span>
            <p><strong>Auto-sync:</strong> Products, customers, sales, and settings sync automatically across all terminals</p>
          </div>
          <div className="flex items-start">
            <span className="text-primary-600 font-bold mr-3">4.</span>
            <p><strong>Offline Protection:</strong> Terminals marked offline after 5 minutes of no heartbeat</p>
          </div>
          <div className="flex items-start">
            <span className="text-primary-600 font-bold mr-3">5.</span>
            <p><strong>Invoice Numbers:</strong> Unique per-terminal invoice numbering prevents conflicts</p>
          </div>
        </div>
      </div>

      {/* Register Terminal Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Register New Terminal</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terminal Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="e.g., Counter 1, Front Desk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Address (Optional)
                </label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="192.168.1.100"
                />
              </div>

              <div className="bg-accent-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> After registration, you'll need to configure the new terminal
                  to use this ID for proper synchronization.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TerminalManagement;
