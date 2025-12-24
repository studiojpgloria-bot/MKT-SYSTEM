
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MessageSquare, Send, CheckCircle, Clock, Upload, Timer, Plus, CheckSquare, ChevronDown, Paperclip, User as UserIcon, Image as ImageIcon, Film, ExternalLink, Link2, Pause, Play, Target, Tag, AlertCircle, Trash2, Briefcase, Hash } from 'lucide-react';
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
  const [newTag, setNewTag] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('Pendente');
  const [uploadCategory, setUploadCategory] = useState<'deliverable' | 'reference'>('deliverable');
  const [tempFinalLink, setTempFinalLink] = useState('');
  
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

  const isDraft = !allTasks.some(t => t.id === task?.id);
  const isAssignee = editedTask?.assigneeId === currentUser.id;
  const isAdminOrManager = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
  
  const isApproved = !isDraft && (editedTask?.stage === 'approved' || editedTask?.stage === 'published');
  const showAcceptPrompt = !isDraft && !editedTask?.accepted && isAssignee;

  useEffect(() => {
    if (isDraft) {
        setTimeRemaining('Novo Projeto');
        return;
    }

    if (editedTask?.dueDate && editedTask.accepted && !isApproved) {
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
    } else if (isApproved) {
        setTimeRemaining('Concluído');
    } else {
        setTimeRemaining(isAssignee ? 'Aguardando Aceite' : 'Pendente de Início');
    }
  }, [editedTask?.dueDate, editedTask?.accepted, isApproved, isAssignee, isDraft]);

  if (!isOpen || !editedTask) return null;

  const handleSaveField = (field: keyof Task, value: any) => {
    const updated = { ...editedTask, [field]: value };
    setEditedTask(updated);
    if (!isDraft) onUpdate(editedTask.id, { [field]: value });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const subtask: Subtask = { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false };
      handleSaveField('subtasks', [...(editedTask.subtasks || []), subtask]);
      setNewSubtask('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTask.tags.includes(newTag.trim())) {
      handleSaveField('tags', [...editedTask.tags, newTag.trim()]);
      setNewTag('');
    }
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
      if (!isReference && !isDraft) nextStage = settings?.workflowRules.onDeliverableUpload || 'review';
      handleSaveField('attachments', updatedAttachments);
      if (!isDraft && nextStage !== editedTask.stage) handleSaveField('stage', nextStage);
    }
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
      if (match) return { time: match[1], note: match[2] };
      return { time: '00:00', note: line };
    });
  };

  const jumpToTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    const seconds = parts[0] * 60 + parts[1];
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      if (!isPlaying) { videoRef.current.play(); setIsPlaying(true); }
    }
  };

  const currentStage = workflow.find(s => s.id === editedTask.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md p-4 overflow-y-auto transition-all">
      <div className="bg-white dark:bg-[#0b0e11] rounded-[40px] shadow-2xl w-full max-w-7xl min-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-[#2a303c] relative transition-colors duration-300">
        
        {/* HEADER */}
        <div className="flex items-start justify-between px-10 pt-10 pb-6 shrink-0 border-b border-slate-100 dark:border-[#1e232d]">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
               <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                  {isDraft ? 'DRAFT: NOVA TAREFA' : (currentStage?.name || 'PROCESSO')}
               </div>
               <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                 <Clock size={14} className="opacity-50" /> ID: <span className="text-slate-700 dark:text-gray-300">#{isDraft ? 'TEMPORÁRIO' : editedTask.id.slice(-4)}</span>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest block px-1">Cliente</label>
                  <input 
                    type="text" 
                    value={editedTask.client}
                    onChange={(e) => handleSaveField('client', e.target.value)}
                    placeholder="Nome da Empresa/Cliente"
                    className="w-full bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl p-4 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest block px-1">Título do Projeto</label>
                  <input 
                    type="text" 
                    value={editedTask.title} 
                    onChange={(e) => handleSaveField('title', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl p-4 text-sm font-black text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                    placeholder="Ex: Campanha de Lançamento"
                  />
               </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#151a21] rounded-2xl border border-slate-200 dark:border-[#2a303c] ml-10">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#0b0e11] transition-colors">
          {/* ÁREA PRINCIPAL */}
          <div className="flex-1 p-10 pt-6 overflow-y-auto custom-scrollbar space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={16} /> Tipo de Entrega
                  </label>
                  <select 
                    value={editedTask.projectType || 'social-media'} 
                    onChange={(e) => handleSaveField('projectType', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none appearance-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="social-media">Social Media (Post/Story)</option>
                    <option value="video">Edição de Vídeo</option>
                    <option value="design">Design Gráfico / Identidade</option>
                    <option value="ads">Tráfego Pago / Anúncios</option>
                    <option value="strategy">Estratégia / Briefing</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={16} /> Horas Estimadas
                  </label>
                  <input 
                    type="number" 
                    value={editedTask.estimatedHours || 0}
                    onChange={(e) => handleSaveField('estimatedHours', parseInt(e.target.value))}
                    className="w-full p-4 bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="0"
                  />
                </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">Descrição Detalhada / Briefing</label>
              <textarea 
                value={editedTask.description}
                onChange={(e) => handleSaveField('description', e.target.value)}
                className="w-full p-6 rounded-[32px] border border-slate-200 dark:border-[#2a303c] bg-slate-50/50 dark:bg-[#151a21]/30 text-slate-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 resize-none h-48 placeholder-slate-300 dark:placeholder-gray-800 transition-colors text-lg leading-relaxed"
                placeholder="Detalhe os requisitos técnicos, referências visuais e objetivos deste projeto..."
              />
            </div>
            
            <div className="space-y-4">
                <label className="text-sm font-black text-slate-500 dark:text-gray-400 flex items-center gap-3 uppercase tracking-widest">
                  <CheckSquare size={20} className="text-indigo-600 dark:text-indigo-500" /> Checklist de Atividades
                </label>
                <div className="space-y-3">
                    {(editedTask.subtasks || []).map(st => (
                        <div key={st.id} className="flex items-center gap-4 bg-slate-50/50 dark:bg-[#151a21]/20 p-4 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-[#2a303c] transition-all group">
                            <button onClick={() => handleSaveField('subtasks', editedTask.subtasks.map(s => s.id === st.id ? {...s, completed: !s.completed} : s))} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-[#2a303c] bg-transparent'}`}>{st.completed && <CheckCircle size={14} className="text-white" />}</button>
                            <span className={`text-base font-bold flex-1 ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-gray-300'}`}>{st.title}</span>
                            <button onClick={() => handleSaveField('subtasks', editedTask.subtasks.filter(s => s.id !== st.id))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"><X size={16} /></button>
                        </div>
                    ))}
                    <div className="relative">
                      <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} placeholder="Adicionar nova atividade ao checklist..." className="w-full bg-transparent border-dashed border-2 border-slate-200 dark:border-[#2a303c] rounded-2xl p-5 text-sm font-bold text-slate-500 focus:border-indigo-500 transition-all outline-none" />
                      <button onClick={handleAddSubtask} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl shadow-lg"><Plus size={20}/></button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-500 dark:text-gray-400 flex items-center gap-3 uppercase tracking-widest">Anexos & Revisão</label>
                    <div className="flex gap-2">
                        <button onClick={() => { setUploadCategory('reference'); fileInputRef.current?.click(); }} className="px-5 py-2.5 bg-slate-100 dark:bg-[#1e232d] text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-[#2a303c] transition-all hover:bg-slate-200">Adicionar Referência</button>
                        <button onClick={() => { setUploadCategory('deliverable'); fileInputRef.current?.click(); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-indigo-700">+ Enviar Entregável</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editedTask.attachments?.map(att => (
                        <div key={att.id} onClick={() => att.type === 'video' && setReviewingVideo(att)} className={`bg-slate-50/50 dark:bg-[#151a21]/40 border border-slate-200 dark:border-[#2a303c] p-4 rounded-3xl flex flex-col gap-3 group transition-all relative ${att.type === 'video' ? 'cursor-pointer hover:border-indigo-500' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                    {att.type === 'image' ? <ImageIcon size={24}/> : att.type === 'video' ? <Film size={24}/> : <Paperclip size={24}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{att.name}</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-black">{att.category === 'deliverable' ? 'Entrega Final' : 'Arquivo de Apoio'}</p>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${att.status === 'approved' ? 'bg-green-500/10 text-green-500' : att.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>{att.status.toUpperCase()}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleSaveField('attachments', editedTask.attachments.filter(a => a.id !== att.id)); }} className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"><Trash2 size={14}/></button>
                        </div>
                    ))}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-[#2a303c]">
                <label className="text-sm font-black text-slate-500 dark:text-gray-400 flex items-center gap-3 uppercase tracking-widest">Discussão do Time</label>
                <div className="space-y-6">
                    {editedTask.comments?.map(c => {
                        const commenter = users.find(u => u.id === c.userId);
                        return (
                            <div key={c.id} className="flex gap-4">
                                <img src={commenter?.avatar} className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#2a303c] bg-white dark:bg-[#151a21]" />
                                <div className="flex-1 bg-slate-50/50 dark:bg-[#151a21]/50 p-5 rounded-3xl border border-slate-200 dark:border-[#2a303c]">
                                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-1">{commenter?.name}</p>
                                    <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">{c.text}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-4 items-start">
                    <img src={currentUser.avatar} className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#2a303c]" />
                    <div className="flex-1 relative">
                        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escreva sua observação técnica ou feedback..." className="w-full p-5 pr-14 bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-3xl text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-colors" rows={3} />
                        <button onClick={handleCommentSubmit} className="absolute right-3 bottom-3 p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg transition-all active:scale-95"><Send size={20} /></button>
                    </div>
                </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full md:w-[420px] p-10 space-y-8 bg-slate-50 dark:bg-[#0b0e11] border-l border-slate-200 dark:border-[#2a303c] transition-colors duration-300 overflow-y-auto custom-scrollbar">
             
             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cronômetro de Produção</label>
                <div className={`p-8 rounded-[32px] border transition-all ${!isDraft ? 'bg-white dark:bg-[#151a21] border-indigo-500/30 shadow-sm' : 'bg-slate-200/20 dark:bg-white/5 border-slate-200 dark:border-[#2a303c]'}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${!isDraft ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-gray-800 text-slate-400'}`}>
                        <Timer size={28} className={editedTask.accepted && !isApproved && !isDraft ? 'animate-spin-slow' : ''} />
                      </div>
                      <div>
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{timeRemaining}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{isDraft ? 'AGUARDANDO CRIAÇÃO' : 'TEMPO ATUAL EM PRODUÇÃO'}</p>
                      </div>
                    </div>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Etapa do Workflow</label>
                <div className="relative">
                    <select value={editedTask.stage} onChange={(e) => handleSaveField('stage', e.target.value)} className="w-full p-5 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none appearance-none focus:ring-1 focus:ring-indigo-500">
                        {workflow.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prioridade do Job</label>
                <div className="relative">
                    <select value={editedTask.priority} onChange={(e) => handleSaveField('priority', e.target.value as TaskPriority)} className="w-full p-5 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-black text-slate-900 dark:text-white outline-none appearance-none focus:ring-1 focus:ring-indigo-500">
                        {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Membro Responsável</label>
                <div className="relative">
                    <UserIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={editedTask.assigneeId} onChange={(e) => handleSaveField('assigneeId', e.target.value)} className="w-full p-5 pl-14 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none appearance-none focus:ring-1 focus:ring-indigo-500">
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data Limite de Entrega</label>
                <div className="relative">
                    <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="datetime-local" value={new Date(editedTask.dueDate).toISOString().slice(0, 16)} onChange={(e) => handleSaveField('dueDate', new Date(e.target.value).getTime())} className="w-full p-5 pl-14 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tags de Identificação</label>
                <div className="flex flex-wrap gap-2">
                    {editedTask.tags.map(t => (
                        <span key={t} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-indigo-500/20 shadow-sm">
                            {t} <button onClick={() => handleSaveField('tags', editedTask.tags.filter(tag => tag !== t))}><X size={12}/></button>
                        </span>
                    ))}
                </div>
                <div className="relative">
                  <Tag size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="Ex: Criativo, Urgente..." className="w-full p-4 pl-12 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
             </div>

             <div className="mt-auto pt-10 flex flex-col gap-3">
                 <button onClick={onClose} className="w-full py-5 text-xs font-black text-slate-400 dark:text-gray-600 border border-slate-200 dark:border-[#2a303c] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 uppercase tracking-widest transition-all">Sair sem salvar</button>
                 {isDraft && onCreate && (
                   <button onClick={() => onCreate(editedTask)} className="w-full py-6 text-xs font-black text-white bg-green-600 rounded-3xl shadow-xl shadow-green-500/20 uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">FINALIZAR E CRIAR JOB</button>
                 )}
                 {!isDraft && (
                    <button onClick={onClose} className="w-full py-6 text-xs font-black text-white bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/20 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95">CONFIRMAR ALTERAÇÕES</button>
                 )}
                 {!isDraft && isAdminOrManager && (
                    <button onClick={() => { if(confirm('Tem certeza que deseja excluir esta tarefa permanentemente?')) onDelete(editedTask.id) }} className="w-full py-4 text-[10px] font-black text-red-500 hover:bg-red-500/10 rounded-2xl transition-all uppercase tracking-widest">Excluir Job</button>
                 )}
             </div>
          </div>
        </div>
      </div>

      {/* VIDEO REVIEW MODAL */}
      {reviewingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 overflow-hidden animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0b0e11] w-full max-w-[95vw] h-[90vh] rounded-[40px] border border-slate-200 dark:border-[#2a303c] flex flex-col md:flex-row overflow-hidden shadow-2xl">
            <div className="flex-1 bg-black flex items-center justify-center relative border-r border-slate-200 dark:border-[#2a303c]">
              <button onClick={() => setReviewingVideo(null)} className="absolute top-8 right-8 z-50 p-3 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-colors border border-white/10"><X size={24} /></button>
              <video ref={videoRef} src={reviewingVideo.url} className="w-full h-full object-contain" onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} />
              <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex flex-col gap-6">
                  <div className="relative h-2 bg-white/10 rounded-full cursor-pointer overflow-visible">
                    <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
                    {reviewingVideo.feedback && parseFeedback(reviewingVideo.feedback).map((fb, idx) => {
                      const timeSecs = (fb.time.split(':').map(Number)[0] * 60) + fb.time.split(':').map(Number)[1];
                      const pct = (timeSecs / duration) * 100;
                      return <div key={idx} onClick={(e) => { e.stopPropagation(); jumpToTime(fb.time); }} className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-400 rounded-full border-2 border-[#0b0e11] cursor-pointer hover:scale-125 transition-all shadow-lg" style={{ left: `${pct}%` }} title={fb.note} />;
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button onClick={() => { if (videoRef.current?.paused) { videoRef.current.play(); setIsPlaying(true); } else { videoRef.current?.pause(); setIsPlaying(false); } }} className="text-white hover:text-indigo-400 transition-colors">
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                      </button>
                      <span className="text-sm font-mono text-white font-bold">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-[450px] p-10 bg-white dark:bg-[#0b0e11] flex flex-col overflow-hidden transition-colors">
               <div className="mb-10">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Revisão Técnica</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 font-medium truncate">{reviewingVideo.name}</p>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest block mb-4">Marcações de Ajuste</label>
                  {reviewingVideo.feedback ? parseFeedback(reviewingVideo.feedback).map((fb, idx) => (
                    <div key={idx} onClick={() => jumpToTime(fb.time)} className="p-5 bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl hover:border-amber-500/50 cursor-pointer transition-all group">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-[10px] font-black px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-50 rounded border border-amber-500/20">{fb.time}</span>
                        <Target size={14} className="text-slate-400 dark:text-gray-600 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed font-medium">{fb.note}</p>
                    </div>
                  )) : <p className="text-sm text-gray-500 italic">Sem notas específicas registradas.</p>}
               </div>
               <div className="pt-10 border-t border-slate-200 dark:border-[#2a303c]">
                  <button onClick={() => setReviewingVideo(null)} className="w-full py-5 bg-slate-100 dark:bg-[#151a21] text-slate-500 dark:text-gray-400 font-black rounded-2xl border border-slate-200 dark:border-[#2a303c] text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all">Fechar Visualizador</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <style>{` .animate-spin-slow { animation: spin 8s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
    </div>
  );
};
