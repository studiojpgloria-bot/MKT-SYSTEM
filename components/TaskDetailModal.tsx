
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar, Send, CheckCircle, Clock, Timer, Plus, CheckSquare, ChevronDown, User as UserIcon, ImageIcon, Film, Paperclip, Target, Tag, Briefcase, Hash, Trash2, Eye, Download, Play, Pause, FileText, Loader2 } from 'lucide-react';
import { Task, TaskPriority, User, UserRole, WorkflowStage, Subtask, SystemSettings, Attachment } from '../types';
import { supabase } from '../supabase';

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
  const [isTimeLow, setIsTimeLow] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<'deliverable' | 'reference'>('deliverable');
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) setEditedTask(task);
  }, [task]);

  const isDraft = !allTasks.some(t => t.id === task?.id);
  const isAssignee = editedTask?.assigneeId === currentUser.id;
  const isAdminOrManager = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
  const isApproved = !isDraft && (editedTask?.stage === 'approved' || editedTask?.stage === 'published');

  const creationDate = useMemo(() => {
    if (!editedTask) return null;
    const parts = editedTask.id.split('-');
    const ts = parseInt(parts[1] || parts[0]);
    if (isNaN(ts)) return new Date().toLocaleDateString('pt-BR');
    return new Date(ts).toLocaleDateString('pt-BR');
  }, [editedTask?.id]);

  useEffect(() => {
    if (isDraft) { setTimeRemaining('Novo Projeto'); setIsTimeLow(false); return; }
    if (editedTask?.dueDate && editedTask.accepted && !isApproved) {
        const updateTimer = () => {
            const diff = editedTask.dueDate - Date.now();
            if (diff <= 0) { 
                setTimeRemaining('Atrasado'); 
                setIsTimeLow(true);
            } 
            else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeRemaining(`${h}h ${m}m`);
                setIsTimeLow(h < 1);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    } else if (isApproved) { 
        setTimeRemaining('Concluído'); 
        setIsTimeLow(false);
    }
    else { 
        setTimeRemaining(isAssignee ? 'Aguardando Aceite' : 'Pendente'); 
        setIsTimeLow(false);
    }
  }, [editedTask?.dueDate, editedTask?.accepted, isApproved, isAssignee, isDraft]);

  if (!isOpen || !editedTask) return null;

  const handleSaveField = (field: keyof Task, value: any) => {
    const updated = { ...editedTask, [field]: value };
    setEditedTask(updated);
    if (!isDraft) onUpdate(editedTask.id, { [field]: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `tasks/${editedTask.id}/${fileName}`;

      // Upload para o Bucket 'attachments' (deve ser criado no Supabase)
      const { data, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const isRef = uploadCategory === 'reference';
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        url: publicUrl,
        type: file.type.includes('image') ? 'image' : file.type.includes('video') ? 'video' : 'pdf',
        source: 'local',
        category: uploadCategory,
        uploadedBy: currentUser.id,
        status: isRef ? 'approved' : 'pending'
      };

      const updatedAttachments = [...(editedTask.attachments || []), newAttachment];
      let nextStage = editedTask.stage;
      if (!isRef && !isDraft) nextStage = settings?.workflowRules.onDeliverableUpload || 'review';
      
      handleSaveField('attachments', updatedAttachments);
      if (!isDraft && nextStage !== editedTask.stage) handleSaveField('stage', nextStage);
      
    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (file: Attachment) => {
    window.open(file.url, '_blank');
  };

  const currentStage = workflow.find(s => s.id === editedTask.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 dark:bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0b0e11] rounded-[32px] shadow-2xl w-full max-w-6xl h-fit max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 dark:border-[#2a303c] transition-all duration-300">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-[#1e232d] shrink-0">
          <div className="flex items-center gap-4">
             <div className="bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {isDraft ? 'DRAFT' : (currentStage?.name || 'TAREFA')}
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {isDraft ? 'Novo Card' : editedTask.title}
                </h2>
                {!isDraft && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocolo: #{editedTask.id.slice(-6).toUpperCase()}</p>
                    <span className="text-gray-300">|</span>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Criado em: {creationDate}</p>
                  </div>
                )}
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* COLUNA PRINCIPAL - ESQUERDA */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8 bg-white dark:bg-[#0b0e11]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest block px-1">Cliente</label>
                  <input 
                    type="text" 
                    value={editedTask.client} 
                    onChange={(e) => handleSaveField('client', e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl p-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                    placeholder="Nome do cliente"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest block px-1">Título</label>
                  <input 
                    type="text" 
                    value={editedTask.title} 
                    onChange={(e) => handleSaveField('title', e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                    placeholder="O que será entregue?" 
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Briefcase size={14}/> Tipo de Entrega
                  </label>
                  <div className="relative">
                    <select 
                      value={editedTask.projectType} 
                      onChange={(e) => handleSaveField('projectType', e.target.value)} 
                      className="w-full p-4 bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-bold text-slate-700 dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {settings?.deliveryTypes?.map(dt => (
                        <option key={dt.id} value={dt.id}>{dt.name}</option>
                      )) || (
                        <>
                          <option value="social-media">Social Media (Post/Story)</option>
                          <option value="video">Edição de Vídeo</option>
                          <option value="design">Design Gráfico</option>
                          <option value="ads">Anúncios / Tráfego</option>
                          <option value="copy">Redação / Copy</option>
                        </>
                      )}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest block px-1">Descrição Detalhada / Briefing</label>
              <textarea 
                value={editedTask.description} 
                onChange={(e) => handleSaveField('description', e.target.value)} 
                className="w-full p-6 rounded-[24px] border border-slate-200 dark:border-[#2a303c] bg-slate-50/50 dark:bg-[#151a21]/30 text-sm text-slate-700 dark:text-gray-300 resize-none h-40 focus:ring-2 focus:ring-indigo-500/20 outline-none leading-relaxed transition-all" 
                placeholder="Detalhe os requisitos técnicos e criativos desta tarefa..." 
              />
            </div>
            
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400"/> Checklist de Atividades
                </label>
                <div className="space-y-2">
                    {(editedTask.subtasks || []).map(st => (
                        <div key={st.id} className="flex items-center gap-3 bg-slate-50 dark:bg-[#151a21]/40 p-3 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-[#2a303c] transition-all group">
                            <button 
                              onClick={() => handleSaveField('subtasks', editedTask.subtasks.map(s => s.id === st.id ? {...s, completed: !s.completed} : s))} 
                              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-[#2a303c]'}`}
                            >
                              {st.completed && <CheckCircle size={12} className="text-white" />}
                            </button>
                            <span className={`text-sm font-semibold flex-1 ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-gray-300'}`}>
                              {st.title}
                            </span>
                            <button 
                              onClick={() => handleSaveField('subtasks', editedTask.subtasks.filter(s => s.id !== st.id))} 
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newSubtask} 
                        onChange={(e) => setNewSubtask(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && (newSubtask.trim() && (handleSaveField('subtasks', [...(editedTask.subtasks || []), { id: Date.now().toString(), title: newSubtask, completed: false }]), setNewSubtask('')))} 
                        placeholder="Adicionar nova atividade ao checklist..." 
                        className="w-full bg-transparent border-dashed border-2 border-slate-200 dark:border-[#2a303c] rounded-2xl p-4 text-sm font-medium text-slate-500 focus:border-indigo-500 focus:text-slate-900 dark:focus:text-white transition-all outline-none" 
                      />
                      <button 
                        onClick={() => (newSubtask.trim() && (handleSaveField('subtasks', [...(editedTask.subtasks || []), { id: Date.now().toString(), title: newSubtask, completed: false }]), setNewSubtask('')))} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all"
                      >
                        <Plus size={20}/>
                      </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-[#1e232d]">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest px-1">Anexos & Referências</label>
                    <div className="flex gap-3">
                        <button 
                          onClick={() => { setUploadCategory('reference'); fileInputRef.current?.click(); }} 
                          disabled={isUploading}
                          className="px-4 py-2 bg-slate-100 dark:bg-[#1e232d] text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-[#2a303c] hover:bg-slate-200 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                          {isUploading && uploadCategory === 'reference' ? <Loader2 className="animate-spin" size={14} /> : '+ REF'}
                        </button>
                        <button 
                          onClick={() => { setUploadCategory('deliverable'); fileInputRef.current?.click(); }} 
                          disabled={isUploading}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                          {isUploading && uploadCategory === 'deliverable' ? <Loader2 className="animate-spin" size={14} /> : '+ ENTREGÁVEL'}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {editedTask.attachments?.map(att => (
                        <div key={att.id} className="bg-slate-50 dark:bg-[#151a21]/60 border border-slate-200 dark:border-[#2a303c] p-3 rounded-2xl flex items-center gap-3 group relative transition-all hover:shadow-md">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                {att.type === 'image' ? <ImageIcon size={20}/> : att.type === 'video' ? <Film size={20}/> : <Paperclip size={20}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{att.name}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{att.category === 'deliverable' ? 'Entrega' : 'Referência'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => setPreviewFile(att)} 
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-all"
                                  title="Visualizar"
                                >
                                  <Eye size={14}/>
                                </button>
                                <button 
                                  onClick={() => handleSaveField('attachments', editedTask.attachments.filter(a => a.id !== att.id))} 
                                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white dark:hover:bg-white/5 transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    ))}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
            </div>
          </div>

          {/* COLUNA LATERAL - DIREITA (DADOS & STATUS) */}
          <div className="w-full md:w-80 p-8 bg-slate-50 dark:bg-[#0b0e11] border-l border-slate-100 dark:border-[#2a303c] space-y-8 overflow-y-auto custom-scrollbar">
             
             {/* ACEITAR TAREFA */}
             {!editedTask.accepted && !isDraft && (isAssignee || isAdminOrManager) && (
                <div className="space-y-3 animate-in slide-in-from-top duration-500">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Ação Requerida</label>
                  <button 
                    onClick={() => {
                      const nextStage = settings?.workflowRules.onAccept || editedTask.stage;
                      setEditedTask(prev => prev ? { ...prev, accepted: true, stage: nextStage } : null);
                      onAccept(editedTask.id);
                    }}
                    className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/30 text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} /> ACEITAR TAREFA
                  </button>
                  <p className="text-[9px] text-center text-gray-500 font-bold">Ao aceitar, o cronômetro será iniciado automaticamente.</p>
                </div>
             )}

             {/* CARD DE STATUS */}
             <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Cronômetro de Produção</label>
                <div className={`bg-white dark:bg-[#151a21] p-6 rounded-[28px] border ${isTimeLow ? 'border-red-500 shadow-red-500/10' : 'border-slate-200 dark:border-[#2a303c]'} shadow-sm relative overflow-hidden group transition-colors duration-500`}>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl ${isTimeLow ? 'bg-red-500/10 text-red-500' : 'bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'} flex items-center justify-center transition-colors duration-500`}>
                        <Timer size={28} className={editedTask.accepted && !isApproved && !isDraft ? 'animate-pulse' : ''} />
                      </div>
                      <div>
                          <h4 className={`text-xl font-black ${isTimeLow ? 'text-red-500' : 'text-slate-900 dark:text-white'} tracking-tighter leading-none transition-colors duration-500`}>{timeRemaining}</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Status Atual</p>
                      </div>
                    </div>
                </div>
             </div>

             {/* DATA LIMITE DE ENTREGA */}
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Data Limite de Entrega</label>
                <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="datetime-local" 
                        value={new Date(editedTask.dueDate).toISOString().slice(0, 16)} 
                        onChange={(e) => handleSaveField('dueDate', new Date(e.target.value).getTime())} 
                        className="w-full p-4 pl-12 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    />
                </div>
             </div>

             {/* DADOS TÉCNICOS */}
             <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Etapa do Workflow</label>
                    <div className="relative">
                        <select 
                            value={editedTask.stage} 
                            onChange={(e) => handleSaveField('stage', e.target.value)} 
                            className="w-full p-4 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-[11px] font-black text-slate-900 dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            {workflow.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Prioridade do Job</label>
                    <div className="relative">
                        <select 
                            value={editedTask.priority} 
                            onChange={(e) => handleSaveField('priority', e.target.value)} 
                            className="w-full p-4 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-[11px] font-black text-slate-900 dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Membro Responsável</label>
                    <div className="relative">
                        <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select 
                            value={editedTask.assigneeId} 
                            onChange={(e) => handleSaveField('assigneeId', e.target.value)} 
                            className="w-full p-4 pl-12 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Tags de Identificação</label>
                    <div className="flex flex-wrap gap-2">
                        {editedTask.tags.map(t => (
                            <span key={t} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-2">
                                {t} <button onClick={() => handleSaveField('tags', editedTask.tags.filter(tag => tag !== t))} className="hover:text-red-500"><X size={12}/></button>
                            </span>
                        ))}
                    </div>
                    <div className="relative">
                      <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={newTag} 
                        onChange={(e) => setNewTag(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && (newTag.trim() && !editedTask.tags.includes(newTag.trim()) && (handleSaveField('tags', [...editedTask.tags, newTag.trim()]), setNewTag('')))} 
                        placeholder="Adicionar tag..." 
                        className="w-full p-4 pl-12 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                      />
                    </div>
                </div>
             </div>

             {/* BOTÕES DE AÇÃO */}
             <div className="pt-8 flex flex-col gap-3">
                 {isDraft && onCreate ? (
                   <button 
                     onClick={() => onCreate(editedTask)} 
                     className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/20 text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-95"
                   >
                     CRIAR CARD
                   </button>
                 ) : (
                    <button 
                      onClick={onClose} 
                      className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-600/20 text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-95"
                    >
                      SALVAR ALTERAÇÕES
                    </button>
                 )}
                 <button 
                    onClick={onClose} 
                    className="w-full py-4 text-[10px] font-black text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-all"
                  >
                    CANCELAR
                 </button>
                 {!isDraft && isAdminOrManager && (
                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-[#2a303c]">
                        <button 
                          onClick={() => { if(confirm('Excluir este card permanentemente?')) onDelete(editedTask.id) }} 
                          className="w-full py-2 text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-[0.1em] transition-all"
                        >
                          Remover Card Permanentemente
                        </button>
                    </div>
                 )}
             </div>
          </div>
        </div>
      </div>

      {/* VISUALIZADOR DE ARQUIVO */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#0b0e11] rounded-[40px] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#151a21]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                            {previewFile.type === 'image' ? <ImageIcon size={20}/> : previewFile.type === 'video' ? <Film size={20}/> : <Paperclip size={20}/>}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{previewFile.name}</h4>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{previewFile.category}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleDownload(previewFile)} className="p-3 bg-white dark:bg-[#1e232d] text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-2xl transition-all border border-gray-200 dark:border-white/5">
                            <Download size={20} />
                        </button>
                        <button onClick={() => setPreviewFile(null)} className="p-3 bg-white dark:bg-[#1e232d] text-gray-500 hover:text-red-500 rounded-2xl transition-all border border-gray-200 dark:border-white/5">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex items-center justify-center p-8">
                    {previewFile.type === 'image' ? (
                        <img src={previewFile.url} className="max-w-full max-h-full object-contain shadow-2xl rounded-xl" alt="Preview" />
                    ) : previewFile.type === 'video' ? (
                        <video controls className="max-w-full max-h-full rounded-xl shadow-2xl" src={previewFile.url} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-[#151a21] rounded-3xl flex items-center justify-center text-gray-300">
                                <FileText size={48} />
                            </div>
                            <p className="font-bold text-center">Este tipo de arquivo não suporta pré-visualização direta.<br/><span className="text-sm font-medium opacity-70">Use o botão de download para visualizar em seu dispositivo.</span></p>
                            <button onClick={() => handleDownload(previewFile)} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Baixar Arquivo</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
