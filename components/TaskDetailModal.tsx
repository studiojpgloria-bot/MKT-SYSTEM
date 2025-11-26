import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, User as UserIcon, Paperclip, MessageSquare, Send, Trash2, CheckCircle, AlertCircle, Clock, Upload, Timer, Plus, PlayCircle, ShieldAlert, Cloud, HardDrive, FileText, CheckSquare, GripVertical, Briefcase } from 'lucide-react';
import { Task, TaskPriority, User, UserRole, WorkflowStage, Subtask, Client } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  currentUser: User;
  users: User[];
  clients: Client[];
  workflow: WorkflowStage[]; 
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onAddComment: (taskId: string, text: string) => void;
  onDelete: (taskId: string) => void;
  onUpload: (taskId: string, file: File) => void;
  onCloudImport: (taskId: string, service: string) => void;
  onAccept: (taskId: string) => void;
  onApprove: (taskId: string, attachmentId: string) => void;
  onReject: (taskId: string, attachmentId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task, 
  currentUser,
  users, 
  clients,
  workflow,
  isOpen, 
  onClose, 
  onUpdate,
  onAddComment,
  onDelete,
  onUpload,
  onCloudImport,
  onAccept,
  onApprove,
  onReject
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [addTimeAmount, setAddTimeAmount] = useState(30);
  const [showCloudMenu, setShowCloudMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cloudMenuRef.current && !cloudMenuRef.current.contains(event.target as Node)) {
        setShowCloudMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !editedTask) return null;

  const handleSaveField = (field: keyof Task, value: any) => {
    setEditedTask(prev => prev ? { ...prev, [field]: value } : null);
    onUpdate(editedTask.id, { [field]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(editedTask.id, newComment);
            setNewComment('');
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

  // Subtasks Logic
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

  const formatDateForInput = (dateValue: string | number | null | undefined): string => {
    if (!dateValue) return '';
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (error) {
        return '';
    }
  };

  const assignee = users.find(u => u.id === editedTask.assigneeId);
  const client = clients.find(c => c.id === editedTask.clientId);
  const isAssignee = currentUser.id === editedTask.assigneeId;
  const isAdminOrManager = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

  const needsAcceptance = isAssignee && !editedTask.accepted && editedTask.stage === 'briefing';
  const isInReview = editedTask.stage === 'review';
  const isApproved = editedTask.stage === 'approved';
  const isDesign = editedTask.stage === 'design';

  const completedSubtasks = editedTask.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = editedTask.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex-1 mr-8">
            <div className="flex items-center gap-3 mb-3">
               <select 
                  value={editedTask.stage}
                  onChange={(e) => handleSaveField('stage', e.target.value)}
                  disabled={!isAdminOrManager} 
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                      !isAdminOrManager ? 'opacity-75 cursor-not-allowed bg-gray-200 text-gray-600' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {workflow.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
               </select>
               <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Created {new Date().toLocaleDateString()}</span>
               </div>
               {editedTask.accepted && (
                   <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-100">
                       <CheckCircle size={10} /> Accepted
                   </div>
               )}
            </div>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => handleSaveField('title', e.target.value)}
              readOnly={!isAdminOrManager && !isAssignee}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 focus:outline-none w-full placeholder-gray-300"
              placeholder="Task Title"
            />
          </div>
          <div className="flex items-center gap-2">
            {isAdminOrManager && (
                <button 
                    onClick={() => onDelete(editedTask.id)}
                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors flex items-center gap-2"
                    title="Delete Task"
                >
                    <Trash2 size={20} />
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-gray-100 space-y-8 relative">
            
            {needsAcceptance && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                    <PlayCircle size={48} className="text-indigo-500" />
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900">Ready to start?</h3>
                        <p className="text-indigo-600 text-sm max-w-sm mx-auto">Accepting this task will move it to the <b>Design</b> stage and notify the manager.</p>
                    </div>
                    <button 
                        onClick={() => onAccept(editedTask.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-sm transition-transform active:scale-95"
                    >
                        Accept Task
                    </button>
                </div>
            )}

            {isInReview && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900">Pending Approval</h4>
                        <p className="text-sm text-amber-700">This task is currently under review by a manager. Uploads are locked until feedback is provided.</p>
                    </div>
                </div>
            )}
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={editedTask.description}
                onChange={(e) => handleSaveField('description', e.target.value)}
                readOnly={!isAdminOrManager && !isAssignee}
                rows={6}
                className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-gray-600 leading-relaxed resize-none text-sm"
                placeholder="Add a more detailed description..."
              />
            </div>
            
            {/* Subtasks */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                       <CheckSquare size={16} /> Checklist
                    </label>
                    {totalSubtasks > 0 && (
                        <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                    )}
                </div>
                
                {totalSubtasks > 0 && (
                    <div className="h-2 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                <div className="space-y-2 mb-3">
                    {(editedTask.subtasks || []).map(subtask => (
                        <div key={subtask.id} className="flex items-start gap-3 group">
                            <input 
                                type="checkbox" 
                                checked={subtask.completed}
                                onChange={() => toggleSubtask(subtask.id)}
                                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                disabled={!isAdminOrManager && !isAssignee}
                            />
                            <span className={`text-sm flex-1 ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {subtask.title}
                            </span>
                            {(isAdminOrManager || isAssignee) && (
                                <button 
                                    onClick={() => deleteSubtask(subtask.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {(isAdminOrManager || isAssignee) && (
                    <div className="flex items-center gap-2">
                        <Plus size={16} className="text-gray-400" />
                        <input 
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleAddSubtask();
                            }}
                            placeholder="Add an item"
                            className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0 placeholder-gray-400"
                        />
                    </div>
                )}
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                 <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Paperclip size={16} />
                    Attachments ({editedTask.attachments.length})
                 </label>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                 />
                 
                 {/* Upload allowed if NOT in review/approved OR if user is Admin/Manager */}
                 {(!isInReview && !isApproved || isAdminOrManager) && (
                     <div className="flex items-center gap-2" ref={cloudMenuRef}>
                        <div className="relative">
                           <button 
                                onClick={() => setShowCloudMenu(!showCloudMenu)}
                                className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-gray-600 hover:bg-gray-100 border border-gray-200"
                           >
                              <Cloud size={12} /> Import
                           </button>
                           
                           {showCloudMenu && (
                             <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={() => { onCloudImport(editedTask.id, 'google_drive'); setShowCloudMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-2">
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-4 h-4" alt="Drive"/> Google Drive
                                </button>
                                <button onClick={() => { onCloudImport(editedTask.id, 'dropbox'); setShowCloudMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-2">
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" className="w-4 h-4" alt="Dropbox"/> Dropbox
                                </button>
                                <button onClick={() => { onCloudImport(editedTask.id, 'onedrive'); setShowCloudMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-2">
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" className="w-4 h-4" alt="OneDrive"/> OneDrive
                                </button>
                             </div>
                           )}
                        </div>

                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           className={`text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                               isDesign && isAssignee 
                               ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' 
                               : 'text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100'
                           }`}
                        >
                           <Upload size={12} />
                           {isDesign && isAssignee ? 'Upload & Submit' : 'Upload File'}
                        </button>
                     </div>
                 )}
              </div>

              <div className="space-y-2">
                {editedTask.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-gray-500 border border-gray-200 overflow-hidden">
                                {att.source === 'google_drive' ? (
                                   <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5" alt="Drive"/>
                                ) : att.source === 'dropbox' ? (
                                   <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" className="w-5 h-5" alt="Dropbox"/>
                                ) : att.source === 'onedrive' ? (
                                   <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg" className="w-5 h-5" alt="OneDrive"/>
                                ) : att.type === 'image' ? (
                                    <img src={att.url} className="w-full h-full object-cover" alt="preview"/>
                                ) : (
                                    <span className="text-[10px] font-bold">DOC</span>
                                )}
                            </div>
                            <div>
                                <a href={att.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-700 hover:text-indigo-600 truncate max-w-[200px] block">
                                    {att.name}
                                </a>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                   {att.category === 'reference' && (
                                       <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wide">Ref</span>
                                   )}
                                   {att.category === 'deliverable' && (
                                       <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 uppercase tracking-wide">Delivery</span>
                                   )}
                                   
                                   <span className="capitalize">{att.status}</span>
                                   {att.source !== 'local' && (
                                      <>
                                        <span>•</span>
                                        <span className="capitalize flex items-center gap-1">
                                           <Cloud size={10} /> {att.source.replace('_', ' ')}
                                        </span>
                                      </>
                                   )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Approval Buttons only for PENDING DELIVERABLES and accessible by ADMIN/MANAGER */}
                            {att.status === 'pending' && att.category === 'deliverable' && isAdminOrManager && (
                                <>
                                    <button 
                                        onClick={() => onReject(editedTask.id, att.id)}
                                        className="p-1.5 bg-white border border-gray-200 rounded text-gray-400 hover:text-red-600 hover:border-red-200 transition-all"
                                        title="Request Changes"
                                    >
                                        <X size={14} />
                                    </button>
                                    <button 
                                        onClick={() => onApprove(editedTask.id, att.id)}
                                        className="p-1.5 bg-indigo-600 border border-indigo-600 rounded text-white hover:bg-indigo-700 transition-all"
                                        title="Approve"
                                    >
                                        <CheckCircle size={14} />
                                    </button>
                                </>
                            )}

                            {att.status === 'approved' && <CheckCircle size={16} className="text-green-500" />}
                            {att.status === 'rejected' && <AlertCircle size={16} className="text-red-500" />}
                            
                            {(isAdminOrManager || isAssignee) && att.status !== 'approved' && (
                                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {editedTask.attachments.length === 0 && !isInReview && (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-center gap-4 mb-2 opacity-40 group-hover:opacity-60 transition-opacity">
                           <HardDrive size={24} />
                           <Cloud size={24} />
                        </div>
                        <p className="text-sm text-gray-400">Drag files here, click to upload, or use Import</p>
                    </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div>
               <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-4">
                    <MessageSquare size={16} />
                    Comments
               </label>
               
               <div className="space-y-4 mb-6">
                   {editedTask.comments.map(comment => {
                       const commentUser = users.find(u => u.id === comment.userId);
                       return (
                           <div key={comment.id} className="flex gap-3">
                               <img src={commentUser?.avatar} alt={commentUser?.name} className="w-8 h-8 rounded-full mt-1" />
                               <div className="bg-gray-50 p-3 rounded-r-xl rounded-bl-xl flex-1">
                                   <div className="flex items-center justify-between mb-1">
                                       <span className="text-xs font-bold text-gray-700">{commentUser?.name}</span>
                                       <span className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleString()}</span>
                                   </div>
                                   <p className="text-sm text-gray-600">{comment.text}</p>
                               </div>
                           </div>
                       );
                   })}
               </div>

               <div className="flex gap-3 items-start">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        ME
                   </div>
                   <div className="flex-1 relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Write a comment..."
                            rows={2}
                            className="w-full p-3 pr-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
                        />
                        <button 
                            onClick={() => {
                                if(newComment.trim()) {
                                    onAddComment(editedTask.id, newComment);
                                    setNewComment('');
                                }
                            }}
                            className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Send size={14} />
                        </button>
                   </div>
               </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 bg-gray-50 p-6 space-y-6 overflow-y-auto">
             
             {/* Properties */}
             <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                    <div className="flex gap-2">
                        {Object.values(TaskPriority).map(p => (
                            <button
                                key={p}
                                disabled={!isAdminOrManager}
                                onClick={() => handleSaveField('priority', p)}
                                className={`flex-1 text-[10px] font-bold py-1.5 rounded border transition-all ${
                                    editedTask.priority === p 
                                    ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm ring-1 ring-indigo-500' 
                                    : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Assignee</label>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        {assignee ? (
                             <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><UserIcon size={14} className="text-gray-400"/></div>
                        )}
                        <select 
                            value={editedTask.assigneeId}
                            disabled={!isAdminOrManager}
                            onChange={(e) => handleSaveField('assigneeId', e.target.value)}
                            className="flex-1 bg-transparent text-sm text-gray-700 border-none focus:ring-0 cursor-pointer p-0 disabled:cursor-not-allowed"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <Calendar size={16} className="text-gray-400 ml-1" />
                        <input 
                            type="date"
                            readOnly={!isAdminOrManager}
                            value={formatDateForInput(editedTask.dueDate)}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const date = new Date(e.target.value);
                                    handleSaveField('dueDate', date.getTime());
                                } else {
                                    handleSaveField('dueDate', null);
                                }
                            }}
                            className="flex-1 bg-transparent text-sm text-gray-700 border-none focus:ring-0 p-0"
                        />
                    </div>
                </div>

                {/* Time Tracking Section */}
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Time Tracking</label>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                                    <Timer size={16} />
                                </div>
                                <span className="font-mono font-bold text-gray-700">{formatTime(editedTask.timeSpent || 0)}</span>
                             </div>
                             <span className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">Logged</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <select 
                                className="flex-1 text-xs border border-gray-200 rounded py-1.5 px-2 bg-gray-50 text-gray-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                value={addTimeAmount}
                                onChange={(e) => setAddTimeAmount(Number(e.target.value))}
                            >
                                <option value="15">15m</option>
                                <option value="30">30m</option>
                                <option value="60">1h</option>
                                <option value="120">2h</option>
                            </select>
                            <button 
                                onClick={handleAddTime}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded transition-colors flex items-center justify-center w-8"
                                title="Add Time"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Client</label>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <Briefcase size={16} className="text-gray-400 ml-1" />
                        <select 
                            value={editedTask.clientId || ''}
                            disabled={!isAdminOrManager}
                            onChange={(e) => handleSaveField('clientId', e.target.value || null)}
                            className="flex-1 bg-transparent text-sm text-gray-700 border-none focus:ring-0 cursor-pointer p-0 disabled:cursor-not-allowed"
                        >
                            <option value="">No Client</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {editedTask.tags.map(tag => (
                            <span key={tag} className="bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded text-xs flex items-center gap-1 group">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10}/></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <Tag size={14} className="text-gray-400 ml-1" />
                        <input 
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder="Type & Enter..."
                            className="flex-1 bg-transparent text-xs border-none focus:ring-0 p-0"
                        />
                    </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};