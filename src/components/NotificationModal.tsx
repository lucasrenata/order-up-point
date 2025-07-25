
import React, { useEffect } from 'react';

interface NotificationModalProps {
  message: string;
  onClose: () => void;
  type?: 'info' | 'error' | 'success';
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ message, onClose, type = 'info' }) => {
  if (!message) return null;
  
  const colors = {
    info: 'bg-blue-500',
    error: 'bg-red-500',
    success: 'bg-green-500',
  };

  const icons = {
    info: 'ℹ️',
    error: '❌',
    success: '✅',
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className={`fixed top-5 right-5 ${colors[type]} text-white py-4 px-6 rounded-lg shadow-xl animate-bounce z-50 flex items-center gap-2`}>
      <span className="text-lg">{icons[type]}</span>
      <p className="font-semibold">{message}</p>
    </div>
  );
};
