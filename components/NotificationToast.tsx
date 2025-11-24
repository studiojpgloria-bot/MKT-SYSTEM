import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

interface NotificationToastProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ title, message, type, onClose }) => {
  
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
    <div className={`flex items-start gap-3 bg-white p-4 rounded-lg shadow-lg border-l-4 ${getBorderColor()} min-w-[320px] animate-in slide-in-from-right duration-300 relative pointer-events-auto`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 mr-2">
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-0.5 leading-tight">{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};