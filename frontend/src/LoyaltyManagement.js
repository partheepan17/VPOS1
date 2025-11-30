import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function LoyaltyManagement({ language }) {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('settings');

  const getText = (key) => {
    const translations = {
      en: {
        title: 'Loyalty Program',
        settings: 'Settings',
        statistics: 'Statistics',
        enabled: 'Program Enabled',
        pointsPerCurrency: 'Points per LKR',
        currencyPerPoint: 'LKR per Point (Redemption)',
        minPurchase: 'Minimum Purchase for Points',
        minRedemption: 'Minimum Points for Redemption',
        maxRedemptionPercent: 'Max Redemption % of Bill',
        pointsExpiry: 'Points Expiry (days, 0=never)',
        tierSettings: 'Tier Settings',
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum',
        threshold: 'Threshold (Lifetime Points)',
        multiplier: 'Points Multiplier',
        save: 'Save Settings',
        totalCustomers: 'Total Loyalty Customers',
        pointsInCirculation: 'Points in Circulation',
        lifetimePoints: 'Lifetime Points Awarded',
        tierDistribution: 'Customer Tier Distribution',
      },
      si: {
        title: 'පාරිභෝගික පක්ෂපාතීත්ව වැඩසටහන',
        settings: 'සැකසුම්',
        statistics: 'සංඛ්‍යාන',
        enabled: 'වැඩසටහන සක්‍රීය',
        pointsPerCurrency: 'LKR එකකට ලකුණු',
        currencyPerPoint: 'ලකුණු එකකට LKR',
        minPurchase: 'ලකුණු සඳහා අවම මිලදී ගැනීම',
        minRedemption: 'මුදාගැනීම සඳහා අවම ලකුණු',
        maxRedemptionPercent: 'බිලෙන් උපරිම මුදාගැනීම %',
        pointsExpiry: 'ලකුණු කල් ඉකුත්වීම (දින)',
        tierSettings: 'ස්ථර සැකසුම්',
        bronze: 'ব්‍රොන්ස්',
        silver: 'රිදී',
        gold: 'රන්',
        platinum: 'ප්ලැටිනම්',
        threshold: 'සීමාව (ජීවිත කාලය ලකුණු)',
        multiplier: 'ලකුණු ගුණකය',
        save: 'සුරකින්න',
        totalCustomers: 'මුළු පාරිභෝගිකයින්',
        pointsInCirculation: 'සංසරණයේ ලකුණු',
        lifetimePoints: 'ජීවිත කාලයේ ලබා දී ඇති ලකුණු',
        tierDistribution: 'පාරිභෝගික ස්ථර බෙදාහැරීම',
      },
      ta: {
        title: 'வாடிக்கையாளர் விசுவாசத் திட்டம்',
        settings: 'அமைப்புகள்',
        statistics: 'புள்ளிவிவரங்கள்',
        enabled: 'திட்டம் இயக்கப்பட்டது',
        pointsPerCurrency: 'LKR ஒன்றுக்கு புள்ளிகள்',
        currencyPerPoint: 'புள்ளிக்கு LKR',
        minPurchase: 'புள்ளிகளுக்கான குறைந்தபட்ச கொள்முதல்',
        minRedemption: 'மீட்புக்கான குறைந்தபட்ச புள்ளிகள்',
        maxRedemptionPercent: 'பில் % அதிகபட்ச மீட்பு',
        pointsExpiry: 'புள்ளிகள் காலாவதி (நாட்கள்)',
        tierSettings: 'அடுக்கு அமைப்புகள்',
        bronze: 'வெண்கலம்',
        silver: 'வெள்ளி',
        gold: 'தங்கம்',
        platinum: 'பிளாட்டினம்',
        threshold: 'வரம்பு (வாழ்நாள் புள்ளிகள்)',
        multiplier: 'புள்ளிகள் பெருக்கி',
        save: 'சேமி',
        totalCustomers: 'மொத்த வாடிக்கையாளர்கள்',
        pointsInCirculation: 'புழக்கத்தில் உள்ள புள்ளிகள்',
        lifetimePoints: 'வாழ்நாள் புள்ளிகள் வழங்கப்பட்டன',
        tierDistribution: 'வாடிக்கையாளர் அடுக்கு விநியோகம்',
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/loyalty/settings`);
      setSettings(response.data);
    } catch (error) {
      showNotification('Failed to load settings', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/loyalty/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/loyalty/settings`, settings);
      showNotification('Settings saved successfully!', 'success');
      fetchStats();
    } catch (error) {
      showNotification('Failed to save settings', 'error');
    }
    setLoading(false);
  };

  if (!settings) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{getText('title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'settings'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {getText('settings')}
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'statistics'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {getText('statistics')}
          </button>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="w-5 h-5"
            />
            <label className="text-lg font-semibold">{getText('enabled')}</label>
          </div>

          {/* Points Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getText('pointsPerCurrency')}
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.points_per_currency}
                onChange={(e) => setSettings({ ...settings, points_per_currency: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">1 point per X LKR spent</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getText('currencyPerPoint')}
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.currency_per_point}
                onChange={(e) => setSettings({ ...settings, currency_per_point: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">1 point = X LKR discount</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getText('minPurchase')}
              </label>
              <input
                type="number"
                value={settings.min_purchase_for_points}
                onChange={(e) => setSettings({ ...settings, min_purchase_for_points: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getText('minRedemption')}
              </label>
              <input
                type="number"
                value={settings.min_points_for_redemption}
                onChange={(e) => setSettings({ ...settings, min_points_for_redemption: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getText('maxRedemptionPercent')}
              </label>
              <input
                type="number"
                value={settings.max_redemption_percent}
                onChange={(e) => setSettings({ ...settings, max_redemption_percent: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getText('pointsExpiry')}
              </label>
              <input
                type="number"
                value={settings.points_expiry_days || 0}
                onChange={(e) => setSettings({ ...settings, points_expiry_days: parseInt(e.target.value) || null })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Tier Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{getText('tierSettings')}</h3>
            <div className="space-y-3">
              {['bronze', 'silver', 'gold', 'platinum'].map(tier => (
                <div key={tier} className="grid grid-cols-3 gap-4 items-center bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium capitalize">{getText(tier)}</div>
                  <div>
                    <label className="text-xs text-gray-600">{getText('threshold')}</label>
                    <input
                      type="number"
                      value={settings[`tier_${tier}_threshold`]}
                      onChange={(e) => setSettings({ ...settings, [`tier_${tier}_threshold`]: parseInt(e.target.value) })}
                      className="w-full px-3 py-1 border rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">{getText('multiplier')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.tier_multipliers[tier]}
                      onChange={(e) => setSettings({
                        ...settings,
                        tier_multipliers: { ...settings.tier_multipliers, [tier]: parseFloat(e.target.value) }
                      })}
                      className="w-full px-3 py-1 border rounded mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="w-full px-6 py-3 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
          >
            {loading ? 'Saving...' : getText('save')}
          </button>
        </div>
      )}

      {activeTab === 'statistics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-gray-600 text-sm mb-2">{getText('totalCustomers')}</div>
              <div className="text-3xl font-bold text-primary-600">{stats.total_customers}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-gray-600 text-sm mb-2">{getText('pointsInCirculation')}</div>
              <div className="text-3xl font-bold text-secondary-600">{stats.total_points_in_circulation.toFixed(0)}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-gray-600 text-sm mb-2">{getText('lifetimePoints')}</div>
              <div className="text-3xl font-bold text-accent-600">{stats.total_lifetime_points_awarded.toFixed(0)}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{getText('tierDistribution')}</h3>
            <div className="space-y-2">
              {Object.entries(stats.tier_distribution).map(([tier, count]) => (
                <div key={tier} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize">{getText(tier)}</span>
                  <span className="text-2xl font-bold text-primary-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoyaltyManagement;
