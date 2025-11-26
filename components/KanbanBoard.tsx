import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Clock, AlertTriangle, Paperclip, Search, Filter, X, Trash2, Download, CheckSquare } from 'lucide-react';
import { Task, TaskPriority, User, WorkflowStage, UserRole } from '../types';
import { QuickTaskForm } from './QuickTaskForm';

// Helper to get a consistent color for a tag
const getTagColor = (tag: string) => {
    const colors = [
        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900',
        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900',
        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900',
        'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-900',
        'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-900',
        'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-900',
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  workflow: WorkflowStage[];
  themeColor: string;
  currentUser: User;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onExportTask: (taskId: string) => void;
  onCreateTask: (title: string, stageId: string) => void;
}

const DueDateBadge = ({ dueDate, onUpdate }: { dueDate: number; onUpdate: (date: number) => void }) => {
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
        className="text-xs border border-indigo-300 rounded px-2 py-0.5 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent z-10 relative"
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
      className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer px-2 py-1 rounded transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm ${
        isOverdue
          ? 'text-red-600 bg-red-50/50'
          : isUrgent
          ? 'text-orange-600 bg-orange-50/50'
          : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
      }`}
      title="Click to change due date"
    >
      {isOverdue ? <AlertTriangle size={13} /> : <Clock size={13} />}
      <span>{isOverdue ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d`}</span>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  users, 
  workflow, 
  themeColor, 
  currentUser,
  onUpdateTask, 
  onTaskClick, 
  onDeleteTask, 
  onExportTask,
  onCreateTask
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [addingToStage, setAddingToStage] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuTaskId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900';
      case TaskPriority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900';
      case TaskPriority.MEDIUM: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900';
      default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const filteredTasks = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (task.clients?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            task.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'ALL' || task.assigneeId === assigneeFilter;

      return matchesSearch && matchesPriority && matchesAssignee;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedTaskId) {
      onUpdateTask(draggedTaskId, { stage: stageId });
      setDraggedTaskId(null);
    }
  };

  const canEdit = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                  type="text" 
                  placeholder="Search by ID, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-${themeColor}-500 focus:border-transparent bg-transparent`}
              />
              {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                      <X size={14} />
                  </button>
              )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                  <Filter size={14} className="text-gray-500" />
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-0 cursor-pointer"
                  >
                      <option value="ALL">All Priorities</option>
                      {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                  <span className="text-sm text-gray-500">Assignee:</span>
                  <select 
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-0 cursor-pointer min-w-[100px]"
                  >
                      <option value="ALL">All Members</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
              </div>
          </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-x-auto lg:overflow-x-visible pb-4">
        {workflow.map((stage) => {
          const stageTasks = filteredTasks.filter((t) => t.stage === stage.id);
          
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-full lg:w-80 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wider flex items-center gap-2">
                  {stage.name}
                  <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full">
                    {stageTasks.length}
                  </span>
                </h3>
              </div>

              <div 
                className={`flex-1 bg-slate-100/50 rounded-xl p-2 space-y-3 overflow-y-auto hide-scrollbar border-2 ${
                  draggedTaskId ? `border-dashed border-${themeColor}-200 bg-${themeColor}-50/30` : 'border-transparent'
                } transition-colors`}
              >
                {stageTasks.map((task) => {
                  const assignee = users.find(u => u.id === task.assigneeId);
                  const isMenuOpen = activeMenuTaskId === task.id;
                  
                  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
                  const totalSubtasks = task.subtasks?.length || 0;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onTaskClick(task.id)}
                      className={`bg-white p-4 rounded-lg shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing border border-gray-100 transition-all group relative hover:border-${themeColor}-200`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1 rounded border border-gray-100">
                                #{task.id}
                            </span>
                        </div>
                        
                        <div className="relative">
                           <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTaskId(isMenuOpen ? null : task.id);
                              }}
                              className="p-1 text-gray-300 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                           >
                              <MoreHorizontal size={16} />
                           </button>
                           
                           {isMenuOpen && (
                             <div 
                               ref={menuRef}
                               className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                               onClick={(e) => e.stopPropagation()}
                             >
                               <button 
                                  onClick={() => {
                                    onExportTask(task.id);
                                    setActiveMenuTaskId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2"
                                >
                                  <Download size={14} /> Export CSV
                               </button>
                               {canEdit && (
                                 <button 
                                    onClick={() => {
                                      if(window.confirm('Are you sure you want to delete this task?')) onDeleteTask(task.id);
                                    }}
                                    className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                 >
                                    <Trash2 size={14} /> Delete Task
                                 </button>
                               )}
                             </div>
                           )}
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-800 mb-1 leading-tight">
                          {task.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mb-3">
                          {task.clients?.name || 'No Client'}
                      </p>

                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                           {task.tags.slice(0, 3).map(tag => (
                            <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTagColor(tag)}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-3">
                              {assignee && (
                                  <img 
                                      src={assignee.avatar} 
                                      alt={assignee.name} 
                                      title={assignee.name}
                                      className="w-6 h-6 rounded-full ring-2 ring-white" 
                                  />
                              )}
                              
                              {task.attachments.length > 0 && (
                                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                                      <Paperclip size={12} />
                                      <span>{task.attachments.length}</span>
                                  </div>
                              )}

                              {totalSubtasks > 0 && (
                                  <div className={`flex items-center gap-1 text-xs ${completedSubtasks === totalSubtasks ? 'text-green-600' : 'text-gray-400'}`}>
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
                })}
                
                {canEdit && (
                  <>
                    {addingToStage === stage.id ? (
                       <QuickTaskForm 
                          stageId={stage.id}
                          themeColor={themeColor}
                          onCreateTask={onCreateTask}
                          onCancel={() => setAddingToStage(null)}
                       />
                    ) : (
                      <button 
                        onClick={() => setAddingToStage(stage.id)}
                        className={`w-full py-2 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-${themeColor}-400 hover:text-${themeColor}-500 flex items-center justify-center gap-2 text-sm transition-colors`}
                      >
                        <Plus size={16} />
                        Add Task
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};