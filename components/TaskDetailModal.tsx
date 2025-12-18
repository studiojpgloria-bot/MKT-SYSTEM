
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, User as UserIcon, Paperclip, MessageSquare, Send, Trash2, CheckCircle, AlertCircle, Clock, Upload, Timer, Plus, PlayCircle, ShieldAlert, HardDrive, FileText, CheckSquare, GripVertical, Link, ExternalLink, Hourglass, AlertTriangle, ArrowRight, Copy } from 'lucide-react';
import { Task, TaskPriority, User, UserRole, WorkflowStage, Subtask, Attachment, SystemSettings } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  currentUser: User;
  users: User[];
  allTasks?: Task[]; // Added for availability check
  workflow: WorkflowStage[]; 
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onCreate?: (task: Task) => void;
  onAddComment: (taskId: string, text: string) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onUpload: (taskId: string, file: File) => void;
  onCloudImport: (taskId: string, service: string) => void;
  onAccept: (taskId: string) => void;
  onApprove: (taskId: string, attachmentId: string) => void;
  onReject: (taskId: string, attachmentId: string) => void;
  settings?: SystemSettings;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  currentUser,
  users, 
  allTasks = [],
  workflow, 
  isOpen, 
  onClose, 
  onUpdate,
  onCreate,
  onAddComment, 
  onDelete, 
  onDuplicate,
  onUpload, 
  onCloudImport, 
  onAccept, 
  onApprove, 
  onReject,
  settings
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [addTimeAmount, setAddTimeAmount] = useState(30);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Availability Conflict State
  const [conflictData, setConflictData] = useState<{
      user: User;
      busyUntil: number;
      activeTaskTitle: string;
      pendingAssigneeId: string;
  } | null>(null);

  // Mention State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  // Determine if this is a new draft task (not in allTasks list)
  const isDraft = task && !allTasks.find(t => t.id === task.id);

  // Use dynamic review stage from settings or fallback to 'review' ID
  const reviewStageId = settings?.workflowRules?.onDeliverableUpload || 'review';
  const isReviewStage = editedTask?.stage === reviewStageId;

  // Filter users for mention
  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Reset active index when query changes
  useEffect(() => {
      setActiveMentionIndex(0);
  }, [mentionQuery]);

  // Regression Timer Effect
  useEffect(() => {
    if (editedTask?.dueDate) {
        if (!editedTask.accepted) {
            setTimeRemaining('Aguardando Aceite');
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = editedTask.dueDate - now;
            
            if (diff <= 0) {
                setTimeRemaining('Prazo Expirado');
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                let timeStr = '';
                if (days > 0) timeStr += `${days}d `;
                timeStr += `${hours}h ${minutes}m ${seconds}s`;
                setTimeRemaining(timeStr);
            }
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    } else {
        setTimeRemaining('');
    }
  }, [editedTask?.dueDate, editedTask?.accepted]);

  if (!isOpen || !editedTask) return null;

  const handleSaveField = (field: keyof Task, value: any) => {
    setEditedTask(prev => prev ? { ...prev, [field]: value } : null);
    onUpdate(editedTask.id, { [field]: value });
  };

  // --- AVAILABILITY CHECK LOGIC ---
  const checkAvailabilityAndAssign = (newAssigneeId: string) => {
      // 1. Find if user is busy (Has tasks in 'design' or 'review' stages - equivalent to 'In Progress')
      const activeTask = allTasks.find(t => 
          t.assigneeId === newAssigneeId && 
          t.id !== editedTask.id && 
          (t.stage === 'design' || t.stage === 'review' || t.stage === 'briefing')
      );

      // 2. If user is busy and current user is manager/admin, show conflict modal
      if (activeTask && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER)) {
          const user = users.find(u => u.id === newAssigneeId);
          if (user) {
              setConflictData({
                  user,
                  busyUntil: activeTask.dueDate,
                  activeTaskTitle: activeTask.title,
                  pendingAssigneeId: newAssigneeId
              });
              return; // Stop assignment until resolved
          }
      }

      // 3. If available or no check needed, proceed
      handleSaveField('assigneeId', newAssigneeId);
  };

  const handleConfirmUrgentAssignment = () => {
      if (conflictData) {
          // 1. Mark as URGENT
          const updates = {
              assigneeId: conflictData.pendingAssigneeId,
              priority: TaskPriority.URGENT
          };
          
          setEditedTask(prev => prev ? { ...prev, ...updates } : null);
          onUpdate(editedTask.id, updates);
          
          // 2. Clear Conflict
          setConflictData(null);
      }
  };

  const handleCancelAssignment = () => {
      setConflictData(null);
      // Ensure UI select reverts (controlled by editedTask.assigneeId which wasn't changed yet)
  };

  const formatTimeOnly = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getNextAvailableTime = (timestamp: number) => {
      const next = new Date(timestamp + 3600000); // + 1 hour
      return next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  // --------------------------------

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNewComment(value);
      
      const selectionStart = e.target.selectionStart;
      const textBeforeCursor = value.slice(0, selectionStart);
      const lastAt = textBeforeCursor.lastIndexOf('@');
      
      if (lastAt !== -1) {
           const prevChar = lastAt === 0 ? ' ' : textBeforeCursor[lastAt - 1];
           if (/[\s\n]/.test(prevChar)) {
               const query = textBeforeCursor.slice(lastAt + 1);
               if (!/[\n]/.test(query)) {
                   setMentionQuery(query);
                   setShowMentions(true);
                   return;
               }
           }
      }
      setShowMentions(false);
  };

  const insertMention = (user: User) => {
      if (!commentInputRef.current) return;
      
      const selectionStart = commentInputRef.current.selectionStart;
      const value = newComment;
      const textBeforeCursor = value.slice(0, selectionStart);
      const lastAt = textBeforeCursor.lastIndexOf('@');
      
      const textBeforeAt = value.slice(0, lastAt);
      const textAfterCursor = value.slice(selectionStart);
      
      const newValue = `${textBeforeAt}@${user.name} ${textAfterCursor}`;
      setNewComment(newValue);
      setShowMentions(false);
      
      setTimeout(() => {
          if (commentInputRef.current) {
              commentInputRef.current.focus();
              const newCursorPos = lastAt + user.name.length + 2; 
              commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredUsers.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveMentionIndex(prev => (prev + 1) % filteredUsers.length);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
            return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            insertMention(filteredUsers[activeMentionIndex]);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setShowMentions(false);
            return;
        }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(editedTask.id, newComment);
            setNewComment('');
            setShowMentions(false);
        }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      const updatedTags = [...editedTask.tags, newTag.trim()];
      handleSaveField('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = editedTask.tags.filter(t => t !== tagToRemove);
    handleSaveField('tags', updatedTags);
  };

  const handleAddSubtask = () => {
      if (newSubtask.trim()) {
          const subtask: Subtask = {
              id: `st-${Date.now()}`,
              title: newSubtask.trim(),
              completed: false
          };
          const updatedSubtasks = [...(editedTask.subtasks || []), subtask];
          handleSaveField('subtasks', updatedSubtasks);
          setNewSubtask('');
      }
  };

  const toggleSubtask = (id: string) => {
      const updatedSubtasks = (editedTask.subtasks || []).map(st => 
        st.id === id ? { ...st, completed: !st.completed } : st
      );
      handleSaveField('subtasks', updatedSubtasks);
  };

  const deleteSubtask = (id: string) => {
      const updatedSubtasks = (editedTask.subtasks || []).filter(st => st.id !== id);
      handleSaveField('subtasks', updatedSubtasks);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onUpload(editedTask.id, e.target.files[0]);
      }
  };
  
  const handleAddLink = () => {
      if (!linkUrl.trim()) return;
      
      let finalUrl = linkUrl;
      let type: 'video' | 'pdf' = 'pdf'; 
      let name = 'External Link';
      
      const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const ytMatch = linkUrl.match(ytRegex);
      if (ytMatch) {
          finalUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
          type = 'video';
          name = 'Vídeo do YouTube';
      }

      const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
      const vimeoMatch = linkUrl.match(vimeoRegex);
      if (vimeoMatch) {
          finalUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
          type = 'video';
          name = 'Vídeo do Vimeo';
      }

      const loomRegex = /loom\.com\/share\/([a-f0-9]+)/;
      const loomMatch = linkUrl.match(loomRegex);
      if (loomMatch) {
          finalUrl = `https://www.loom.com/embed/${loomMatch[1]}`;
          type = 'video';
          name = 'Vídeo do Loom';
      }
      
      const driveRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
      const driveMatch = linkUrl.match(driveRegex);
      if (linkUrl.includes('drive.google.com') && driveMatch) {
          finalUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
          type = 'video'; 
          name = 'Recurso Drive';
      } else if (linkUrl.includes('drive.google.com') && (linkUrl.includes('/view') || linkUrl.includes('/preview'))) {
          finalUrl = linkUrl.replace('/view', '/preview');
          type = 'video';
          name = 'Recurso Drive';
      }

      const newAttachment: Attachment = {
        id: `l${Date.now()}`,
        name: name,
        url: finalUrl,
        type: type as any,
        source: 'local', 
        category: 'reference',
        uploadedBy: currentUser.id,
        status: 'pending'
      };

      const updatedAttachments = [...editedTask.attachments, newAttachment];
      handleSaveField('attachments', updatedAttachments);
      setLinkUrl('');
      setShowLinkInput(false);
  };

  const handleAddTime = () => {
      const newTime = (editedTask.timeSpent || 0) + Number(addTimeAmount);
      handleSaveField('timeSpent', newTime);
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDateTimeForInput = (timestamp: number) => {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const assignee = users.find(u => u.id === editedTask.assigneeId);
  const isAssignee = currentUser.id === editedTask.assigneeId;
  const isAdminOrManager = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

  const isLocked = isReviewStage;
  
  const canEditContent = (isAdminOrManager || isAssignee) && !isLocked;

  const needsAcceptance = isAssignee && !editedTask.accepted; 
  
  const completedSubtasks = editedTask.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = editedTask.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  
  const targetDesignStageId = settings?.workflowRules?.onAccept || 'design';
  const targetDesignStageName = workflow.find(w => w.id === targetDesignStageId)?.name || 'Design';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto text-gray-200">
      {/* Updated to Dark Theme Background */}
      <div className="bg-[#151a21] rounded-[32px] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#2a303c] relative">
        
        {/* --- AVAILABILITY CONFLICT MODAL --- */}
        {conflictData && (
            <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1e232d] border border-amber-500/30 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-amber-500/10 p-6 flex flex-col items-center text-center border-b border-amber-500/20">
                        <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Usuário Ocupado</h3>
                        <p className="text-amber-200 text-sm">
                            <span className="font-bold text-white">{conflictData.user.name}</span> está trabalhando em "<span className="italic">{conflictData.activeTaskTitle}</span>" até às <span className="font-bold">{formatTimeOnly(conflictData.busyUntil)}</span>.
                        </p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-[#151a21] p-4 rounded-xl border border-[#2a303c] flex items-center gap-3">
                            <Clock size={20} className="text-blue-400" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Disponibilidade Estimada</p>
                                <p className="text-sm font-medium text-white">Estará livre a partir das <span className="text-blue-400">{getNextAvailableTime(conflictData.busyUntil)}</span></p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={handleCancelAssignment}
                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmUrgentAssignment}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <ShieldAlert size={18} />
                                Marcar Urgente
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-500">
                            Ao marcar como urgente, o usuário será notificado imediatamente e a tarefa será atribuída ignorando a disponibilidade.
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* Header Section */}
        <div className="flex items-start justify-between px-8 pt-8 pb-4 bg-[#151a21] shrink-0 border-b border-[#2a303c]">
          <div className="flex-1 mr-8 space-y-4">
            
            {/* Meta Row: Badge & Date */}
            <div className="flex items-center gap-4">
               {/* Custom Badge Style */}
               <div className="relative">
                   <select 
                      value={editedTask.stage}
                      onChange={(e) => handleSaveField('stage', e.target.value)}
                      disabled={!isAdminOrManager} 
                      className={`appearance-none font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg text-xs border-none focus:ring-0 cursor-pointer bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors`}
                    >
                      {workflow.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                   </select>
               </div>
               
               <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>Criado em {new Date().toLocaleDateString('pt-BR')}</span>
               </div>

               {editedTask.accepted && (
                   <div className="flex items-center gap-1 text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-md">
                       <CheckCircle size={12} /> Aceito
                   </div>
               )}
            </div>
            
            {/* Title */}
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => handleSaveField('title', e.target.value)}
              readOnly={!canEditContent}
              className={`text-4xl font-black text-white bg-transparent border-none focus:ring-0 focus:outline-none w-full placeholder-gray-600 p-0 leading-tight ${!canEditContent ? 'cursor-default' : ''}`}
              placeholder="Título da Tarefa"
            />
          </div>

          <div className="flex items-center gap-3">
            {isAdminOrManager && !isDraft && (
                <>
                    <button 
                        onClick={() => onDuplicate(editedTask.id)}
                        className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                        title="Duplicar Tarefa"
                    >
                        <Copy size={22} />
                    </button>
                    <button 
                        onClick={() => {
                            if(window.confirm('Tem certeza de que deseja excluir esta tarefa permanentemente?')) {
                                onDelete(editedTask.id);
                            }
                        }}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        title="Excluir Tarefa"
                    >
                        <Trash2 size={22} />
                    </button>
                </>
            )}
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X size={28} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#151a21]">
          
          {/* Main Left Content */}
          <div className="flex-1 p-8 pt-0 overflow-y-auto custom-scrollbar space-y-8">
            
            {needsAcceptance && !isDraft && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 mt-4">
                    <PlayCircle size={40} className="text-indigo-500" />
                    <div>
                        <h3 className="text-lg font-bold text-white">Pronto para começar?</h3>
                        <p className="text-indigo-300 text-sm">Aceitar move a tarefa para <b>{targetDesignStageName}</b>.</p>
                    </div>
                    <button 
                        onClick={() => onAccept(editedTask.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                    >
                        Aceitar Tarefa
                    </button>
                </div>
            )}

            {isLocked && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 mt-4">
                    <ShieldAlert size={20} className="text-amber-500 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-white">Em Revisão</h3>
                        <p className="text-amber-300 text-xs">Esta tarefa está sendo revisada. Alterações estão bloqueadas até aprovação ou solicitação de revisão.</p>
                    </div>
                </div>
            )}

            {/* Description - Dark Box Style */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-white">Descrição</label>
              <textarea
                value={editedTask.description}
                onChange={(e) => handleSaveField('description', e.target.value)}
                readOnly={!canEditContent}
                rows={8}
                className={`w-full p-5 rounded-2xl border border-[#2a303c] bg-[#0b0e11] text-gray-300 placeholder-gray-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors leading-relaxed resize-none text-sm ${!canEditContent ? 'opacity-75 cursor-not-allowed' : ''}`}
                placeholder="Adicione uma descrição detalhada..."
              />
            </div>
            
            {/* Checklist */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                       <CheckSquare size={18} /> Checklist
                    </label>
                    {totalSubtasks > 0 && (
                        <span className="text-xs font-bold text-gray-500">{Math.round(progress)}%</span>
                    )}
                </div>
                
                {totalSubtasks > 0 && (
                    <div className="h-2 w-full bg-[#0b0e11] rounded-full mb-5 overflow-hidden border border-[#2a303c]">
                        <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                <div className="space-y-3 mb-4">
                    {(editedTask.subtasks || []).map(subtask => (
                        <div key={subtask.id} className="flex items-start gap-3 group">
                            <input 
                                type="checkbox" 
                                checked={subtask.completed}
                                onChange={() => toggleSubtask(subtask.id)}
                                className="mt-0.5 w-5 h-5 text-indigo-500 border-2 border-gray-600 rounded bg-[#0b0e11] focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!canEditContent}
                            />
                            <span className={`text-sm flex-1 ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-300 font-medium'}`}>
                                {subtask.title}
                            </span>
                            {canEditContent && (
                                <button 
                                    onClick={() => deleteSubtask(subtask.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {canEditContent && (
                    <div className="flex items-center gap-3 pl-1">
                        <Plus size={18} className="text-gray-500" />
                        <input 
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleAddSubtask();
                            }}
                            placeholder="Adicionar item"
                            className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0 placeholder-gray-600 text-gray-300 font-medium"
                        />
                    </div>
                )}
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                 <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Paperclip size={18} />
                    Anexos ({editedTask.attachments.length})
                 </label>
                 
                 <div className="flex items-center gap-3">
                     <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                     {canEditContent && (
                         <>
                            <button 
                                onClick={() => setShowLinkInput(!showLinkInput)} 
                                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm ${showLinkInput ? 'bg-indigo-500 text-white' : 'bg-[#0b0e11] border border-[#2a303c] text-gray-300 hover:bg-[#1e232d]'}`}
                            >
                               <Link size={14} /> Adic. Link
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 flex items-center gap-2 transition-all shadow-sm">
                               <Upload size={14} /> Enviar Arquivo
                            </button>
                         </>
                     )}
                 </div>
              </div>

              {/* Link Input Field */}
              {showLinkInput && (
                  <div className="mb-4 bg-[#151a21] p-3 rounded-xl border border-indigo-500/50 flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
                      <Link size={16} className="text-indigo-400" />
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Cole link do YouTube, Drive ou externo..."
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                        className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 placeholder-gray-500"
                      />
                      <button onClick={handleAddLink} className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700">
                          <Plus size={16} />
                      </button>
                  </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {editedTask.attachments.map(att => (
                    <div key={att.id} className="group">
                        {/* Special Rendering for Video Embeds */}
                        {att.type === 'video' && att.url.startsWith('http') ? (
                           <div className="mb-3 bg-black rounded-xl overflow-hidden border border-[#2a303c] relative">
                               <div className="flex items-center justify-between p-3 bg-[#151a21] border-b border-[#2a303c]">
                                   <div className="flex items-center gap-2">
                                       <PlayCircle size={16} className="text-red-500" />
                                       <span className="text-xs font-bold text-white truncate max-w-[200px]">{att.name}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                        <a href={att.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white"><ExternalLink size={14}/></a>
                                        {/* Attachment specific delete */}
                                        {canEditContent && (
                                            <button 
                                                onClick={() => {
                                                    const updatedAttachments = editedTask.attachments.filter(a => a.id !== att.id);
                                                    handleSaveField('attachments', updatedAttachments);
                                                }}
                                                className="text-gray-500 hover:text-red-400"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                   </div>
                               </div>
                               <iframe 
                                   width="100%" 
                                   height="250" 
                                   src={att.url} 
                                   title={att.name} 
                                   frameBorder="0" 
                                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                   referrerPolicy="strict-origin-when-cross-origin"
                                   allowFullScreen
                               ></iframe>
                           </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-[#0b0e11] rounded-xl border border-[#2a303c] shadow-sm hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#1e232d] rounded-lg flex items-center justify-center text-gray-400 border border-[#2a303c] overflow-hidden">
                                        {att.type === 'image' ? <img src={att.url} className="w-full h-full object-cover" alt="preview"/> : <FileText size={20} />}
                                    </div>
                                    <div>
                                        <a href={att.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-200 hover:text-indigo-400 truncate block">
                                            {att.name}
                                        </a>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">
                                        <span>{att.category}</span>
                                        <span className={`px-1.5 py-0.5 rounded ${att.status === 'approved' ? 'bg-green-500/10 text-green-400' : att.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-[#1e232d] text-gray-400'}`}>
                                            {att.status}
                                        </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {att.status === 'pending' && att.category === 'deliverable' && isAdminOrManager && (
                                        <>
                                            <button onClick={() => onReject(editedTask.id, att.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><X size={16}/></button>
                                            <button onClick={() => onApprove(editedTask.id, att.id)} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"><CheckCircle size={16}/></button>
                                        </>
                                    )}
                                    {canEditContent && (
                                        <button 
                                            onClick={() => {
                                                const updatedAttachments = editedTask.attachments.filter(a => a.id !== att.id);
                                                handleSaveField('attachments', updatedAttachments);
                                            }}
                                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                {editedTask.attachments.length === 0 && (
                    <div className="border-2 border-dashed border-[#2a303c] rounded-2xl py-12 text-center bg-[#0b0e11]/50">
                        <p className="text-sm font-bold text-gray-500">Nenhum anexo ainda</p>
                    </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="pt-4 border-t border-[#2a303c]">
               <label className="text-sm font-bold text-white flex items-center gap-2 mb-6">
                    <MessageSquare size={18} /> Comentários
               </label>
               
               <div className="space-y-6 mb-6">
                   {editedTask.comments.map(comment => {
                       const commentUser = users.find(u => u.id === comment.userId);
                       return (
                           <div key={comment.id} className="flex gap-4">
                               <img src={commentUser?.avatar} alt={commentUser?.name} className="w-8 h-8 rounded-full border border-[#2a303c]" />
                               <div className="space-y-1">
                                   <div className="flex items-center gap-2">
                                       <span className="text-xs font-bold text-white">{commentUser?.name}</span>
                                       <span className="text-[10px] text-gray-500">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                   </div>
                                   <p className="text-sm text-gray-400 leading-relaxed">{comment.text}</p>
                               </div>
                           </div>
                       );
                   })}
               </div>

               <div className="flex gap-4 items-start">
                   <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[10px] font-bold border border-indigo-500/20">VOCÊ</div>
                   <div className="flex-1 relative">
                        {showMentions && filteredUsers.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1e232d] border border-[#2a303c] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredUsers.map((u, idx) => (
                                    <button
                                        key={u.id}
                                        onClick={() => insertMention(u)}
                                        className={`w-full flex items-center gap-2 p-3 text-left hover:bg-[#2a303c] transition-colors ${idx === activeMentionIndex ? 'bg-[#2a303c]' : ''}`}
                                    >
                                        <img src={u.avatar} className="w-6 h-6 rounded-full object-cover" />
                                        <span className="text-sm text-white font-medium">{u.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <textarea
                            ref={commentInputRef}
                            value={newComment}
                            onChange={handleCommentChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Escreva um comentário (use @ para mencionar)..."
                            rows={1}
                            className="w-full py-3 px-4 pr-12 rounded-xl border border-[#2a303c] bg-[#0b0e11] text-gray-200 focus:bg-[#151a21] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm resize-none transition-all placeholder-gray-600"
                        />
                        <button 
                            onClick={() => { if(newComment.trim()) { onAddComment(editedTask.id, newComment); setNewComment(''); setShowMentions(false); }}}
                            className="absolute right-2 top-1.5 p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                            <Send size={16} />
                        </button>
                   </div>
               </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="w-full md:w-96 bg-[#0b0e11]/50 border-l border-[#2a303c] p-8 space-y-10 overflow-y-auto custom-scrollbar flex flex-col">
             
             {/* Priority */}
             <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Prioridade</label>
                <div className="flex gap-2">
                    {Object.values(TaskPriority).map(p => (
                        <button
                            key={p}
                            disabled={!isAdminOrManager}
                            onClick={() => handleSaveField('priority', p)}
                            className={`flex-1 text-[10px] font-bold py-2.5 rounded-lg border transition-all ${
                                editedTask.priority === p 
                                ? 'bg-[#151a21] border-indigo-500 text-indigo-400 shadow-sm ring-1 ring-indigo-500/50' 
                                : 'bg-[#151a21] border-[#2a303c] text-gray-500 hover:text-white hover:border-gray-500'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
             </div>

             {/* Assignee */}
             <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Responsável</label>
                <div className="relative group">
                    <div className="flex items-center gap-3 p-3 bg-[#151a21] rounded-xl border border-[#2a303c] shadow-sm group-hover:border-indigo-500/30 transition-colors">
                        {assignee ? (
                             <img src={assignee.avatar} alt={assignee.name} className="w-8 h-8 rounded-full border border-gray-600" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0b0e11] flex items-center justify-center"><UserIcon size={16} className="text-gray-500"/></div>
                        )}
                        <select 
                            value={editedTask.assigneeId}
                            disabled={!isAdminOrManager}
                            onChange={(e) => checkAvailabilityAndAssign(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <span className="text-sm font-bold text-gray-300 flex-1">{assignee ? assignee.name : 'Não atribuído'}</span>
                        <ArrowRight size={14} className="text-gray-500" />
                    </div>
                </div>
             </div>

             {/* Due Date */}
             <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Data de Entrega</label>
                <div className="flex items-center gap-3 p-3 bg-[#151a21] rounded-xl border border-[#2a303c] shadow-sm">
                    <Calendar size={18} className="text-gray-500" />
                    <input 
                        type="datetime-local"
                        readOnly={!isAdminOrManager}
                        value={formatDateTimeForInput(editedTask.dueDate)}
                        onChange={(e) => {
                            const date = new Date(e.target.value);
                            if (!isNaN(date.getTime())) {
                                handleSaveField('dueDate', date.getTime());
                            }
                        }}
                        className="flex-1 bg-transparent text-sm font-bold text-gray-300 border-none focus:ring-0 p-0"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
             </div>

             {/* Time Tracking */}
             <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Rastreamento de Tempo</label>
                <div className="p-4 bg-[#151a21] rounded-xl border border-[#2a303c] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                {timeRemaining && editedTask.accepted ? <Hourglass size={20} className="animate-pulse" /> : <Timer size={20} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-white">
                                    {timeRemaining || formatTime(editedTask.timeSpent || 0)}
                                </span>
                                {timeRemaining && (
                                    <span className="text-[10px] text-gray-400">
                                        {editedTask.accepted ? 'Tempo Restante' : 'Inicia após aceite'}
                                    </span>
                                )}
                            </div>
                         </div>
                         <span className={`text-[10px] uppercase font-bold tracking-widest ${timeRemaining && !editedTask.accepted ? 'text-amber-500' : 'text-gray-500'}`}>
                             {timeRemaining ? (editedTask.accepted ? 'ATIVO' : 'AGUARDANDO') : 'REGISTRADO'}
                         </span>
                    </div>
                    
                    {timeRemaining && editedTask.accepted && (
                        <div className="w-full bg-[#0b0e11] rounded-full h-1.5 mb-4 overflow-hidden border border-[#2a303c]">
                            {/* Simple visual progress indicator - just an animation for effect since we don't have total budget */}
                            <div className="h-full bg-indigo-500 w-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                    )}
                </div>
             </div>

             {/* Client */}
             <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Cliente</label>
                <input 
                    type="text"
                    readOnly={!isAdminOrManager}
                    value={editedTask.client}
                    onChange={(e) => handleSaveField('client', e.target.value)}
                    className="w-full p-3 bg-[#151a21] rounded-xl border border-[#2a303c] shadow-sm text-sm font-bold text-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
             </div>

             {/* Tags */}
             <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {editedTask.tags.map(tag => (
                        <span key={tag} className="bg-[#151a21] border border-[#2a303c] text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                            {tag}
                            {canEditContent && (
                                <button onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1"><X size={12}/></button>
                            )}
                        </span>
                    ))}
                </div>
                {canEditContent && (
                    <div className="flex items-center gap-2 p-3 bg-[#151a21] rounded-xl border border-[#2a303c] shadow-sm">
                        <Tag size={16} className="text-gray-500" />
                        <input 
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder="Add Tag..."
                            className="flex-1 bg-transparent text-sm font-medium border-none focus:ring-0 p-0 text-gray-300 placeholder-gray-600"
                        />
                    </div>
                )}
             </div>

             {/* Draft Actions - Create/Cancel */}
             {isDraft && onCreate && (
                 <div className="mt-auto pt-4 border-t border-[#2a303c] grid grid-cols-2 gap-3">
                     <button 
                        onClick={onClose}
                        className="py-3 text-sm font-bold text-gray-400 border border-[#2a303c] rounded-xl hover:bg-[#2a303c] hover:text-white transition-colors"
                     >
                         Cancelar
                     </button>
                     <button 
                        onClick={() => onCreate(editedTask)}
                        className="py-3 text-sm font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/20"
                     >
                         Criar
                     </button>
                 </div>
             )}

          </div>

        </div>
      </div>
    </div>
  );
};
