
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, MessageSquare, Send, CheckCircle, Clock, Upload, Timer, Plus, CheckSquare, ChevronDown, Paperclip, User as UserIcon, Image as ImageIcon, Film, ExternalLink, Link2, Pause, Play, Target } from 'lucide-react';
import { Task, User, UserRole, WorkflowStage, Subtask, SystemSettings, Attachment } from '../types';

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
  const [timeRemaining, setTimeRemaining] = useState<string>('Pendente');
  const [uploadCategory, setUploadCategory] = useState<'deliverable' | 'reference'>('deliverable');
  const [tempFinalLink, setTempFinalLink] = useState('');
  
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

  const currentStage = workflow.find(s => s.id === editedTask.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/90 backdrop-blur-md p-4 overflow-y-auto transition-colors duration-300">
      <div className="bg-white dark:bg-[#0b0e11] rounded-[40px] shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-[#2a303c] relative transition-colors duration-300">
        
        {/* HEADER */}
        <div className="flex items-start justify-between px-10 pt-10 pb-6 shrink-0 bg-white dark:bg-[#0b0e11] transition-colors">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
               <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                  {isDraft ? 'RASCUNHO' : (currentStage?.name || 'PROCESSO')}
               </div>
               <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                 <Clock size={14} className="opacity-50" /> ID: <span className="text-slate-700 dark:text-gray-300">#{isDraft ? 'NOVO' : editedTask.id.slice(-4)}</span>
               </div>
            </div>
            <input 
              type="text" 
              value={editedTask.title} 
              onChange={(e) => handleSaveField('title', e.target.value)}
              className="text-5xl font-black text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 w-full p-0 tracking-tighter placeholder-slate-200 dark:placeholder-gray-800" 
              placeholder="Título da Tarefa"
            />
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#151a21] rounded-2xl border border-slate-200 dark:border-[#2a303c]">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#0b0e11] transition-colors">
          {/* ÁREA PRINCIPAL */}
          <div className="flex-1 p-10 pt-0 overflow-y-auto custom-scrollbar space-y-10">
            
            {showAcceptPrompt && (
                <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300 h-[400px]">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/10 dark:bg-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Timer size={40} className="animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Tarefa pendente de aceite</h3>
                    <button onClick={() => onAccept(editedTask.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95">ACEITAR TAREFA AGORA</button>
                </div>
            )}

            {isApproved && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-indigo-600/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 rounded-[32px] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className="flex-1 space-y-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Entrega Final Aprovada</h3>
                                <p className="text-sm text-slate-500 dark:text-gray-400">Link do arquivo final em alta qualidade para download.</p>
                            </div>
                            {isAdminOrManager ? (
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input type="text" value={tempFinalLink} onChange={(e) => setTempFinalLink(e.target.value)} placeholder="Link do Drive..." className="p-4 bg-white dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-xs text-slate-900 dark:text-white min-w-[280px]" />
                                    <button onClick={() => handleSaveField('finalLink', tempFinalLink)} className="p-4 bg-indigo-600 text-white rounded-2xl transition-all hover:bg-indigo-700 active:scale-95"><CheckCircle size={20}/></button>
                                </div>
                            ) : editedTask.finalLink && (
                                <a href={editedTask.finalLink} target="_blank" rel="noreferrer" className="px-10 py-5 bg-indigo-600 text-white font-black rounded-[24px] shadow-xl flex items-center gap-3 transition-all hover:bg-indigo-700 hover:scale-105">
                                    <ExternalLink size={20} /> BAIXAR PROJETO
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Descrição</label>
              <textarea 
                value={editedTask.description}
                onChange={(e) => handleSaveField('description', e.target.value)}
                className="w-full p-6 rounded-[32px] border border-slate-200 dark:border-[#2a303c] bg-slate-50/50 dark:bg-[#151a21]/30 text-slate-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 resize-none h-48 placeholder-slate-300 dark:placeholder-gray-800 transition-colors"
                placeholder="Descreva os objetivos do projeto..."
              />
            </div>
            
            <div className="space-y-4">
                <label className="text-sm font-black text-slate-500 dark:text-gray-400 flex items-center gap-3 uppercase tracking-widest">
                  <CheckSquare size={20} className="text-indigo-600 dark:text-indigo-500" /> Checklist
                </label>
                <div className="space-y-3">
                    {(editedTask.subtasks || []).map(st => (
                        <div key={st.id} className="flex items-center gap-4 bg-slate-50/50 dark:bg-[#151a21]/20 p-4 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-[#2a303c] transition-all">
                            <button onClick={() => handleSaveField('subtasks', editedTask.subtasks.map(s => s.id === st.id ? {...s, completed: !s.completed} : s))} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-[#2a303c] bg-transparent'}`}>{st.completed && <CheckCircle size={14} className="text-white" />}</button>
                            <span className={`text-base font-bold ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-gray-300'}`}>{st.title}</span>
                        </div>
                    ))}
                    <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} placeholder="Adicionar item ao checklist..." className="w-full bg-transparent border-dashed border-2 border-slate-200 dark:border-[#2a303c] rounded-2xl p-4 text-sm font-bold text-slate-500 focus:border-indigo-500 transition-all outline-none" />
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-black text-slate-500 dark:text-gray-400 flex items-center gap-3 uppercase tracking-widest">Anexos & Entregas</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editedTask.attachments?.map(att => (
                        <div key={att.id} className="bg-slate-50 dark:bg-[#151a21]/40 border border-slate-200 dark:border-[#2a303c] p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-indigo-500/50">
                            {att.type === 'image' ? <ImageIcon className="text-indigo-500" size={24}/> : <Paperclip className="text-slate-400" size={24}/>}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{att.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-black">{att.category}</p>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${att.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>{att.status.toUpperCase()}</span>
                        </div>
                    ))}
                    <button onClick={() => triggerUpload('deliverable')} className="p-4 border-2 border-dashed border-slate-200 dark:border-[#2a303c] rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all">
                        <Upload size={24} />
                        <span className="text-xs font-black uppercase tracking-widest">Subir Arquivo</span>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    </button>
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-[#2a303c]">
                <label className="text-sm font-black text-slate-500 dark:text-gray-400 flex items-center gap-3 uppercase tracking-widest">Discussão</label>
                <div className="space-y-6">
                    {editedTask.comments?.map(c => {
                        const commenter = users.find(u => u.id === c.userId);
                        return (
                            <div key={c.id} className="flex gap-4">
                                <img src={commenter?.avatar} className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#2a303c] bg-white dark:bg-[#151a21]" />
                                <div className="flex-1 bg-slate-50/50 dark:bg-[#151a21]/50 p-5 rounded-3xl border border-slate-200 dark:border-[#2a303c]">
                                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-1">{commenter?.name}</p>
                                    <p className="text-sm text-slate-700 dark:text-gray-300">{c.text}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-4">
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escreva um comentário..." className="w-full p-5 bg-slate-50 dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-3xl text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-colors" rows={2} />
                    <button onClick={handleCommentSubmit} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 self-end transition-all hover:scale-105 active:scale-95"><Send size={20} /></button>
                </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full md:w-[400px] p-10 space-y-10 bg-slate-50 dark:bg-[#0b0e11] border-l border-slate-200 dark:border-[#2a303c] transition-colors duration-300">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cronômetro</label>
                <div className={`p-8 rounded-[32px] border transition-all ${!isDraft ? 'bg-white dark:bg-[#151a21] border-indigo-500/30 shadow-sm' : 'bg-slate-200/20 dark:bg-white/5 border-slate-200 dark:border-[#2a303c]'}`}>
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${!isDraft ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-gray-800 text-slate-400'}`}>
                        <Timer size={28} className={editedTask.accepted && !isApproved && !isDraft ? 'animate-spin-slow' : ''} />
                      </div>
                      <div>
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{timeRemaining}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{isDraft ? 'AGUARDANDO CRIAÇÃO' : 'STATUS DA PRODUÇÃO'}</p>
                      </div>
                    </div>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Responsável</label>
                <div className="relative">
                    <UserIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={editedTask.assigneeId} onChange={(e) => handleSaveField('assigneeId', e.target.value)} className="w-full p-5 pl-14 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none appearance-none focus:ring-1 focus:ring-indigo-500 transition-all">
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vencimento</label>
                <div className="relative">
                    <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="datetime-local" value={new Date(editedTask.dueDate).toISOString().slice(0, 16)} onChange={(e) => handleSaveField('dueDate', new Date(e.target.value).getTime())} className="w-full p-5 pl-14 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all" />
                </div>
             </div>

             <div className="mt-auto pt-10 flex gap-4">
                 <button onClick={onClose} className="flex-1 py-5 text-xs font-black text-slate-400 dark:text-gray-600 border border-slate-200 dark:border-[#2a303c] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 uppercase tracking-widest transition-all">Sair</button>
                 {isDraft && onCreate && (
                   <button onClick={() => onCreate(editedTask)} className="flex-[2] py-5 text-xs font-black text-white bg-[#22c55e] rounded-2xl shadow-lg shadow-green-500/20 uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Criar Projeto</button>
                 )}
             </div>
          </div>
        </div>
      </div>
      <style>{` .animate-spin-slow { animation: spin 8s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
    </div>
  );
};

// Helper: triggerUpload
function triggerUpload(category: string) {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.click();
}
