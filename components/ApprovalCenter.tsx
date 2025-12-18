import React, { useState, useEffect, useRef } from 'react';
import { FileText, Check, X, Eye, Download, MessageSquare, Play, Film, Plus, Trash2, Clock, Pause, Circle } from 'lucide-react';
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

  // Video Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Reset states when opening a file
  useEffect(() => {
      if (selectedFile) {
          setVideoTimestamp('');
          setVideoFeedback('');
          setFeedbackList([]);
          setImageFeedback('');
          setIsPlaying(false);
          setProgress(0);
          setDuration(0);
          setCurrentTime(0);
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
              time: videoTimestamp || formatTime(currentTime), 
              note: videoFeedback 
          }].sort((a, b) => parseTime(a.time) - parseTime(b.time)));
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

  // --- Video Player Helpers ---
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const togglePlay = async () => {
    if (videoRef.current) {
        try {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                await videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        } catch (error) {
            console.error("Video play error:", error);
            setIsPlaying(false);
        }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        const curr = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        setCurrentTime(curr);
        
        if (isFinite(dur) && dur > 0) {
            setProgress((curr / dur) * 100);
        } else {
            setProgress(0);
        }
        
        if (curr === dur) setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
      if (videoRef.current) {
          setDuration(videoRef.current.duration);
      }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.min(Math.max(0, x / rect.width), 1);
      
      const dur = videoRef.current.duration;
      if (!isFinite(dur)) return;

      const newTime = percentage * dur;
      
      videoRef.current.currentTime = newTime;
      setProgress(percentage * 100);
      setCurrentTime(newTime);
  };

  const jumpToTime = (timeStr: string) => {
      const seconds = parseTime(timeStr);
      if (videoRef.current && isFinite(videoRef.current.duration)) {
          videoRef.current.currentTime = seconds;
          setCurrentTime(seconds);
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
            <div className="relative w-full max-w-6xl flex flex-col lg:flex-row bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl my-8 h-[85vh]">
                <button 
                    onClick={() => setSelectedFile(null)}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                    <X size={24} />
                </button>
                
                {/* Media Display Area (Left/Top) */}
                <div className="bg-black flex items-center justify-center relative flex-1 h-1/2 lg:h-full lg:w-2/3 border-r border-gray-800">
                    {selectedFile.attachment.type === 'image' ? (
                        <img 
                            src={selectedFile.attachment.url} 
                            alt="Preview" 
                            className="max-w-full max-h-full object-contain" 
                        />
                    ) : (
                        // Custom Video Player
                        <div className="w-full h-full flex flex-col justify-center bg-black relative group">
                             <video 
                                ref={videoRef}
                                className="max-w-full max-h-full w-full object-contain"
                                src={selectedFile.attachment.url}
                                onClick={togglePlay}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                             >
                                Seu navegador não suporta a tag de vídeo.
                             </video>
                             
                             {/* Center Play Button Overlay */}
                             {!isPlaying && (
                                <div 
                                    className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                                    onClick={togglePlay}
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all">
                                        <Play size={32} fill="white" />
                                    </div>
                                </div>
                             )}

                             {/* Bottom Controls */}
                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex flex-col gap-2">
                                 
                                 {/* Progress Bar with Markers */}
                                 <div 
                                    className="relative w-full h-1.5 bg-gray-600 rounded-full cursor-pointer group/timeline hover:h-2.5 transition-all"
                                    onClick={handleSeek}
                                 >
                                     <div 
                                        className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" 
                                        style={{ width: `${progress}%` }}
                                     ></div>
                                     
                                     {/* Markers */}
                                     {feedbackList.map((fb, idx) => {
                                         const fbSecs = parseTime(fb.time);
                                         const fbPct = (duration > 0 && isFinite(duration)) ? (fbSecs / duration) * 100 : 0;
                                         return (
                                             <div 
                                                key={idx}
                                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-black hover:scale-125 transition-transform z-10"
                                                style={{ left: `${fbPct}%` }}
                                                title={`${fb.time}: ${fb.note}`}
                                             />
                                         );
                                     })}
                                 </div>

                                 {/* Control Buttons */}
                                 <div className="flex items-center justify-between text-white text-xs font-medium">
                                     <div className="flex items-center gap-4">
                                         <button onClick={togglePlay} className="hover:text-indigo-400">
                                             {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                         </button>
                                         <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Controls Area (Right/Bottom) */}
                <div className="flex-1 lg:max-w-md bg-white dark:bg-[#151a21] flex flex-col h-1/2 lg:h-full border-t lg:border-t-0 border-gray-200 dark:border-slate-800">
                    <div className="p-6 flex-1 overflow-y-auto">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2 text-lg">
                            <MessageSquare size={20} className="text-indigo-500"/> 
                            Feedback & Correções
                        </h4>

                        {selectedFile.attachment.type === 'video' ? (
                            <div className="space-y-6">
                                {/* Feedback List */}
                                <div className="space-y-2">
                                    {feedbackList.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                            Sem correções adicionadas.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {feedbackList.map((item, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => jumpToTime(item.time)}
                                                    className="flex justify-between items-center text-sm bg-gray-100 dark:bg-[#1e232d] p-3 rounded-xl border border-transparent hover:border-indigo-500/50 cursor-pointer group transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono font-bold text-indigo-400 text-xs bg-indigo-500/10 px-2 py-1 rounded-md">{item.time}</span>
                                                        <span className="text-gray-700 dark:text-slate-200 line-clamp-1 font-medium">{item.note}</span>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFeedbackItem(idx);
                                                        }} 
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Inputs */}
                                <div className="bg-gray-50 dark:bg-[#0b0e11] p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-3">
                                    <div className="flex gap-3">
                                        <div className="w-24">
                                            <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Minutagem</label>
                                            <input 
                                                type="text" 
                                                placeholder="00:00" 
                                                value={videoTimestamp}
                                                onChange={(e) => setVideoTimestamp(e.target.value)}
                                                className="w-full p-2.5 bg-white dark:bg-[#151a21] border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Descrição da Alteração</label>
                                            <input 
                                                type="text" 
                                                placeholder="Descreva o ajuste..." 
                                                value={videoFeedback}
                                                onChange={(e) => setVideoFeedback(e.target.value)}
                                                className="w-full p-2.5 bg-white dark:bg-[#151a21] border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddVideoFeedback()}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddVideoFeedback}
                                        disabled={!videoFeedback}
                                        className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20"
                                    >
                                        <Plus size={16}/> Adicionar Correção
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Image Feedback
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Descrição das Alterações</label>
                                <textarea
                                    rows={4}
                                    placeholder="Descreva o que precisa ser ajustado nesta imagem..."
                                    value={imageFeedback}
                                    onChange={(e) => setImageFeedback(e.target.value)}
                                    className="w-full p-3 bg-white dark:bg-[#0b0e11] border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 bg-gray-50 dark:bg-[#0b0e11] border-t border-gray-200 dark:border-slate-800 flex flex-col gap-3">
                        <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Ações Finais
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleSubmitRejection}
                                className="flex-1 py-3 px-4 bg-white dark:bg-[#151a21] text-red-500 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <X size={18} /> Solicitar Alteração
                            </button>
                            <button 
                                onClick={() => {
                                    onApprove(selectedFile.task.id, selectedFile.attachment.id);
                                    setSelectedFile(null);
                                }}
                                className="flex-1 py-3 px-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> Aprovar Ativo
                            </button>
                        </div>
                        
                        {selectedFile.attachment.type === 'video' && (
                            <p className="text-[10px] text-center text-gray-400 mt-1">
                                Ao solicitar alteração, todas as notas serão enviadas ao editor.
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