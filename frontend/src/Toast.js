import React, { useEffect } from 'react';

function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast-slide-in flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl ${getTypeStyles()} min-w-[300px] max-w-md`}>
      <div className="text-2xl font-bold">{getIcon()}</div>
      <div className="flex-1 font-medium">{message}</div>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors font-bold text-xl"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
