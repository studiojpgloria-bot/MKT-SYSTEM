import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface QuickTaskFormProps {
  stageId: string;
  themeColor: string;
  onCreateTask: (title: string, stageId: string) => void;
  onCancel: () => void;
}

export const QuickTaskForm: React.FC<QuickTaskFormProps> = ({ stageId, themeColor, onCreateTask, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onCreateTask(title.trim(), stageId);
      setTitle('');
      onCancel();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-800 animate-in fade-in zoom-in-95 duration-200">
      <input
        autoFocus
        type="text"
        placeholder="Enter task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        className="w-full text-sm border-none p-0 focus:ring-0 mb-2 font-medium text-gray-800 dark:text-white placeholder-gray-400 bg-transparent"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400"
        >
          <X size={16} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className={`p-1 rounded text-white ${title.trim() ? `bg-${themeColor}-600 hover:bg-${themeColor}-700` : 'bg-gray-300 dark:bg-slate-700'}`}
        >
          <Check size={16} />
        </button>
      </div>
    </div>
  );
};