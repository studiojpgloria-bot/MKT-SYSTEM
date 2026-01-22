
import React, { useState } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Task, TaskPriority, User, WorkflowStage, UserRole } from '../types';
import { KanbanCard } from './KanbanCard';

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

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || task.assigneeId === assigneeFilter;

    return matchesSearch && matchesPriority && matchesAssignee && !task.archived;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const isMember = currentUser.role === UserRole.MEMBER;

    // Regra de bloqueio: Membro não pode mover tarefa se estiver em revisão ou já aprovada/publicada
    // Essas etapas exigem validação de gestor ou são estados finais
    if (isMember && (task?.stage === 'review' || task?.stage === 'approved' || task?.stage === 'published')) {
      e.preventDefault();
      return;
    }

    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const isMember = currentUser.role === UserRole.MEMBER;

    // Verificação de Segurança (UI): Altera o cursor para indicar que o drop é proibido
    if (isMember && (stageId === 'approved' || stageId === 'published')) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const isMember = currentUser.role === UserRole.MEMBER;

    // Verificação de Segurança (Lógica): Travas finais para Membros
    if (isMember) {
      // Impede membro de mover para colunas finais manualmente
      // A transição para 'approved' deve ocorrer apenas via Central de Aprovações
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
          const isRestrictedForMember = currentUser.role === UserRole.MEMBER && (stage.id === 'approved' || stage.id === 'published');

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 flex flex-col snap-center"
              onDragOver={(e) => handleDragOver(e, stage.id)}
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
                className={`flex-1 bg-gray-100/50 dark:bg-[#151a21]/50 rounded-3xl p-3 space-y-3 overflow-y-auto hide-scrollbar border-2 ${draggedTaskId ? (isRestrictedForMember ? 'border-red-500/20 bg-red-500/5' : 'border-dashed border-[#3b82f6]/30 bg-[#3b82f6]/5') : 'border-transparent'
                  } transition-colors`}
              >
                {stageTasks.map((task) => {
                  const isLocked = currentUser.role === UserRole.MEMBER && (task.stage === 'review' || task.stage === 'approved' || task.stage === 'published');

                  return (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      users={users}
                      themeColor={themeColor}
                      isLocked={isLocked}
                      onUpdateTask={onUpdateTask}
                      onTaskClick={onTaskClick}
                      onDeleteTask={onDeleteTask}
                      onExportTask={onExportTask}
                      onDragStart={handleDragStart}
                    />
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
