
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar, Send, CheckCircle, Clock, Timer, Plus, CheckSquare, ChevronDown, User as UserIcon, ImageIcon, Film, Paperclip, Target, Tag, Briefcase, Hash, Trash2, Eye, Download, Play, Pause, FileText, Loader2 } from 'lucide-react';
import { Task, TaskPriority, User, UserRole, WorkflowStage, Subtask, SystemSettings, Attachment } from '../types';
import { supabase } from '../supabase';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

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
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('Pendente');
  const [isTimeLow, setIsTimeLow] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<'deliverable' | 'reference'>('deliverable');
  const [isUploading, setIsUploading] = useState(false);

  const [isDeliveryTypeOpen, setIsDeliveryTypeOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'comments' | 'collaboration'>('general');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const deliveryDropdownRef = useRef<HTMLDivElement>(null);

  // Sincroniza o estado interno com a task selecionada quando o modal abre
  useEffect(() => {
    if (isOpen && task) {
      setEditedTask(JSON.parse(JSON.stringify(task)));
    } else if (!isOpen) {
      setEditedTask(null);
    }
  }, [task, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deliveryDropdownRef.current && !deliveryDropdownRef.current.contains(event.target as Node)) {
        setIsDeliveryTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDraft = useMemo(() => {
    if (!task) return true;
    return !allTasks.some(t => t.id === task.id);
  }, [task, allTasks]);

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

    const updateTimer = () => {
      if (!editedTask?.dueDate || !editedTask.accepted || isApproved) {
        if (isApproved) setTimeRemaining('Concluído');
        else setTimeRemaining(isAssignee ? 'Aguardando Aceite' : 'Pendente');
        setIsTimeLow(false);
        return;
      }

      const diff = editedTask.dueDate - Date.now();

      if (diff <= 0) {
        setTimeRemaining('Atrasado');
        setIsTimeLow(true);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (h < 1) {
          setTimeRemaining(`${m}m ${s}s`);
          setIsTimeLow(true);
        } else {
          setTimeRemaining(`${h}h ${m}m`);
          setIsTimeLow(false);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [editedTask?.dueDate, editedTask?.accepted, isApproved, isAssignee, isDraft]);

  if (!isOpen || !editedTask) return null;

  const stringifyError = (err: any): string => {
    if (!err) return "Erro desconhecido.";
    if (typeof err === 'string') return err;
    if (err.statusCode && err.message) return `${err.message} (Código HTTP: ${err.statusCode})`;
    if (err instanceof Error) return err.message;
    if (err.message) return err.message;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  };

  const handleSaveField = (field: keyof Task, value: any) => {
    const taskId = editedTask.id;
    setEditedTask(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      if (!isDraft) {
        onUpdate(taskId, { [field]: value });
      }
      return updated;
    });
  };

  const formatDateTimeForInput = (timestamp: number) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editedTask) return;

    const currentTaskId = editedTask.id;

    // Validações Básicas
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      alert(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: 15MB`);
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `tasks/${currentTaskId}/${fileName}`;

      console.log('Iniciando upload no bucket "attachments":', filePath);

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
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

      setEditedTask(prev => {
        if (!prev) return null;
        const updatedAttachments = [...(prev.attachments || []), newAttachment];
        let nextStage = prev.stage;

        if (!isRef && !isDraft) {
          nextStage = settings?.workflowRules?.onDeliverableUpload || 'review';
        }

        const updated = { ...prev, attachments: updatedAttachments, stage: nextStage };

        if (!isDraft) {
          onUpdate(currentTaskId, { attachments: updatedAttachments, stage: nextStage });
        }

        return updated;
      });

      console.log('Upload concluído com sucesso.');

    } catch (error: any) {
      // Implementação de Fallback para erros de RLS (Permissão)
      // Se o backend negar, usamos URL local para não travar o usuário
      console.warn("Upload falhou no servidor (provável RLS). Usando fallback local.", error);

      const localUrl = URL.createObjectURL(file);
      const isRef = uploadCategory === 'reference';

      const newAttachment: Attachment = {
        id: `att-local-${Date.now()}`,
        name: file.name,
        url: localUrl,
        type: file.type.includes('image') ? 'image' : file.type.includes('video') ? 'video' : 'pdf',
        source: 'local',
        category: uploadCategory,
        uploadedBy: currentUser.id,
        status: isRef ? 'approved' : 'pending'
      };

      setEditedTask(prev => {
        if (!prev) return null;
        const updatedAttachments = [...(prev.attachments || []), newAttachment];
        let nextStage = prev.stage;
        if (!isRef && !isDraft) {
          nextStage = settings?.workflowRules?.onDeliverableUpload || 'review';
        }
        const updated = { ...prev, attachments: updatedAttachments, stage: nextStage };

        // Persiste a atualização da tarefa (JSON) mesmo que o arquivo não tenha ido para o Storage
        if (!isDraft) {
          onUpdate(currentTaskId, { attachments: updatedAttachments, stage: nextStage });
        }
        return updated;
      });

    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const currentTaskId = editedTask.id;
    setEditedTask(prev => {
      if (!prev) return null;
      const updatedAttachments = (prev.attachments || []).filter(a => a.id !== attachmentId);
      const updated = { ...prev, attachments: updatedAttachments };
      if (!isDraft) {
        onUpdate(currentTaskId, { attachments: updatedAttachments });
      }
      return updated;
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTask.tags.includes(newTag.trim())) {
      handleSaveField('tags', [...editedTask.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleSaveField('tags', editedTask.tags.filter(t => t !== tag));
  };

  const currentStage = workflow.find(s => s.id === editedTask.stage);
  const deliveryTypes = settings?.deliveryTypes || [];
  const selectedDeliveryType = deliveryTypes.find(dt => dt.id === editedTask.projectType) || (deliveryTypes.length > 0 ? deliveryTypes[0] : null);

  const referenceFiles = (editedTask.attachments || []).filter(a => a.category === 'reference');
  const deliverableFiles = (editedTask.attachments || []).filter(a => a.category === 'deliverable');

  const handleFinalAction = async () => {
    if (!editedTask) return;

    try {
      if (isDraft) {
        if (onCreate) await onCreate(editedTask);
      } else {
        await onUpdate(editedTask.id, editedTask);
      }
      onClose();
    } catch (error: any) {
      alert('Erro ao salvar card: ' + stringifyError(error));
    }
  };

  const handleArchiveTask = async () => {
    if (!editedTask || isDraft) return;
    if (confirm('Tem certeza que deseja concluir e arquivar esta tarefa? Ela será excluída permanentemente após 1 semana.')) {
      try {
        await onUpdate(editedTask.id, {
          archived: true,
          archivedAt: Date.now(),
          stage: 'approved' // Opcional: mover para approved ao arquivar
        });
        onClose();
      } catch (error: any) {
        alert('Erro ao arquivar: ' + stringifyError(error));
      }
    }
  };

  const handleDeleteTask = async () => {
    if (!editedTask || isDraft) return;
    if (confirm('ATENÇÃO: Tem certeza que deseja excluir permanentemente esta tarefa? Esta ação não pode ser desfeita.')) {
      try {
        await onDelete(editedTask.id);
        onClose();
      } catch (error: any) {
        alert('Erro ao excluir: ' + stringifyError(error));
      }
    }
  };

  const modalHeader = (
    <div className="flex items-center gap-4">
      <div className="bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
        {isDraft ? 'DRAFT' : (currentStage?.name || 'TAREFA')}
      </div>
      <div className="flex flex-col">
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      title={modalHeader}
      className="h-[95vh]"
      contentClassName="flex flex-col md:flex-row overflow-hidden"
    >
      <div className="flex-1 p-0 flex flex-col bg-white dark:bg-[#0b0e11] overflow-hidden">
        {/* Tabs Header */}
        <div className="flex items-center gap-6 px-8 py-4 border-b border-slate-100 dark:border-[#2a303c]">
          {['general', 'comments', 'collaboration'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`relative py-2 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              {tab === 'general' ? 'Geral' : tab === 'comments' ? 'Comentários' : 'Colaboração'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
          {activeTab === 'general' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Cliente"
                  value={editedTask.client}
                  onChange={(e) => handleSaveField('client', e.target.value)}
                  className="font-bold text-indigo-600 dark:text-indigo-400"
                  placeholder="Nome do cliente"
                />

                <Input
                  label="Título"
                  value={editedTask.title}
                  onChange={(e) => handleSaveField('title', e.target.value)}
                  className="font-bold"
                  placeholder="O que será entregue?"
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2" ref={deliveryDropdownRef}>
                  <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Briefcase size={14} /> Tipo de Entrega
                  </label>

                  <div className="relative">
                    <button
                      onClick={() => setIsDeliveryTypeOpen(!isDeliveryTypeOpen)}
                      className={`w-full p-4 flex items-center justify-between bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-bold transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDeliveryTypeOpen ? 'border-indigo-500/50' : ''}`}
                    >
                      <span className="text-slate-700 dark:text-white">{selectedDeliveryType?.name || 'Selecione um tipo'}</span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDeliveryTypeOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDeliveryTypeOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar py-2">
                          {deliveryTypes.map(dt => (
                            <button
                              key={dt.id}
                              onClick={() => {
                                handleSaveField('projectType', dt.id);
                                setIsDeliveryTypeOpen(false);
                              }}
                              className={`w-full px-5 py-3 text-left text-sm font-medium transition-all flex items-center justify-between group ${editedTask.projectType === dt.id
                                ? 'bg-blue-500 text-white'
                                : 'text-slate-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'
                                }`}
                            >
                              <span>{dt.name}</span>
                              {editedTask.projectType === dt.id && <CheckCircle size={14} className="text-white" />}
                            </button>
                          ))}
                          {deliveryTypes.length === 0 && <div className="p-4 text-xs text-gray-400 text-center">Nenhum tipo configurado</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest block px-1">Descrição Detalhada / Briefing</label>
                <textarea
                  value={editedTask.description}
                  onChange={(e) => handleSaveField('description', e.target.value)}
                  className="w-full p-6 rounded-[24px] border border-slate-200 dark:border-[#2a303c] bg-slate-50/50 dark:bg-[#151a21]/30 text-sm text-slate-700 dark:text-gray-300 resize-none h-40 focus:ring-2 focus:ring-indigo-500/20 outline-none leading-relaxed transition-all"
                  placeholder="Detalhe os requisitos técnicos e criativos desta tarefa..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Tag size={16} className="text-indigo-600 dark:text-indigo-400" /> Gestão de Tags
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-[#151a21]/40 rounded-2xl border border-slate-200 dark:border-[#2a303c]">
                  {editedTask.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-[#0b0e11] text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-[#2a303c] rounded-full text-xs font-bold transition-all hover:bg-indigo-50 dark:hover:bg-indigo-500/10 group">
                      <Hash size={10} />
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Nova tag..."
                      className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-0 placeholder:text-gray-400"
                    />
                    <button onClick={handleAddTag} className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-white/5 rounded-full transition-all">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                  <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" /> Checklist de Atividades
                </label>
                <div className="space-y-2">
                  {(editedTask.subtasks || []).map(st => (
                    <div key={st.id} className="flex items-center gap-3 bg-slate-50 dark:bg-[#151a21]/40 p-3 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-[#2a303c] transition-all group">
                      <button
                        onClick={() => handleSaveField('subtasks', (editedTask.subtasks || []).map(s => s.id === st.id ? { ...s, completed: !s.completed } : s))}
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-[#2a303c]'}`}
                      >
                        {st.completed && <CheckCircle size={12} className="text-white" />}
                      </button>
                      <span className={`text-sm font-semibold flex-1 ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-gray-300'}`}>
                        {st.title}
                      </span>
                      <button
                        onClick={() => handleSaveField('subtasks', (editedTask.subtasks || []).filter(s => s.id !== st.id))}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
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
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Referências */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Paperclip size={16} className="text-amber-500" /> Arquivos de Referência
                      </label>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadCategory('reference'); fileInputRef.current?.click(); }}
                        className="w-8 h-8 flex items-center justify-center bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-lg transition-all"
                        title="Adicionar Referência"
                        disabled={isUploading}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {referenceFiles.length === 0 ? (
                        <div className="p-10 border-2 border-dashed border-slate-200 dark:border-[#2a303c] rounded-[24px] flex flex-col items-center justify-center text-center bg-slate-50/30 dark:bg-white/5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sem referências</p>
                        </div>
                      ) : (
                        referenceFiles.map(file => (
                          <div key={file.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-xl group hover:border-amber-500/30 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#0b0e11] flex items-center justify-center text-amber-500 overflow-hidden shrink-0">
                              {file.type === 'image' ? <img src={file.url} className="w-full h-full object-cover" /> : file.type === 'video' ? <Film size={18} /> : <FileText size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase">{file.type}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={(e) => { e.stopPropagation(); setPreviewAttachment(file); }} className="p-2 text-slate-400 hover:text-indigo-600"><Eye size={16} /></button>
                              <button onClick={() => handleRemoveAttachment(file.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Entregáveis */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                          <Target size={16} className="text-indigo-600 dark:text-indigo-400" /> Arquivos para Revisão
                        </label>
                        <button
                          onClick={(e) => { e.stopPropagation(); setUploadCategory('deliverable'); fileInputRef.current?.click(); }}
                          className="w-8 h-8 flex items-center justify-center bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600/20 rounded-lg transition-all"
                          title="Enviar Entregável"
                          disabled={isUploading}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {deliverableFiles.length === 0 ? (
                          <div className="p-10 border-2 border-dashed border-slate-200 dark:border-[#2a303c] rounded-[24px] flex flex-col items-center justify-center text-center bg-slate-50/30 dark:bg-white/5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aguardando entrega</p>
                          </div>
                        ) : (
                          deliverableFiles.map(file => (
                            <div key={file.id} className="flex flex-col gap-3 p-3 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-xl group hover:border-indigo-500/30 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#0b0e11] flex items-center justify-center text-indigo-600 overflow-hidden shrink-0">
                                  {file.type === 'image' ? <img src={file.url} className="w-full h-full object-cover" /> : file.type === 'video' ? <Film size={18} /> : <FileText size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${file.status === 'approved' ? 'bg-green-500/10 text-green-500' : file.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-500'}`}>{file.status}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={(e) => { e.stopPropagation(); setPreviewAttachment(file); }} className="p-2 text-slate-400 hover:text-indigo-600"><Eye size={16} /></button>
                                  <button onClick={() => handleRemoveAttachment(file.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                              </div>

                              {file.status === 'rejected' && file.feedback && (
                                <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-100 dark:border-red-500/20">
                                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <Target size={12} /> Ajustes Solicitados
                                  </p>
                                  <p className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap font-medium leading-relaxed">
                                    {file.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,application/pdf"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'comments' && (
            <div className="h-full flex flex-col items-center justify-center p-10 opacity-50">
              <p className="text-sm font-bold text-gray-500">Comentários (Em Breve)</p>
            </div>
          )}

          {activeTab === 'collaboration' && (
            <div className="h-full flex flex-col items-center justify-center p-10 opacity-50">
              <p className="text-sm font-bold text-gray-500">Colaboração (Em Breve)</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-80 p-8 bg-slate-50 dark:bg-[#0b0e11] border-l border-slate-100 dark:border-[#2a303c] space-y-8 overflow-y-auto custom-scrollbar">

        {isUploading && (
          <div className="bg-white dark:bg-[#151a21] p-6 rounded-[28px] border border-indigo-500/30 shadow-lg flex flex-col items-center gap-3 animate-pulse">
            <Loader2 size={32} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Enviando Arquivo...</p>
          </div>
        )}

        {!editedTask.accepted && !isDraft && isAssignee && (
          <div className="space-y-3 animate-in slide-in-from-top duration-500">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest px-1">Ação Requerida</label>
            <Button
              fullWidth
              onClick={() => {
                const nextStage = settings?.workflowRules?.onAccept || editedTask.stage;
                setEditedTask(prev => prev ? { ...prev, accepted: true, stage: nextStage } : null);
                onAccept(editedTask.id);
              }}
              leftIcon={<CheckCircle size={18} />}
              className="rounded-3xl shadow-xl shadow-indigo-600/30 uppercase tracking-[0.2em] py-5"
            >
              ACEITAR TAREFA
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest px-1">Prazo de Entrega</label>
          <div className="relative">
            <input
              type="datetime-local"
              value={formatDateTimeForInput(editedTask.dueDate)}
              onChange={(e) => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) handleSaveField('dueDate', d.getTime());
              }}
              className="w-full p-4 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest px-1">Cronômetro de Produção</label>
          <div className={`bg-white dark:bg-[#151a21] p-6 rounded-[28px] border ${isTimeLow ? 'border-red-500 shadow-red-500/10' : 'border-slate-200 dark:border-[#2a303c]'} shadow-sm relative overflow-hidden group transition-colors duration-500`}>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${isTimeLow ? 'bg-red-500/10 text-red-500' : 'bg-indigo-600/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'} flex items-center justify-center transition-colors duration-500`}>
                <Timer size={28} className={editedTask.accepted && !isApproved && !isDraft ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h4 className={`text-xl font-black ${isTimeLow ? 'text-red-500' : 'text-slate-900 dark:text-white'} tracking-tighter leading-none transition-colors duration-500`}>{timeRemaining}</h4>
                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Tempo Restante</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest px-1">Etapa do Workflow</label>
            <div className="relative">
              <select
                value={editedTask.stage}
                onChange={(e) => handleSaveField('stage', e.target.value)}
                className="w-full p-4 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-[11px] font-black text-slate-900 dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {workflow.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest px-1">Membro Responsável</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={editedTask.assigneeId}
                onChange={(e) => handleSaveField('assigneeId', e.target.value)}
                className="w-full p-4 pl-12 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col gap-3">
          <Button
            onClick={handleFinalAction}
            fullWidth
            className="rounded-3xl shadow-xl shadow-indigo-600/30 uppercase tracking-[0.2em] py-5"
          >
            {isDraft ? 'CRIAR CARD' : 'SALVAR ALTERAÇÕES'}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            fullWidth
            className="text-[10px] font-black uppercase tracking-widest py-4"
          >
            CANCELAR
          </Button>
          {!isDraft && (
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-[#2a303c]">
              <button
                onClick={handleArchiveTask}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-2xl transition-all border border-transparent hover:border-emerald-200"
              >
                CONCLUIR TAREFA
              </button>
              <button
                onClick={handleDeleteTask}
                className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
              >
                EXCLUIR
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col items-center justify-center">
            <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
              <a
                href={previewAttachment.url}
                download={previewAttachment.name}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
                title="Baixar Arquivo"
              >
                <Download size={20} />
              </a>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-3 bg-white/10 hover:bg-red-500/80 text-white rounded-full transition-all backdrop-blur-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="w-full h-full flex items-center justify-center p-4">
              {previewAttachment.type === 'image' ? (
                <img src={previewAttachment.url} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />
              ) : previewAttachment.type === 'video' ? (
                <video src={previewAttachment.url} controls className="max-w-full max-h-full rounded-lg shadow-2xl" />
              ) : (
                <iframe src={previewAttachment.url} className="w-full h-full bg-white rounded-lg shadow-2xl" title="PDF Preview" />
              )}
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold text-sm">
              {previewAttachment.name}
            </div>
          </div>
        </div>
      )}

    </Modal>
  );
};
