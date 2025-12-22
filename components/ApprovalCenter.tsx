
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Check, X, Eye, Download, MessageSquare, Play, Film, Plus, Trash2, Clock, Pause, Target, CheckCircle } from 'lucide-react';
import { Task, TaskStage, Attachment } from '../types';

interface ApprovalCenterProps {
  tasks: Task[];
  onApprove: (taskId: string, attachmentId: string) => void;
  onReject: (taskId: string, attachmentId: string, feedback?: string) => void;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ tasks, onApprove, onReject }) => {
  const [selectedFile, setSelectedFile] = useState<{ task: Task; attachment: Attachment } | null>(null);
  const [videoTimestamp, setVideoTimestamp] = useState('');
  const [videoFeedback, setVideoFeedback] = useState('');
  const [feedbackList, setFeedbackList] = useState<{time: string, note: string}[]>([]);
  const [imageFeedback, setImageFeedback] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

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

  const pendingApprovals = tasks.filter(
    t => (t.stage === TaskStage.REVIEW || t.stage === TaskStage.DESIGN || t.stage === 'review') && 
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

  const handleAddVideoFeedback = () => {
      if (videoFeedback.trim()) {
          const timeToUse = videoTimestamp || formatTime(currentTime);
          setFeedbackList([...feedbackList, { 
              time: timeToUse, 
              note: videoFeedback 
          }].sort((a, b) => parseTime(a.time) - parseTime(b.time)));
          setVideoFeedback('');
          setVideoTimestamp('');
      }
  };

  const handleCaptureCurrentTime = () => setVideoTimestamp(formatTime(currentTime));
  const handleRemoveFeedbackItem = (index: number) => {
      const newList = [...feedbackList];
      newList.splice(index, 1);
      setFeedbackList(newList);
  };

  const handleSubmitRejection = () => {
      if (selectedFile) {
          let finalFeedback = '';
          if (selectedFile.attachment.type === 'video') {
              finalFeedback = feedbackList.length > 0 
                  ? feedbackList.map(f => `[${f.time}] ${f.note}`).join('\n')
                  : `[${videoTimestamp || '00:00'}] ${videoFeedback || 'Correções solicitadas.'}`;
          } else {
              finalFeedback = imageFeedback || 'Ajustes solicitados no arquivo.';
          }
          onReject(selectedFile.task.id, selectedFile.attachment.id, finalFeedback);
          setSelectedFile(null);
      }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
  };

  const togglePlay = async () => {
    if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else await videoRef.current.play();
        setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        const curr = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        setCurrentTime(curr);
        setProgress(dur > 0 ? (curr / dur) * 100 : 0);
        if (curr === dur) setIsPlaying(false);
    }
  };

  const jumpToTime = (timeStr: string) => {
      const seconds = parseTime(timeStr);
      if (videoRef.current && isFinite(videoRef.current.duration)) {
          videoRef.current.currentTime = seconds;
          setCurrentTime(seconds);
          if (!isPlaying) togglePlay();
      }
  };

  const isFeedbackActive = (timeStr: string) => Math.abs(currentTime - parseTime(timeStr)) < 1.5;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.min(Math.max(0, x / rect.width), 1);
      const dur = videoRef.current.duration;
      if (!isFinite(dur)) return;
      videoRef.current.currentTime = percentage * dur;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] rounded-[40px] p-10 overflow-hidden relative group shadow-sm transition-colors">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">Central de Aprovações</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-xl font-medium">Revise entregáveis, solicite ajustes com marcação temporal e gerencie a qualidade final da produção.</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#0b0e11] px-6 py-4 rounded-3xl border border-gray-200 dark:border-[#2a303c] flex flex-col items-center">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-500">{pendingApprovals.length}</span>
                  <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Pendentes</span>
              </div>
          </div>
      </div>

      {pendingApprovals.length === 0 ? (
         <div className="text-center py-20 bg-white dark:bg-[#151a21] rounded-[40px] border border-dashed border-gray-200 dark:border-[#2a303c]">
             <CheckCircle size={48} className="mx-auto text-gray-300 dark:text-gray-800 mb-4" />
             <p className="text-gray-500 dark:text-gray-500 font-bold uppercase tracking-widest text-sm">Tudo em ordem! Nenhum item pendente.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingApprovals.map(task => (
            <div key={task.id} className="bg-white dark:bg-[#151a21] rounded-[32px] border border-gray-200 dark:border-[#2a303c] overflow-hidden group shadow-sm">
              <div className="p-6 border-b border-gray-100 dark:border-[#2a303c]/50 flex justify-between items-center bg-gray-50 dark:bg-[#0b0e11]/50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                        {task.client.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{task.title}</h3>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">{task.client} • ID: #{task.id.slice(-4)}</p>
                    </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-[#2a303c]/30">
                {task.attachments
                  .filter(a => a.category === 'deliverable' && a.status === 'pending')
                  .map(file => (
                  <div key={file.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                    <div 
                        onClick={() => setSelectedFile({ task, attachment: file })}
                        className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-[#0b0e11] rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200 dark:border-[#2a303c] cursor-pointer relative group/thumb"
                    >
                        {file.type === 'image' ? (
                            <img src={file.url} className="w-full h-full object-cover" />
                        ) : file.type === 'video' ? (
                            <Film size={32} className="text-indigo-600 dark:text-indigo-400" />
                        ) : (
                            <FileText size={32} className="text-amber-500" />
                        )}
                        <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all">
                            <Eye size={24} className="text-white" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{file.name}</h4>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 dark:bg-[#0b0e11] px-2 py-0.5 rounded border border-gray-200 dark:border-[#2a303c]">{file.type}</span>
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">AGUARDANDO REVISÃO</span>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={() => handleDownload(file)} className="flex-1 sm:flex-none p-3 bg-white dark:bg-[#0b0e11] text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl border border-gray-200 dark:border-[#2a303c] transition-colors"><Download size={20}/></button>
                        <button 
                            onClick={() => setSelectedFile({ task, attachment: file })}
                            className="flex-1 sm:flex-none px-8 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                        >
                            Avaliar Entregável
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Visualizador */}
      {selectedFile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-hidden">
            <div className="relative w-full max-w-[90vw] h-[90vh] flex flex-col lg:flex-row bg-white dark:bg-[#0b0e11] rounded-[40px] overflow-hidden shadow-2xl border border-gray-200 dark:border-[#2a303c]">
                
                {/* Media Area */}
                <div className="flex-1 bg-gray-900 flex items-center justify-center relative border-r border-gray-200 dark:border-[#2a303c]">
                    <button onClick={() => setSelectedFile(null)} className="absolute top-6 right-6 z-50 p-3 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
                        <X size={24} />
                    </button>

                    {selectedFile.attachment.type === 'image' ? (
                        <img src={selectedFile.attachment.url} className="max-w-full max-h-full object-contain p-8" />
                    ) : selectedFile.attachment.type === 'pdf' ? (
                        <div className="w-full h-full p-4 bg-white">
                            <iframe src={`${selectedFile.attachment.url}#view=FitH`} className="w-full h-full border-none" title="PDF Viewer" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col justify-center relative group">
                             <video ref={videoRef} className="w-full h-full object-contain" src={selectedFile.attachment.url} onClick={togglePlay} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} />
                             {!isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={togglePlay}>
                                    <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-2xl scale-110"><Play size={40} fill="white" /></div>
                                </div>
                             )}
                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black p-8 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                 <div className="relative w-full h-2.5 bg-white/10 rounded-full cursor-pointer mb-4" onClick={handleSeek}>
                                     <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                                     {feedbackList.map((fb, idx) => {
                                         const fbSecs = parseTime(fb.time);
                                         const fbPct = (duration > 0 && isFinite(duration)) ? (fbSecs / duration) * 100 : 0;
                                         return (
                                             <button 
                                                key={idx} 
                                                onClick={(e) => { e.stopPropagation(); jumpToTime(fb.time); }}
                                                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#0b0e11] transition-all hover:scale-150 ${isFeedbackActive(fb.time) ? 'bg-indigo-400 scale-125' : 'bg-amber-400'}`}
                                                style={{ left: `${fbPct}%` }}
                                                title={`${fb.time}: ${fb.note}`}
                                             />
                                         );
                                     })}
                                 </div>
                                 <div className="flex items-center justify-between text-white font-black text-xs">
                                     <div className="flex items-center gap-6">
                                         <button onClick={togglePlay}>{isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}</button>
                                         <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Feedback */}
                <div className="w-full lg:w-[450px] bg-white dark:bg-[#0b0e11] flex flex-col border-l border-gray-200 dark:border-[#2a303c] shrink-0">
                    <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-10 flex items-center gap-4">
                            <MessageSquare className="text-indigo-600 dark:text-indigo-500" size={28}/> Revisão
                        </h4>

                        {selectedFile.attachment.type === 'video' ? (
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    {feedbackList.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-[#2a303c] rounded-[32px] text-gray-400 dark:text-gray-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma nota inserida</div>
                                    ) : (
                                        feedbackList.map((item, idx) => {
                                            const active = isFeedbackActive(item.time);
                                            return (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => jumpToTime(item.time)} 
                                                    className={`flex justify-between items-center p-4 rounded-2xl border transition-all cursor-pointer group ${active ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/50' : 'bg-gray-50 dark:bg-[#151a21] border-transparent hover:border-gray-200 dark:hover:border-[#2a303c]'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-mono font-black text-[10px] px-2 py-1 rounded-lg ${active ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-[#0b0e11] text-indigo-600 dark:text-indigo-400'}`}>{item.time}</span>
                                                        <span className={`text-sm font-bold ${active ? 'text-indigo-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{item.note}</span>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveFeedbackItem(idx); }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="bg-gray-50 dark:bg-[#151a21] p-6 rounded-[32px] border border-gray-200 dark:border-[#2a303c] space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-28 relative">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-2 block tracking-widest">Tempo</label>
                                            <input type="text" value={videoTimestamp} onChange={(e) => setVideoTimestamp(e.target.value)} className="w-full bg-white dark:bg-[#0b0e11] border border-gray-200 dark:border-[#2a303c] text-gray-900 dark:text-white rounded-xl p-3 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="00:00" />
                                            <button onClick={handleCaptureCurrentTime} className="absolute right-2 bottom-2 p-1.5 text-indigo-600 dark:text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg"><Target size={14} /></button>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-2 block tracking-widest">Nota</label>
                                            <input type="text" value={videoFeedback} onChange={(e) => setVideoFeedback(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddVideoFeedback()} className="w-full bg-white dark:bg-[#0b0e11] border border-gray-200 dark:border-[#2a303c] text-gray-900 dark:text-white rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="O que ajustar?" />
                                        </div>
                                    </div>
                                    <button onClick={handleAddVideoFeedback} disabled={!videoFeedback} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all disabled:opacity-30">Inserir Nota ao Vídeo</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-3 block tracking-widest">Ajustes Necessários</label>
                                <textarea rows={8} value={imageFeedback} onChange={(e) => setImageFeedback(e.target.value)} className="w-full p-6 bg-gray-50 dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] text-gray-900 dark:text-white rounded-[32px] text-sm resize-none focus:ring-1 focus:ring-indigo-500 outline-none placeholder-gray-400 dark:placeholder-gray-800" placeholder="Descreva os ajustes técnicos..." />
                            </div>
                        )}
                    </div>

                    <div className="p-10 bg-white dark:bg-[#0b0e11] border-t border-gray-200 dark:border-[#2a303c] flex flex-col gap-4">
                        <div className="flex gap-4">
                            <button onClick={handleSubmitRejection} className="flex-1 py-5 bg-transparent text-red-500 border border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/5 font-black rounded-[24px] text-[10px] uppercase tracking-widest transition-all">Rejeitar Ativo</button>
                            <button onClick={() => { onApprove(selectedFile.task.id, selectedFile.attachment.id); setSelectedFile(null); }} className="flex-[1.5] py-5 bg-green-600 text-white dark:text-[#0b0e11] font-black rounded-[24px] text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-green-600/20">Aprovar Ativo</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
