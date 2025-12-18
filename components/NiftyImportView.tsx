
import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileText, X, ChevronRight, Play, Download, Loader2, Info, UserPlus, Filter } from 'lucide-react';
import { Task, User, TaskPriority, WorkflowStage } from '../types';

interface CSVRow {
  "Task Name": string;
  "Description": string;
  "Assignee": string;
  "Status": string;
  "Priority": string;
  "Due Date": string;
  "Project Name": string;
  "Created Date": string;
  "Tags": string;
  [key: string]: string;
}

interface ImportItem {
  id: string;
  row: CSVRow;
  mappedTask: Partial<Task> | null;
  errors: string[];
  status: 'pending' | 'processing' | 'success' | 'error' | 'queued';
  actionTaken?: string;
}

interface NiftyImportViewProps {
  users: User[];
  workflow: WorkflowStage[];
  onImportTasks: (tasks: Task[]) => void;
  themeColor: string;
  allTasks: Task[];
}

export const NiftyImportView: React.FC<NiftyImportViewProps> = ({ users, workflow, onImportTasks, themeColor, allTasks }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Settings
  const [applyAvailability, setApplyAvailability] = useState(true);
  const [markCriticalUrgent, setMarkCriticalUrgent] = useState(true);
  const [targetStageId, setTargetStageId] = useState(workflow[0].id);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CSV Logic ---
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).filter(line => line.trim() !== '').map(line => {
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj as CSVRow;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      validateRows(rows);
      setStep(2);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // --- Validation & Mapping ---
  const validateRows = (rows: CSVRow[]) => {
    const validatedItems: ImportItem[] = rows.map((row, index) => {
      const errors: string[] = [];
      
      if (!row["Task Name"]) errors.push("Nome da tarefa é obrigatório.");
      
      // Map Priority
      let priority = TaskPriority.MEDIUM;
      const p = row.Priority?.toLowerCase();
      if (p === 'low') priority = TaskPriority.LOW;
      if (p === 'high') priority = TaskPriority.HIGH;
      if (p === 'critical') priority = TaskPriority.URGENT;

      // Find User
      const assigneeName = row.Assignee || '';
      const user = users.find(u => 
        u.email.toLowerCase() === assigneeName.toLowerCase() || 
        u.name.toLowerCase().includes(assigneeName.toLowerCase())
      );
      if (!user && assigneeName) errors.push(`Usuário "${assigneeName}" não encontrado.`);

      // Map Status
      let stageId = targetStageId;
      const s = row.Status?.toLowerCase();
      if (s === 'complete') stageId = 'approved'; 
      if (s === 'in progress') stageId = 'design';

      // Parse Date
      let dueDate = Date.now() + (7 * 86400000); 
      if (row["Due Date"]) {
          const d = new Date(row["Due Date"]);
          if (!isNaN(d.getTime())) dueDate = d.getTime();
      }

      const mappedTask: Partial<Task> = {
          id: `t-imp-${Date.now()}-${index}`,
          title: row["Task Name"],
          description: row.Description || '',
          stage: stageId,
          priority: priority,
          assigneeId: user?.id || users[0].id,
          dueDate: dueDate,
          client: row["Project Name"] || 'Nifty Import',
          tags: row.Tags ? row.Tags.split(';').map(t => t.trim()) : [],
          subtasks: [],
          attachments: [],
          comments: [],
          timeSpent: 0,
          accepted: row.Status?.toLowerCase() !== 'to do'
      };

      return {
        id: `row-${index}`,
        row,
        mappedTask,
        errors,
        status: 'pending'
      };
    });
    setItems(validatedItems);
  };

  // --- Processing ---
  const runImport = async () => {
    setIsProcessing(true);
    const successfullyMappedTasks: Task[] = [];
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.errors.length > 0) {
            setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'error' } : p));
            continue;
        }

        const task = item.mappedTask as Task;
        let action = 'Importado';
        let finalStatus: ImportItem['status'] = 'success';

        // Check availability
        if (applyAvailability) {
            const isUserBusy = allTasks.some(t => 
                t.assigneeId === task.assigneeId && 
                ['briefing', 'design', 'review'].includes(t.stage)
            );
            
            if (isUserBusy && task.priority !== TaskPriority.URGENT) {
                finalStatus = 'queued';
                action = 'Na Fila (Ocupado)';
            }
        }

        // Duplicates check
        const isDuplicate = allTasks.some(t => 
            t.title.toLowerCase() === task.title.toLowerCase() && 
            t.assigneeId === task.assigneeId
        );
        if (isDuplicate) {
            action = 'Duplicata Ignorada';
            finalStatus = 'pending'; 
        } else {
            successfullyMappedTasks.push(task);
        }

        setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: finalStatus, actionTaken: action } : p));
        setProgress(Math.round(((i + 1) / items.length) * 100));
        
        if (i % 20 === 0) await new Promise(r => setTimeout(r, 10));
    }

    onImportTasks(successfullyMappedTasks);
    setIsProcessing(false);
    setStep(4);
  };

  const reset = () => {
    setStep(1);
    setItems([]);
    setFileName('');
    setProgress(0);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header Area */}
      <div className="bg-[#151a21] border border-[#2a303c] rounded-[32px] p-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
              <h1 className="text-3xl font-black text-white mb-2">Importar do Nifty</h1>
              <p className="text-gray-500 max-w-lg">Transfira seus projetos e tarefas do Nifty para nosso CRM de forma automatizada e inteligente.</p>
          </div>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center gap-4 bg-[#151a21] border border-[#2a303c] rounded-2xl p-4">
          {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step === s ? `bg-${themeColor}-600 text-white` : step > s ? 'bg-green-500/20 text-green-400' : 'bg-[#0b0e11] text-gray-600 border border-[#2a303c]'}`}>
                      {step > s ? <CheckCircle size={16}/> : s}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${step === s ? 'text-white' : 'text-gray-600'}`}>
                      {s === 1 ? 'Upload' : s === 2 ? 'Mapeamento' : s === 3 ? 'Processando' : 'Resultado'}
                  </span>
                  {s < 4 && <div className="w-8 h-px bg-[#2a303c]"></div>}
              </div>
          ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
          <div className="bg-[#151a21] border border-[#2a303c] rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-xl aspect-video border-2 border-dashed border-[#2a303c] rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
              >
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadCloud size={32} />
                  </div>
                  <div>
                      <p className="text-lg font-bold text-white">Selecione o arquivo CSV do Nifty</p>
                      <p className="text-sm text-gray-500">ou arraste e solte o arquivo aqui</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FileText size={14}/> CSV format</span>
                  <span className="flex items-center gap-1"><Info size={14}/> UTF-8 encoding</span>
              </div>
          </div>
      )}

      {/* Step 2: Mapping & Rules */}
      {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#151a21] border border-[#2a303c] rounded-[32px] p-6">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                          <Filter size={20} className="text-blue-400"/> Preview dos Dados ({items.length} itens)
                      </h3>
                      <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left border-separate border-spacing-y-2">
                              <thead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                  <tr>
                                      <th className="pb-2 px-4">Tarefa</th>
                                      <th className="pb-2">Assignee</th>
                                      <th className="pb-2">Status</th>
                                      <th className="pb-2">Validação</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {items.slice(0, 10).map(item => (
                                      <tr key={item.id} className="bg-[#0b0e11] rounded-xl overflow-hidden border border-[#2a303c]">
                                          <td className="py-4 px-4 rounded-l-xl">
                                              <p className="font-bold text-sm text-white line-clamp-1">{item.row["Task Name"]}</p>
                                              <p className="text-[10px] text-gray-500">{item.row["Project Name"]}</p>
                                          </td>
                                          <td className="py-4 text-xs text-gray-400">
                                              {item.row.Assignee}
                                          </td>
                                          <td className="py-4">
                                              <span className="px-2 py-1 bg-[#1e232d] text-gray-400 text-[10px] font-bold rounded uppercase">
                                                  {item.row.Status}
                                              </span>
                                          </td>
                                          <td className="py-4 px-4 rounded-r-xl">
                                              {item.errors.length > 0 ? (
                                                  <div className="flex items-center gap-1 text-red-400 text-[10px] font-bold bg-red-400/10 px-2 py-1 rounded">
                                                      <AlertTriangle size={12} /> {item.errors.length} erro(s)
                                                  </div>
                                              ) : (
                                                  <div className="flex items-center gap-1 text-green-400 text-[10px] font-bold bg-green-400/10 px-2 py-1 rounded">
                                                      <CheckCircle size={12} /> Pronto
                                                  </div>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          {items.length > 10 && (
                              <p className="text-center text-xs text-gray-500 mt-4 italic">E mais {items.length - 10} tarefas...</p>
                          )}
                      </div>
                  </div>
              </div>

              <div className="space-y-6">
                  <div className="bg-[#151a21] border border-[#2a303c] rounded-[32px] p-6 space-y-6">
                      <h3 className="text-lg font-bold text-white">Configurações</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Destino no Kanban</label>
                              <select 
                                  value={targetStageId}
                                  onChange={(e) => setTargetStageId(e.target.value)}
                                  className="w-full bg-[#0b0e11] border border-[#2a303c] text-white text-sm rounded-xl p-3 focus:ring-1 focus:ring-blue-500 outline-none"
                              >
                                  {workflow.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                          </div>
                          <div className="p-4 bg-[#0b0e11] rounded-2xl border border-[#2a303c] space-y-4">
                              <label className="flex items-center justify-between cursor-pointer group">
                                  <div className="flex flex-col">
                                      <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Respeitar Disponibilidade</span>
                                      <span className="text-[10px] text-gray-500">Pausa tarefas se usuário estiver ocupado</span>
                                  </div>
                                  <input type="checkbox" checked={applyAvailability} onChange={(e) => setApplyAvailability(e.target.checked)} className="sr-only peer" />
                                  <div className="w-10 h-5 bg-[#2a303c] rounded-full relative after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-5"></div>
                              </label>
                              <label className="flex items-center justify-between cursor-pointer group">
                                  <div className="flex flex-col">
                                      <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Critical = Urgente</span>
                                      <span className="text-[10px] text-gray-500">Ignora filas para tarefas críticas</span>
                                  </div>
                                  <input type="checkbox" checked={markCriticalUrgent} onChange={(e) => setMarkCriticalUrgent(e.target.checked)} className="sr-only peer" />
                                  <div className="w-10 h-5 bg-[#2a303c] rounded-full relative after:absolute after:top-1 after:left-1 after:w-3 after:h-3 after:bg-white after:rounded-full after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-5"></div>
                              </label>
                          </div>
                      </div>
                      <button onClick={() => setStep(3)} className={`w-full py-4 bg-${themeColor}-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}>
                          <Play size={18} fill="currentColor" /> Iniciar Importação
                      </button>
                      <button onClick={reset} className="w-full py-3 text-sm text-gray-500 hover:text-white transition-colors">Mudar arquivo</button>
                  </div>
              </div>
          </div>
      )}

      {/* Step 3: Processing */}
      {step === 3 && (
          <div className="bg-[#151a21] border border-[#2a303c] rounded-[32px] p-12 flex flex-col items-center justify-center text-center space-y-8">
              {!isProcessing && progress === 0 ? (
                  <>
                    <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center">
                        <UploadCloud size={40} className="animate-bounce" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Tudo pronto!</h2>
                        <p className="text-gray-500">Clique no botão abaixo para processar {items.length} tarefas.</p>
                    </div>
                    <button onClick={runImport} className={`px-12 py-4 bg-${themeColor}-600 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all`}>
                        COMEÇAR AGORA
                    </button>
                  </>
              ) : (
                  <>
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-[#2a303c] stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                            <circle className={`text-${themeColor}-500 stroke-current transition-all duration-300`} strokeWidth="8" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white">{progress}%</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Processando Importação</h2>
                        <p className="text-gray-500">Mapeando dados e aplicando regras de negócio...</p>
                    </div>
                    <div className="w-full max-w-md bg-[#0b0e11] rounded-2xl border border-[#2a303c] p-4 h-32 overflow-y-auto custom-scrollbar text-left font-mono text-[10px] text-blue-400/70">
                        {items.filter(i => i.status !== 'pending').map((item, idx) => (
                            <div key={idx} className="mb-1">
                                {`[LOG] ${item.status.toUpperCase()} -> ${item.actionTaken || 'Tarefa processada'} : ${item.row["Task Name"]}`}
                            </div>
                        ))}
                    </div>
                  </>
              )}
          </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#151a21] p-6 rounded-3xl border border-[#2a303c] text-center">
                      <p className="text-4xl font-black text-white">{items.length}</p>
                      <p className="text-xs font-bold text-gray-500 uppercase mt-2">Total</p>
                  </div>
                  <div className="bg-[#151a21] p-6 rounded-3xl border border-green-500/30 text-center">
                      <p className="text-4xl font-black text-green-400">{items.filter(i => i.status === 'success').length}</p>
                      <p className="text-xs font-bold text-green-500/50 uppercase mt-2">Sucesso</p>
                  </div>
                  <div className="bg-[#151a21] p-6 rounded-3xl border border-blue-500/30 text-center">
                      <p className="text-4xl font-black text-blue-400">{items.filter(i => i.status === 'queued').length}</p>
                      <p className="text-xs font-bold text-blue-500/50 uppercase mt-2">Em Fila</p>
                  </div>
                  <div className="bg-[#151a21] p-6 rounded-3xl border border-red-500/30 text-center">
                      <p className="text-4xl font-black text-red-400">{items.filter(i => i.status === 'error').length}</p>
                      <p className="text-xs font-bold text-red-500/50 uppercase mt-2">Erros</p>
                  </div>
              </div>
              <div className="bg-[#151a21] border border-[#2a303c] rounded-[32px] p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle size={40} />
                  </div>
                  <div>
                      <h2 className="text-3xl font-black text-white">Importação Finalizada!</h2>
                      <p className="text-gray-500">Os dados foram integrados com sucesso ao seu CRM.</p>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                      <button onClick={() => window.location.href = '#crm'} className={`px-8 py-3 bg-${themeColor}-600 text-white font-bold rounded-xl shadow-lg`}>Ir para o Kanban</button>
                      <button onClick={reset} className="px-8 py-3 bg-[#0b0e11] border border-[#2a303c] text-white font-bold rounded-xl">Nova Importação</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
