import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function UserManagement({ language }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'cashier',
    active: true
  });

  const getText = (key) => {
    const translations = {
      en: {
        title: 'User Management',
        addUser: 'Add User',
        username: 'Username',
        fullName: 'Full Name',
        role: 'Role',
        status: 'Status',
        actions: 'Actions',
        manager: 'Manager',
        cashier: 'Cashier',
        active: 'Active',
        inactive: 'Inactive',
        edit: 'Edit',
        delete: 'Deactivate',
        save: 'Save',
        cancel: 'Cancel',
        password: 'Password',
        newPassword: 'New Password',
        createUser: 'Create User',
        editUser: 'Edit User',
        passwordHelper: 'Leave blank to keep current password',
        confirmDelete: 'Are you sure you want to deactivate this user?',
        deleteSuccess: 'User deactivated successfully',
        saveSuccess: 'User saved successfully',
        createSuccess: 'User created successfully',
        noUsers: 'No users found',
      },
      si: {
        title: 'පරිශීලක කළමනාකරණය',
        addUser: 'පරිශීලක එකතු කරන්න',
        username: 'පරිශීලක නාමය',
        fullName: 'සම්පූර්ණ නම',
        role: 'භූමිකාව',
        status: 'තත්ත්වය',
        actions: 'ක්‍රියාවන්',
        manager: 'කළමනාකරු',
        cashier: 'මුදල් හසුරුවන්නා',
        active: 'සක්‍රීය',
        inactive: 'අක්‍රීය',
        edit: 'සංස්කරණය',
        delete: 'අක්‍රීය කරන්න',
        save: 'සුරකින්න',
        cancel: 'අවලංගු කරන්න',
        password: 'මුරපදය',
        newPassword: 'නව මුරපදය',
        createUser: 'පරිශීලක නිර්මාණය',
        editUser: 'පරිශීලක සංස්කරණය',
        passwordHelper: 'වත්මන් මුරපදය තබා ගැනීමට හිස්ව තබන්න',
        confirmDelete: 'ඔබට මෙම පරිශීලකයා අක්‍රීය කිරීමට අවශ්‍ය බව විශ්වාසද?',
        deleteSuccess: 'පරිශීලකයා අක්‍රීය කරන ලදී',
        saveSuccess: 'පරිශීලකයා සුරකින ලදී',
        createSuccess: 'පරිශීලකයා නිර්මාණය කරන ලදී',
        noUsers: 'පරිශීලකයින් හමු නොවීය',
      },
      ta: {
        title: 'பயனர் மேலாண்மை',
        addUser: 'பயனர் சேர்',
        username: 'பயனர்பெயர்',
        fullName: 'முழு பெயர்',
        role: 'பங்கு',
        status: 'நிலை',
        actions: 'செயல்கள்',
        manager: 'மேலாளர்',
        cashier: 'காசாளர்',
        active: 'செயல்படும்',
        inactive: 'செயலற்ற',
        edit: 'திருத்து',
        delete: 'செயலிழக்க',
        save: 'சேமி',
        cancel: 'ரத்து',
        password: 'கடவுச்சொல்',
        newPassword: 'புதிய கடவுச்சொல்',
        createUser: 'பயனர் உருவாக்கு',
        editUser: 'பயனர் திருத்து',
        passwordHelper: 'தற்போதைய கடவுச்சொல்லை வைத்திருக்க வெறுமையாக விடவும்',
        confirmDelete: 'இந்த பயனரை செயலிழக்க விரும்புகிறீர்களா?',
        deleteSuccess: 'பயனர் செயலிழக்கப்பட்டது',
        saveSuccess: 'பயனர் சேமிக்கப்பட்டது',
        createSuccess: 'பயனர் உருவாக்கப்பட்டது',
        noUsers: 'பயனர்கள் இல்லை',
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data.users || []);
    } catch (error) {
      showNotification('Failed to load users', 'error');
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        full_name: user.full_name,
        role: user.role,
        active: user.active
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'cashier',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'cashier',
      active: true
    });
  };

  const handleSaveUser = async () => {
    // Validation
    if (!formData.username || !formData.full_name) {
      showNotification('Username and full name are required', 'error');
      return;
    }

    if (!editingUser && !formData.password) {
      showNotification('Password is required for new users', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        full_name: formData.full_name,
        role: formData.role,
        active: formData.active
      };

      // Only include password if it's provided
      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUser) {
        // Update existing user
        await axios.put(`${API_URL}/api/users/${editingUser.id}`, payload);
        showNotification(getText('saveSuccess'), 'success');
      } else {
        // Create new user
        await axios.post(`${API_URL}/api/users`, payload);
        showNotification(getText('createSuccess'), 'success');
      }

      fetchUsers();
      handleCloseModal();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'Failed to save user', 'error');
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId, username) => {
    if (username === 'admin') {
      showNotification('Cannot deactivate admin user', 'error');
      return;
    }

    if (!window.confirm(getText('confirmDelete'))) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/users/${userId}`);
      showNotification(getText('deleteSuccess'), 'success');
      fetchUsers();
    } catch (error) {
      showNotification('Failed to deactivate user', 'error');
    }
    setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-800">{getText('title')}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition shadow-md"
        >
          + {getText('addUser')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {getText('noUsers')}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {getText('username')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {getText('fullName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {getText('role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {getText('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {getText('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'manager' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? getText('active') : getText('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-primary-600 hover:text-primary-900 px-3 py-1 rounded hover:bg-primary-50"
                    >
                      {getText('edit')}
                    </button>
                    {user.username !== 'admin' && user.active && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50"
                      >
                        {getText('delete')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingUser ? getText('editUser') : getText('createUser')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('username')} *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={editingUser !== null}
                  className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('fullName')} *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? getText('newPassword') : getText('password')} {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={editingUser ? getText('passwordHelper') : "Enter password"}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">{getText('passwordHelper')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('role')} *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="cashier">{getText('cashier')}</option>
                  <option value="manager">{getText('manager')}</option>
                </select>
              </div>

              {editingUser && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    {getText('active')}
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveUser}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
              >
                {loading ? 'Saving...' : getText('save')}
              </button>
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition"
              >
                {getText('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
