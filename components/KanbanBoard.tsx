
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Clock, AlertTriangle, Paperclip, Search, Filter, X, CheckSquare, Lock } from 'lucide-react';
import { Task, TaskPriority, User, WorkflowStage, UserRole } from '../types';

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
  onNewTask: (stageId: string) => void;
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
      className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer px-2 py-1 rounded transition-colors border border-transparent hover:bg-gray-100 dark:hover:bg-[#2a303c] ${
        isOverdue
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
  onNewTask
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'bg-red-500/20 text-red-500 dark:text-red-400 border-red-500/30';
      case TaskPriority.HIGH: return 'bg-orange-500/20 text-orange-500 dark:text-orange-400 border-orange-500/30';
      case TaskPriority.MEDIUM: return 'bg-blue-500/20 text-blue-500 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600/30';
    }
  };

  const filteredTasks = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            task.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'ALL' || task.assigneeId === assigneeFilter;

      return matchesSearch && matchesPriority && matchesAssignee;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const isMember = currentUser.role === UserRole.MEMBER;

    // Regra de bloqueio: Membro não pode mover tarefa se estiver em revisão ou já aprovada
    if (isMember && (task?.stage === 'review' || task?.stage === 'approved' || task?.stage === 'published')) {
      e.preventDefault();
      return;
    }

    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const isMember = currentUser.role === UserRole.MEMBER;
    
    // Travas de segurança para Membros
    if (isMember) {
      // Impede membro de mover para colunas finais manualmente
      if (stageId === 'approved' || stageId === 'published') {
        setDraggedTaskId(null);
        return;
      }
    }

    onUpdateTask(draggedTaskId, { stage: stageId });
    setDraggedTaskId(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-[#151a21] p-4 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 transition-colors duration-300">
          <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                  type="text" 
                  placeholder="Buscar por ID, título..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#0b0e11] border border-gray-200 dark:border-[#2a303c] text-sm text-gray-900 dark:text-white focus:outline-none focus:border-${themeColor}-500 transition-colors`}
              />
              {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                      <X size={14} />
                  </button>
              )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-[#2a303c] bg-gray-50 dark:bg-[#0b0e11]">
                  <Filter size={14} className="text-gray-500" />
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-300 focus:ring-0 p-0 cursor-pointer"
                  >
                      <option value="ALL">Todas Prioridades</option>
                      {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
              </div>

              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-[#2a303c] bg-gray-50 dark:bg-[#0b0e11]">
                  <span className="text-sm text-gray-500">Responsável:</span>
                  <select 
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-300 focus:ring-0 p-0 cursor-pointer min-w-[100px]"
                  >
                      <option value="ALL">Todos Membros</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
              </div>
          </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x">
        {workflow.map((stage) => {
          const stageTasks = filteredTasks.filter((t) => t.stage === stage.id);
          
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 flex flex-col snap-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-gray-500 dark:text-gray-300 uppercase text-xs tracking-widest flex items-center gap-2">
                  {stage.name}
                  <span className="bg-gray-200 dark:bg-[#2a303c] text-gray-700 dark:text-white text-[10px] py-0.5 px-2 rounded-full">
                    {stageTasks.length}
                  </span>
                </h3>
              </div>

              {/* Drop Zone */}
              <div 
                className={`flex-1 bg-gray-100/50 dark:bg-[#151a21]/50 rounded-3xl p-3 space-y-3 overflow-y-auto hide-scrollbar border-2 ${
                  draggedTaskId ? `border-dashed border-[#3b82f6]/30 bg-[#3b82f6]/5` : 'border-transparent'
                } transition-colors`}
              >
                {stageTasks.map((task) => {
                  const assignee = users.find(u => u.id === task.assigneeId);
                  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
                  const totalSubtasks = task.subtasks?.length || 0;
                  const isLocked = currentUser.role === UserRole.MEMBER && (task.stage === 'review' || task.stage === 'approved' || task.stage === 'published');

                  return (
                    <div
                      key={task.id}
                      draggable={!isLocked}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onTaskClick(task.id)}
                      className={`bg-white dark:bg-[#1e232d] p-4 rounded-2xl shadow-sm border transition-all group relative ${isLocked ? 'opacity-80 cursor-default border-transparent' : 'border-gray-200 dark:border-[#2a303c]/50 hover:border-[#3b82f6]/50 cursor-grab active:cursor-grabbing'}`}
                    >
                      {/* Lock Icon for status integrity */}
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

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2a303c]">
                          <div className="flex items-center gap-3">
                              {assignee && (
                                  <img 
                                      src={assignee.avatar} 
                                      alt={assignee.name} 
                                      className="w-6 h-6 rounded-full border border-gray-200 dark:border-[#2a303c]" 
                                  />
                              )}
                              
                              {task.attachments.length > 0 && (
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
                })}
                
                <button 
                  onClick={() => onNewTask(stage.id)}
                  className="w-full py-3 rounded-2xl border border-dashed border-gray-300 dark:border-[#2a303c] text-gray-400 dark:text-gray-500 hover:border-[#3b82f6] hover:text-[#3b82f6] flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <Plus size={16} />
                  Adicionar Tarefa
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
