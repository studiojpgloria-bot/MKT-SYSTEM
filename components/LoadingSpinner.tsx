import React from 'react';
import { Loader } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading your workspace..." }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader size={48} className="text-indigo-500 animate-spin" />
      <p className="text-gray-600 dark:text-slate-400">{message}</p>
    </div>
  </div>
);