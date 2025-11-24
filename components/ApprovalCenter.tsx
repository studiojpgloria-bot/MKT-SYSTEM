
import React, { useState, useEffect } from 'react';
import { FileText, Check, X, Eye, Download, MessageSquare, Play, Film, Plus, Trash2, Clock } from 'lucide-react';
import { Task, TaskStage, Attachment } from '../types';

interface ApprovalCenterProps {
  tasks: Task[];
  onApprove: (taskId: string, attachmentId: string) => void;
  onReject: (taskId: string, attachmentId: string, feedback?: string) => void;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ tasks, onApprove, onReject }) => {
  const [selectedFile, setSelectedFile] = useState<{ task: Task; attachment: Attachment } | null>(null);
  
  // Feedback state for video modal
  const [videoTimestamp, setVideoTimestamp] = useState('');
  const [videoFeedback, setVideoFeedback] = useState('');
  const [feedbackList, setFeedbackList] = useState<{time: string, note: string}[]>([]);

  // Feedback state for image modal
  const [imageFeedback, setImageFeedback] = useState('');

  // Reset states when opening a file
  useEffect(() => {
      if (selectedFile) {
          setVideoTimestamp('');
          setVideoFeedback('');
          setFeedbackList([]);
          setImageFeedback('');
      }
  }, [selectedFile]);

  // Filter tasks that have DELIVERABLE attachments pending review
  const pendingApprovals = tasks.filter(
    t => (t.stage === TaskStage.REVIEW || t.stage === TaskStage.DESIGN) && 
         t.attachments.some(a => a.status === 'pending' && a.category === 'deliverable')
  );

  const handleDownload = (file: Attachment) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (task: Task, attachment: Attachment) => {
      if (attachment.type === 'pdf') {
          handleDownload(attachment);
      } else {
          setSelectedFile({ task, attachment });
      }
  };

  const handleAddVideoFeedback = () => {
      if (videoFeedback.trim()) {
          setFeedbackList([...feedbackList, { 
              time: videoTimestamp || '00:00', 
              note: videoFeedback 
          }]);
          setVideoFeedback('');
          setVideoTimestamp('');
      }
  };

  const handleRemoveFeedbackItem = (index: number) => {
      const newList = [...feedbackList];
      newList.splice(index, 1);
      setFeedbackList(newList);
  };

  const handleSubmitRejection = () => {
      if (selectedFile) {
          let finalFeedback = '';

          if (selectedFile.attachment.type === 'video') {
              // Combine list items or use single input if list is empty
              if (feedbackList.length > 0) {
                  finalFeedback = feedbackList.map(f => `[${f.time}] ${f.note}`).join('\n');
              } else if (videoFeedback) {
                  finalFeedback = `[${videoTimestamp || '00:00'}] ${videoFeedback}`;
              } else {
                  finalFeedback = 'Correções solicitadas no vídeo.';
              }
          } else {
              // Image feedback
              finalFeedback = imageFeedback || 'Ajustes visuais solicitados.';
          }
            
          onReject(selectedFile.task.id, selectedFile.attachment.id, finalFeedback);
          setSelectedFile(null);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="bg-indigo-600 rounded-xl p-8 text-white shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-2">Central de Aprovações</h2>
        <p className="text-indigo-100 max-w-xl">
          Revise os ativos criativos, forneça feedback detalhado e gerencie as aprovações das campanhas em um só lugar.
        </p>
      </div>

      {pendingApprovals.length === 0 ? (
         <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
             <p className="text-gray-500 dark:text-slate-400">Nenhum item pendente de aprovação.</p>
         </div>
      ) : (
        <div className="space-y-6">
          {pendingApprovals.map(task => (
            <div key={task.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start bg-gray-50 dark:bg-slate-950">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase">
                        {task.client}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-500 dark:text-slate-400">Vence em {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{task.title}</h3>
                </div>
                <div className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                    ID: #{task.id}
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {task.attachments
                  .filter(a => a.category === 'deliverable' && a.status === 'pending')
                  .map(file => (
                  <div key={file.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Preview / Icon */}
                    <div 
                        onClick={() => handleView(task, file)}
                        className="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-slate-700 relative group cursor-pointer"
                    >
                        {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        ) : file.type === 'video' ? (
                            <div className="flex flex-col items-center gap-1 text-gray-400">
                                <Film size={32} />
                                <span className="text-[10px] font-bold uppercase">Video</span>
                            </div>
                        ) : (
                            <FileText size={32} className="text-gray-400" />
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.type === 'pdf' ? <Download className="text-white" /> : <Eye className="text-white" />}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full text-center sm:text-left">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{file.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Enviado por Membro • Aguardando Revisão</p>
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                             <button 
                                onClick={() => handleDownload(file)}
                                className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 border border-gray-200 dark:border-slate-700 rounded px-2 py-1"
                             >
                                <Download size={12} />
                                Baixar
                             </button>
                             {file.type !== 'pdf' && (
                                 <button 
                                    onClick={() => handleView(task, file)}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 border border-gray-200 dark:border-slate-700 rounded px-2 py-1"
                                 >
                                    <Eye size={12} />
                                    Visualizar
                                 </button>
                             )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                            onClick={() => handleView(task, file)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all"
                        >
                            <Eye size={16} />
                            Avaliar
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-5xl flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl my-8">
                <button 
                    onClick={() => setSelectedFile(null)}
                    className="absolute top-2 right-2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                    <X size={24} />
                </button>
                
                {/* Media Display Area */}
                <div className="bg-black flex items-center justify-center" style={{ minHeight: '400px', maxHeight: '60vh' }}>
                    {selectedFile.attachment.type === 'image' ? (
                        <img 
                            src={selectedFile.attachment.url} 
                            alt="Preview" 
                            className="max-w-full max-h-[60vh] object-contain" 
                        />
                    ) : (
                         <video 
                            controls 
                            className="max-w-full max-h-[60vh] w-full"
                            src={selectedFile.attachment.url}
                         >
                            Seu navegador não suporta a tag de vídeo.
                         </video>
                    )}
                </div>

                {/* Controls Area */}
                <div className="p-6 flex flex-col md:flex-row gap-6">
                    
                    {/* Feedback Section */}
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <MessageSquare size={18} className="text-indigo-500"/> 
                            Feedback & Correções
                        </h4>

                        {selectedFile.attachment.type === 'video' ? (
                            <div className="space-y-4">
                                {/* List of added feedback */}
                                {feedbackList.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-700 space-y-2">
                                        {feedbackList.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-sm bg-white dark:bg-slate-700 p-2 rounded shadow-sm">
                                                <div>
                                                    <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 dark:bg-indigo-900/50 px-1 rounded mr-2">{item.time}</span>
                                                    <span className="text-gray-700 dark:text-slate-200">{item.note}</span>
                                                </div>
                                                <button onClick={() => handleRemoveFeedbackItem(idx)} className="text-gray-400 hover:text-red-500">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Inputs */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Minutagem</label>
                                        <input 
                                            type="text" 
                                            placeholder="00:00" 
                                            value={videoTimestamp}
                                            onChange={(e) => setVideoTimestamp(e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded font-mono text-sm"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Descrição da Alteração</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Cortar esta cena, mudar cor do texto..." 
                                            value={videoFeedback}
                                            onChange={(e) => setVideoFeedback(e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddVideoFeedback()}
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-end">
                                        <button 
                                            onClick={handleAddVideoFeedback}
                                            disabled={!videoFeedback}
                                            className="w-full p-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-indigo-100 hover:text-indigo-700 font-bold rounded transition-colors text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            <Plus size={16}/> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Image Feedback
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Descrição das Alterações</label>
                                <textarea
                                    rows={4}
                                    placeholder="Descreva o que precisa ser ajustado nesta imagem..."
                                    value={imageFeedback}
                                    onChange={(e) => setImageFeedback(e.target.value)}
                                    className="w-full p-3 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full md:w-64 flex flex-col justify-end gap-3 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">
                        <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                            Ações:
                        </div>
                        <button 
                            onClick={handleSubmitRejection}
                            className="w-full py-3 px-4 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <X size={18} /> Solicitar Alteração
                        </button>
                        <button 
                            onClick={() => {
                                onApprove(selectedFile.task.id, selectedFile.attachment.id);
                                setSelectedFile(null);
                            }}
                            className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={18} /> Aprovar Ativo
                        </button>
                        
                        {selectedFile.attachment.type === 'video' && (
                            <p className="text-[10px] text-center text-gray-400 mt-2">
                                Ao solicitar alteração, todas as notas adicionadas serão enviadas ao editor.
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
};
