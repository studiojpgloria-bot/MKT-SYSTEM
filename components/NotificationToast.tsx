
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { Notification } from '../types';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onClick: (notification: Notification) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose, onClick }) => {
  const { title, message, type } = notification;
  
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      case 'error': return <AlertCircle size={20} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-amber-500';
      default: return 'border-blue-500';
    }
  };

  return (
    <div 
      onClick={() => onClick(notification)}
      className={`flex items-start gap-3 bg-white dark:bg-[#151a21] p-4 rounded-lg shadow-lg border-l-4 ${getBorderColor()} min-w-[320px] animate-in slide-in-from-right duration-300 relative pointer-events-auto cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e232d] transition-colors`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 mr-2">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">{message}</p>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
