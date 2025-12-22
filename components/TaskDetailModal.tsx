
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MessageSquare, Send, Trash2, CheckCircle, Clock, Upload, Timer, Plus, CheckSquare, Link as LinkIcon, ChevronDown, Paperclip, User as UserIcon, Image as ImageIcon, Film, ExternalLink, Link2, Play, Pause, Target } from 'lucide-react';
import { Task, TaskPriority, User, UserRole, WorkflowStage, Subtask, SystemSettings, Attachment } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  currentUser: User;
  users: User[];
  allTasks?: Task[];
  workflow: WorkflowStage[]; 
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void | Promise<void>;
  onCreate?: (task: Task) => void | Promise<void>;
  onAddComment: (taskId: string, text: string) => void | Promise<void>;
  onDelete: (taskId: string) => void | Promise<void>;
  onAccept: (taskId: string) => void | Promise<void>;
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
  onAccept,
  settings
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('Aguardando Aceite');
  const [uploadCategory, setUploadCategory] = useState<'deliverable' | 'reference'>('deliverable');
  const [tempFinalLink, setTempFinalLink] = useState('');
  
  // Video Review State
  const [reviewingVideo, setReviewingVideo] = useState<Attachment | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setEditedTask(task);
      setTempFinalLink(task.finalLink || '');
    }
  }, [task]);

  const isDraft = task && !allTasks.find(t => t.id === task.id);
  const isAssignee = editedTask?.assigneeId === currentUser.id;
  const isAdminOrManager = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
  const isApproved = editedTask?.stage === 'approved';
  
  // Checking if we are in the "Waiting to Accept" state for the current user
  const showAcceptPrompt = !editedTask?.accepted && !isDraft && isAssignee;

  useEffect(() => {
    if (editedTask?.dueDate && editedTask.accepted && editedTask.stage !== 'approved' && editedTask.stage !== 'published') {
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
                
                setTimeRemaining(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    } else if (editedTask?.stage === 'approved' || editedTask?.stage === 'published') {
        setTimeRemaining('Concluído');
    } else {
        setTimeRemaining(isAssignee ? 'Aguardando Aceite' : 'Pendente de Início');
    }
  }, [editedTask?.dueDate, editedTask?.accepted, editedTask?.stage, isAssignee]);

  if (!isOpen || !editedTask) return null;

  const handleSaveField = (field: keyof Task, value: any) => {
    const updated = { ...editedTask, [field]: value };
    setEditedTask(updated);
    if (!isDraft) {
      onUpdate(editedTask.id, { [field]: value });
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const subtask: Subtask = { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false };
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

  const triggerUpload = (category: 'deliverable' | 'reference') => {
    setUploadCategory(category);
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isReference = uploadCategory === 'reference';
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.includes('image') ? 'image' : file.type.includes('video') ? 'video' : 'pdf',
        source: 'local',
        category: uploadCategory,
        uploadedBy: currentUser.id,
        status: isReference ? 'approved' : 'pending'
      };

      const updatedAttachments = [...(editedTask.attachments || []), newAttachment];
      
      let nextStage = editedTask.stage;
      if (!isReference && !isDraft) {
          nextStage = settings?.workflowRules.onDeliverableUpload || 'review';
      }
      
      setEditedTask(prev => prev ? { ...prev, attachments: updatedAttachments, stage: nextStage } : null);
      
      if (!isDraft) {
        onUpdate(editedTask.id, { 
            attachments: updatedAttachments, 
            stage: nextStage 
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveFinalLink = () => {
    handleSaveField('finalLink', tempFinalLink);
  };

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      if (isDraft) {
        const comment = { id: Date.now().toString(), userId: currentUser.id, text: newComment, timestamp: Date.now() };
        handleSaveField('comments', [...(editedTask.comments || []), comment]);
      } else {
        onAddComment(editedTask.id, newComment);
      }
      setNewComment('');
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseFeedback = (feedback: string) => {
    const lines = feedback.split('\n');
    return lines.map(line => {
      const match = line.match(/^\[(\d{2}:\d{2})\]\s*(.*)/);
      if (match) {
        return { time: match[1], note: match[2] };
      }
      return { time: '00:00', note: line };
    });
  };

  const jumpToTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    const seconds = parts[0] * 60 + parts[1];
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const currentStage = workflow.find(s => s.id === editedTask.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0b0e11] rounded-[40px] shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden border border-[#2a303c] relative">
        
        {/* HEADER */}
        <div className="flex items-start justify-between px-10 pt-10 pb-6 shrink-0 bg-[#0b0e11]">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
               <div className="bg-[#1a1f26] text-indigo-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                  {currentStage?.name || 'PROCESSO'}
               </div>
               <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                 <Clock size={14} className="opacity-50" /> ID: <span className="text-gray-300">#{editedTask.id.slice(-4)}</span>
               </div>
            </div>
            <input 
              type="text" 
              value={editedTask.title} 
              onChange={(e) => handleSaveField('title', e.target.value)}
              className="text-5xl font-black text-white bg-transparent border-none focus:ring-0 w-full p-0 tracking-tighter placeholder-gray-800" 
              placeholder="Título da Tarefa"
            />
          </div>
          <button onClick={onClose} className="p-3 text-gray-600 hover:text-white transition-colors bg-[#151a21] rounded-2xl border border-[#2a303c]">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0b0e11]">
          {/* AREA PRINCIPAL */}
          <div className="flex-1 p-10 pt-0 overflow-y-auto custom-scrollbar space-y-10">
            
            {showAcceptPrompt && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300 h-[400px]">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                      <Timer size={40} className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white">Você é o responsável por esta entrega</h3>
                        <p className="text-sm text-gray-500">Ao aceitar, o cronômetro de produção iniciará imediatamente.</p>
                    </div>
                    <button 
                        onClick={() => onAccept(editedTask.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all scale-105 active:scale-95 text-xs uppercase tracking-widest"
                    >
                        ACEITAR TAREFA AGORA
                    </button>
                </div>
            )}

            {isApproved && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-[32px] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                        <Link2 size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Entrega Final em Alta Qualidade</h3>
                                </div>
                                <p className="text-sm text-gray-500 max-w-lg">
                                    Este projeto foi aprovado. Insira o link do arquivo em tamanho real (Google Drive, WeTransfer, etc) para o download final.
                                </p>
                            </div>

                            {isAdminOrManager ? (
                                <div className="flex flex-col gap-3 w-full md:w-[350px]">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={tempFinalLink}
                                            onChange={(e) => setTempFinalLink(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full p-4 pr-12 bg-[#0b0e11] border border-[#2a303c] rounded-2xl text-xs text-white focus:ring-1 focus:ring-indigo-500 transition-all"
                                        />
                                        <button 
                                            onClick={handleSaveFinalLink}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase text-center">Apenas Administradores e Gestores</p>
                                </div>
                            ) : editedTask.finalLink ? (
                                <a 
                                    href={editedTask.finalLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[24px] shadow-2xl shadow-indigo-600/30 flex items-center gap-3 transition-all hover:scale-105"
                                >
                                    <ExternalLink size={20} /> BAIXAR PROJETO FINAL
                                </a>
                            ) : (
                                <div className="px-8 py-5 bg-[#151a21] border border-[#2a303c] rounded-2xl text-xs font-bold text-gray-500 flex items-center gap-2">
                                    <Clock size={16} /> AGUARDANDO LINK DO GESTOR
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-black text-white uppercase tracking-widest opacity-50">Descrição</label>
              <textarea 
                value={editedTask.description}
                onChange={(e) => handleSaveField('description', e.target.value)}
                className="w-full p-6 rounded-[32px] border border-[#2a303c] bg-[#151a21]/30 text-gray-300 focus:ring-1 focus:ring-indigo-500 resize-none h-48 placeholder-gray-800 text-lg leading-relaxed"
                placeholder="Adicione uma descrição detalhada..."
              />
            </div>
            
            <div className="space-y-4">
                <label className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest opacity-50">
                  <CheckSquare size={20} className="text-indigo-500" /> Checklist
                </label>
                <div className="space-y-3">
                    {(editedTask.subtasks || []).map(st => (
                        <div key={st.id} className="flex items-center gap-4 group bg-[#151a21]/20 p-4 rounded-2xl border border-transparent hover:border-[#2a303c] transition-all">
                            <button 
                                onClick={() => toggleSubtask(st.id)}
                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-indigo-600 border-indigo-600' : 'border-[#2a303c] bg-transparent'}`}
                            >
                                {st.completed && <CheckCircle size={14} className="text-white" />}
                            </button>
                            <span className={`text-base font-bold flex-1 ${st.completed ? 'text-gray-600 line-through' : 'text-gray-300'}`}>{st.title}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-3 p-4 bg-[#151a21]/10 rounded-2xl border border-dashed border-[#2a303c]">
                        <Plus size={18} className="text-gray-600" />
                        <input 
                            type="text" 
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                            placeholder="Adicionar novo item..." 
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-500 w-full p-0"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest opacity-50">
                      <Paperclip size={20} className="text-indigo-500" /> Entregáveis & Anexos
                    </label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => triggerUpload('reference')} 
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-500/10 border border-gray-500/20 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-500/20 transition-all"
                        >
                            <ImageIcon size={14} /> Anexar Referência
                        </button>
                        <button 
                            onClick={() => triggerUpload('deliverable')} 
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs font-black text-indigo-400 hover:bg-indigo-500/20 transition-all"
                        >
                            <Upload size={14} /> Submeter para Revisão
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editedTask.attachments?.map(att => (
                        <div 
                          key={att.id} 
                          onClick={() => {
                            if (att.type === 'video' && att.status !== 'pending') {
                              setReviewingVideo(att);
                            }
                          }}
                          className={`bg-[#151a21]/40 border border-[#2a303c] p-4 rounded-2xl flex flex-col gap-3 group transition-all ${att.type === 'video' ? 'cursor-pointer hover:border-indigo-500/50' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 truncate">
                                    {att.type === 'image' ? <ImageIcon size={18} className="text-indigo-400" /> : att.type === 'video' ? <Film size={18} className="text-indigo-400" /> : <Paperclip size={18} className="text-indigo-400" />}
                                    <div className="truncate">
                                      <p className="text-sm font-bold text-white truncate">{att.name}</p>
                                      <p className="text-[10px] text-gray-500 uppercase font-black">{att.category === 'reference' ? 'Referência' : 'Entrega'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded bg-black/40 ${att.status === 'approved' ? 'text-green-500' : att.status === 'rejected' ? 'text-red-500' : 'text-amber-500'}`}>
                                        {att.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            
                            {att.status === 'rejected' && att.feedback && (
                              <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl space-y-2">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Alterações Solicitadas</p>
                                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{att.feedback}</p>
                                {att.type === 'video' && (
                                  <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase">
                                    <Play size={10} fill="currentColor" /> Clique para ver marcações no vídeo
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-[#2a303c]">
                <label className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest opacity-50">
                  <MessageSquare size={20} className="text-indigo-500" /> Discussão
                </label>
                <div className="space-y-6">
                    {editedTask.comments?.map(c => {
                        const commenter = users.find(u => u.id === c.userId);
                        return (
                            <div key={c.id} className="flex gap-4">
                                <img src={commenter?.avatar} className="w-10 h-10 rounded-full border border-[#2a303c]" />
                                <div className="flex-1 bg-[#151a21]/50 p-5 rounded-3xl border border-[#2a303c]">
                                    <p className="text-xs font-black text-indigo-400 mb-1">{commenter?.name}</p>
                                    <p className="text-sm text-gray-300">{c.text}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-4">
                    <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Comentar..." 
                        className="w-full p-5 bg-[#151a21] border border-[#2a303c] rounded-3xl text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        rows={2}
                    />
                    <button onClick={handleCommentSubmit} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 self-end">
                        <Send size={20} />
                    </button>
                </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full md:w-[400px] p-10 space-y-10 overflow-y-auto custom-scrollbar bg-[#0b0e11] border-l border-[#2a303c]">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cronômetro de Produção</label>
                <div className={`p-8 rounded-[32px] border flex flex-col gap-2 transition-all ${editedTask.accepted ? 'bg-[#151a21] border-indigo-500/30' : 'bg-[#151a21]/30 border-[#2a303c]'}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${editedTask.accepted ? 'bg-indigo-600/20 text-indigo-400' : 'bg-gray-800 text-gray-600'}`}>
                        <Timer size={28} className={editedTask.accepted && editedTask.stage !== 'approved' ? 'animate-spin-slow' : ''} />
                      </div>
                      <div>
                          <h4 className="text-2xl font-black text-white tracking-tighter leading-tight">{timeRemaining}</h4>
                          <p className="text-[10px] font-bold text-gray-600 uppercase">
                            {editedTask.accepted ? 'Tempo Ativo' : isAssignee ? 'Pausado' : 'Aguardando Responsável'}
                          </p>
                      </div>
                    </div>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Responsável</label>
                <div className="relative group">
                    <UserIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-500 transition-colors" />
                    <select 
                        value={editedTask.assigneeId}
                        onChange={(e) => handleSaveField('assigneeId', e.target.value)}
                        className="w-full p-5 pl-14 bg-[#151a21] border border-[#2a303c] rounded-2xl text-sm font-bold text-white outline-none appearance-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data de Vencimento</label>
                <div className="relative group">
                    <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="datetime-local" 
                      value={new Date(editedTask.dueDate).toISOString().slice(0, 16)}
                      onChange={(e) => handleSaveField('dueDate', new Date(e.target.value).getTime())}
                      className="w-full p-5 pl-14 bg-[#151a21] border border-[#2a303c] rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      style={{ colorScheme: 'dark' }}
                    />
                </div>
             </div>

             <div className="mt-auto pt-10 flex gap-4">
                 <button onClick={onClose} className="flex-1 py-5 text-xs font-black text-gray-600 border border-[#2a303c] rounded-[24px] hover:bg-[#151a21] uppercase tracking-[0.2em] transition-all">Sair</button>
                 
                 {/* As per user request: hide the "Confirmar Ajustes" button if the accept prompt is shown */}
                 {!showAcceptPrompt && (
                   <button 
                      onClick={() => isDraft && onCreate ? onCreate(editedTask) : onClose()} 
                      className="flex-[2] py-5 text-xs font-black text-[#0b0e11] bg-[#22c55e] rounded-[24px] shadow-lg shadow-green-500/20 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95"
                   >
                      {isDraft ? 'Criar Projeto' : 'Confirmar Ajustes'}
                   </button>
                 )}
             </div>
          </div>
        </div>
      </div>

      {/* VIDEO REVIEW MODAL */}
      {reviewingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 overflow-hidden animate-in fade-in duration-300">
          <div className="bg-[#0b0e11] w-full max-w-[95vw] h-[90vh] rounded-[40px] border border-[#2a303c] flex flex-col md:flex-row overflow-hidden shadow-2xl">
            
            {/* Player Area */}
            <div className="flex-1 bg-black flex items-center justify-center relative border-r border-[#2a303c]">
              <button 
                onClick={() => setReviewingVideo(null)} 
                className="absolute top-8 right-8 z-50 p-3 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
              >
                <X size={24} />
              </button>
              
              <video 
                ref={videoRef}
                src={reviewingVideo.url}
                className="w-full h-full object-contain"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              />
              
              {/* Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex flex-col gap-6">
                  {/* Timeline */}
                  <div className="relative h-2 bg-white/10 rounded-full cursor-pointer overflow-visible">
                    <div 
                      className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    {reviewingVideo.feedback && parseFeedback(reviewingVideo.feedback).map((fb, idx) => {
                      const timeSecs = (fb.time.split(':').map(Number)[0] * 60) + fb.time.split(':').map(Number)[1];
                      const pct = (timeSecs / duration) * 100;
                      return (
                        <div 
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); jumpToTime(fb.time); }}
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-400 rounded-full border-2 border-[#0b0e11] cursor-pointer hover:scale-125 transition-all shadow-lg"
                          style={{ left: `${pct}%` }}
                          title={fb.note}
                        />
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => {
                          if (videoRef.current?.paused) {
                            videoRef.current.play();
                            setIsPlaying(true);
                          } else {
                            videoRef.current?.pause();
                            setIsPlaying(false);
                          }
                        }}
                        className="text-white hover:text-indigo-400 transition-colors"
                      >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                      </button>
                      <span className="text-sm font-mono text-white font-bold">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Marking List Area */}
            <div className="w-full md:w-[450px] p-10 bg-[#0b0e11] flex flex-col overflow-hidden">
               <div className="mb-10">
                  <h3 className="text-3xl font-black text-white tracking-tight mb-2">Revisão de Vídeo</h3>
                  <p className="text-sm text-gray-500 font-medium">{reviewingVideo.name}</p>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-4">Marcações de Ajuste</label>
                  {reviewingVideo.feedback ? parseFeedback(reviewingVideo.feedback).map((fb, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => jumpToTime(fb.time)}
                      className="p-5 bg-[#151a21] border border-[#2a303c] rounded-2xl hover:border-amber-500/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-[10px] font-black px-2 py-1 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20">{fb.time}</span>
                        <Target size={14} className="text-gray-600 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">{fb.note}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500 italic">Sem marcações específicas.</p>
                  )}
               </div>

               <div className="pt-10 border-t border-[#2a303c]">
                  <button 
                    onClick={() => setReviewingVideo(null)}
                    className="w-full py-5 bg-[#151a21] text-gray-400 font-black rounded-2xl border border-[#2a303c] text-xs uppercase tracking-widest hover:text-white transition-all"
                  >
                    Fechar Visualizador
                  </button>
               </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
