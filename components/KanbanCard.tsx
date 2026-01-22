
import React, { useState, useRef, useEffect } from 'react';
import { Clock, AlertTriangle, Paperclip, CheckSquare, Lock, Tag as TagIcon, Plus, X } from 'lucide-react';
import { Task, TaskPriority, User } from '../types';

interface DueDateBadgeProps {
  dueDate: number;
  onUpdate: (date: number) => void;
}

const DueDateBadge: React.FC<DueDateBadgeProps> = ({ dueDate, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);

  const daysLeft = Math.ceil((dueDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft < 3 && !isOverdue;

  const formatDateForInput = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day, 12, 0, 0);
    onUpdate(newDate.getTime());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="date"
        className="text-xs border border-[#3b82f6] rounded px-2 py-0.5 bg-white dark:bg-[#151a21] text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] z-10 relative"
        defaultValue={formatDateForInput(dueDate)}
        onBlur={() => setIsEditing(false)}
        onChange={handleDateChange}
        autoFocus
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer px-2 py-1 rounded transition-colors border border-transparent hover:bg-gray-100 dark:hover:bg-[#2a303c] ${isOverdue
          ? 'text-red-500 dark:text-red-400 bg-red-500/10'
          : isUrgent
            ? 'text-orange-500 dark:text-orange-400 bg-orange-500/10'
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
        }`}
      title="Clique para alterar a data"
    >
      {isOverdue ? <AlertTriangle size={13} /> : <Clock size={13} />}
      <span>{isOverdue ? 'Atrasado' : daysLeft === 0 ? 'Hoje' : `${daysLeft}d`}</span>
    </div>
  );
};

interface KanbanCardProps {
  task: Task;
  users: User[];
  themeColor: string;
  isLocked: boolean;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onExportTask: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  users,
  themeColor,
  isLocked,
  onUpdateTask,
  onTaskClick,
  onDeleteTask,
  onExportTask,
  onDragStart
}) => {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'bg-red-500/20 text-red-500 dark:text-red-400 border-red-500/30';
      case TaskPriority.HIGH: return 'bg-orange-500/20 text-orange-500 dark:text-orange-400 border-orange-500/30';
      case TaskPriority.MEDIUM: return 'bg-blue-500/20 text-blue-500 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600/30';
    }
  };

  const handleAddTag = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (tagInput.trim()) {
      const currentTags = task.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        onUpdateTask(task.id, { tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, tagToRemove: string) => {
    e.stopPropagation();
    const currentTags = task.tags || [];
    onUpdateTask(task.id, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const assignee = users.find(u => u.id === task.assigneeId);
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      draggable={!isLocked}
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onTaskClick(task.id)}
      className={`bg-white dark:bg-[#1e232d] p-4 rounded-2xl shadow-sm border transition-all group relative ${isLocked ? 'opacity-80 cursor-default border-transparent' : 'border-gray-200 dark:border-[#2a303c]/50 hover:border-[#3b82f6]/50 cursor-grab active:cursor-grabbing'}`}
    >
      {isLocked && (
        <div className="absolute top-4 right-4 text-gray-500">
          <Lock size={12} />
        </div>
      )}

      {/* Top Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#151a21] px-1.5 rounded border border-gray-200 dark:border-[#2a303c]">
            #{task.id.slice(-4)}
          </span>
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
        {task.title}
      </h4>
      <p className="text-xs text-gray-500 line-clamp-2 mb-4">
        {task.description}
      </p>

      {/* Tags Section */}
      <div className="flex flex-wrap gap-1.5 mb-4 items-center">
        {task.tags?.map((tag, idx) => (
          <span
            key={idx}
            className="group/tag inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#151a21] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2a303c] hover:border-slate-300 dark:hover:border-slate-600 transition-all"
          >
            <TagIcon size={10} className="opacity-70" />
            {tag}
            {!isLocked && (
              <button
                onClick={(e) => handleRemoveTag(e, tag)}
                className="hover:text-red-500 transition-colors"
              >
                <X size={10} />
              </button>
            )}
          </span>
        ))}
        {!isLocked && (
          <div className="relative inline-block">
            {isAddingTag ? (
              <form
                onSubmit={handleAddTag}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex items-center"
              >
                <input
                  ref={tagInputRef}
                  autoFocus
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onBlur={() => {
                    if (!tagInput.trim()) setIsAddingTag(false);
                    else handleAddTag();
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#0b0e11] border border-blue-500 outline-none text-slate-900 dark:text-white w-20"
                  placeholder="Tag..."
                />
              </form>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddingTag(true);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-dashed border-slate-300 dark:border-[#2a303c] text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all"
              >
                <Plus size={10} />
                Tag
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2a303c]">
        <div className="flex items-center gap-3">
          {assignee && (
            <div className="flex -space-x-2">
              <img
                src={assignee.avatar}
                alt={assignee.name}
                title={`Responsável: ${assignee.name}`}
                className="w-6 h-6 rounded-full border border-gray-200 dark:border-[#2a303c] z-10"
              />
              {task.collaboratorIds && task.collaboratorIds.map(collabId => {
                const collaborator = users.find(u => u.id === collabId);
                if (!collaborator) return null;
                return (
                  <img
                    key={collabId}
                    src={collaborator.avatar}
                    alt={collaborator.name}
                    title={`Colaborador: ${collaborator.name}`}
                    className="w-6 h-6 rounded-full border border-gray-200 dark:border-[#2a303c]"
                  />
                );
              })}
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
              <Paperclip size={12} />
              <span>{task.attachments.length}</span>
            </div>
          )}

          {totalSubtasks > 0 && (
            <div className={`flex items-center gap-1 text-xs ${completedSubtasks === totalSubtasks ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
              <CheckSquare size={12} />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
        </div>

        <DueDateBadge
          dueDate={task.dueDate}
          onUpdate={(newDate) => onUpdateTask(task.id, { dueDate: newDate })}
        />
      </div>
    </div>
  );
};
