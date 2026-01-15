
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Printer, Users, Clock, CheckSquare, TrendingUp, BarChart2, Activity, ArrowLeft, AlertTriangle, CheckCircle, ChevronDown, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
<<<<<<< HEAD
import { Task, User, WorkflowStage, CalendarEvent } from '../types';
=======
import { Task, User, WorkflowStage } from '../types';
>>>>>>> fe06aaa8afaf67824d6d0840f5dbca71c1cfdce6

interface ReportsProps {
  tasks: Task[];
  users: User[];
<<<<<<< HEAD
  events: CalendarEvent[];
=======
>>>>>>> fe06aaa8afaf67824d6d0840f5dbca71c1cfdce6
  workflow: WorkflowStage[];
  themeColor: string;
  onTaskClick?: (taskId: string) => void;
}

<<<<<<< HEAD
export const Reports: React.FC<ReportsProps> = ({ tasks = [], users = [], events = [], themeColor }) => {
  const [dateRange, setDateRange] = useState('Últimos 30 Dias');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

=======
export const Reports: React.FC<ReportsProps> = ({ tasks = [], users = [], themeColor }) => {
  const [dateRange, setDateRange] = useState('Últimos 30 Dias');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
>>>>>>> fe06aaa8afaf67824d6d0840f5dbca71c1cfdce6
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const now = Date.now();
    const oneDay = 86400000;
    let startTime = 0;

    switch (dateRange) {
      case 'Últimos 7 Dias': startTime = now - (7 * oneDay); break;
      case 'Últimos 30 Dias': startTime = now - (30 * oneDay); break;
      case 'Este Mês': startTime = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(); break;
      case 'Mês Passado': startTime = now - (60 * oneDay); break;
      case 'Todo o Período': default: startTime = 0; break;
    }

    return tasks.filter(t => {
      const taskTimestamp = parseInt(t.id.split('-')[1]) || t.dueDate;
      return taskTimestamp >= startTime;
    });
  }, [tasks, dateRange]);

  const kpis = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => ['approved', 'published'].includes(t.stage)).length;
    const totalTime = filteredTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
<<<<<<< HEAD

    return {
      total,
      completed,
      approvalRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgTime: total > 0 ? (totalTime / 60 / 8).toFixed(1) : '0',
      activeMembers: users.filter(u => filteredTasks.some(t => t.assigneeId === u.id)).length,
      onTime: total > 0 ? 100 : 0
    };
  }, [filteredTasks, users]);

  const selectedUser = useMemo(() =>
    selectedUserId ? users.find(u => u.id === selectedUserId) : null
    , [selectedUserId, users]);
=======
    
    return {
        total,
        completed,
        approvalRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgTime: total > 0 ? (totalTime / 60 / 8).toFixed(1) : '0',
        activeMembers: users.filter(u => filteredTasks.some(t => t.assigneeId === u.id)).length,
        onTime: total > 0 ? 100 : 0
    };
  }, [filteredTasks, users]);

  const selectedUser = useMemo(() => 
    selectedUserId ? users.find(u => u.id === selectedUserId) : null
  , [selectedUserId, users]);
>>>>>>> fe06aaa8afaf67824d6d0840f5dbca71c1cfdce6

  const handlePrint = () => window.print();

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const pieData = useMemo(() => [
    { name: 'Concluído', value: kpis.completed },
    { name: 'Pendente', value: Math.max(0, kpis.total - kpis.completed) }
  ], [kpis]);

  const KPICard = ({ label, value, icon: Icon, colorClass }: any) => {
<<<<<<< HEAD
    const colorMap: any = {
      blue: { bg: "bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400" },
      green: { bg: "bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400" },
      violet: { bg: "bg-violet-500/10", icon: "text-violet-600 dark:text-violet-400" },
      orange: { bg: "bg-orange-500/10", icon: "text-orange-600 dark:text-orange-400" },
      indigo: { bg: "bg-indigo-500/10", icon: "text-indigo-600 dark:text-indigo-400" },
      teal: { bg: "bg-teal-500/10", icon: "text-teal-600 dark:text-teal-400" },
    };
    const theme = colorMap[colorClass] || colorMap.blue;
    return (
      <div className="bg-white dark:bg-[#151a21] p-6 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 flex flex-col justify-between h-36 hover:border-indigo-500/30 transition-all group relative overflow-hidden break-inside-avoid shadow-sm">
        <div className="flex justify-between items-start z-10">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
          <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.icon} transition-transform group-hover:scale-110`}>
            <Icon size={20} />
          </div>
        </div>
        <div className="z-10">
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
        </div>
      </div>
    );
=======
      const colorMap: any = {
          blue: { bg: "bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400" },
          green: { bg: "bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400" },
          violet: { bg: "bg-violet-500/10", icon: "text-violet-600 dark:text-violet-400" },
          orange: { bg: "bg-orange-500/10", icon: "text-orange-600 dark:text-orange-400" },
          indigo: { bg: "bg-indigo-500/10", icon: "text-indigo-600 dark:text-indigo-400" },
          teal: { bg: "bg-teal-500/10", icon: "text-teal-600 dark:text-teal-400" },
      };
      const theme = colorMap[colorClass] || colorMap.blue;
      return (
        <div className="bg-white dark:bg-[#151a21] p-6 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 flex flex-col justify-between h-36 hover:border-indigo-500/30 transition-all group relative overflow-hidden break-inside-avoid shadow-sm">
            <div className="flex justify-between items-start z-10">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.icon} transition-transform group-hover:scale-110`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="z-10">
                <h3 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
            </div>
        </div>
      );
>>>>>>> fe06aaa8afaf67824d6d0840f5dbca71c1cfdce6
  };

  return (
    <div className="space-y-8 pb-10" id="report-container">
<<<<<<< HEAD
      <style>
        {`
          @media print {
            aside, header, .no-print, button { display: none !important; }
            body, #root, main { height: auto !important; overflow: visible !important; background: white !important; }
            main { padding: 0 !important; margin: 0 !important; }
            #report-container { width: 100% !important; padding: 20px !important; margin: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>
      {selectedUserId && selectedUser ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedUserId(null)} className="p-2.5 rounded-full bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a303c] transition-colors"><ArrowLeft size={20} /></button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Relatório de {selectedUser.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Análise de desempenho individual</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-[#151a21] px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2a303c]">{dateRange}</span>
              <button onClick={handlePrint} className={`p-2.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors shadow-lg`}><Printer size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <KPICard label="Total Atribuído" value={filteredTasks.filter(t => t.assigneeId === selectedUserId).length} icon={FileText} colorClass="blue" />
            <KPICard label="Conclusão" value={`${Math.round((filteredTasks.filter(t => t.assigneeId === selectedUserId && ['approved', 'published'].includes(t.stage)).length / (filteredTasks.filter(t => t.assigneeId === selectedUserId).length || 1)) * 100)}%`} icon={CheckCircle} colorClass="green" />
            <KPICard label="Tempo Total" value={formatTime(filteredTasks.filter(t => t.assigneeId === selectedUserId).reduce((acc, t) => acc + (t.timeSpent || 0), 0))} icon={Clock} colorClass="orange" />
            <KPICard label="Atrasadas" value={filteredTasks.filter(t => t.assigneeId === selectedUserId && t.dueDate < Date.now() && !['approved', 'published'].includes(t.stage)).length} icon={AlertTriangle} colorClass="teal" />
          </div>
=======
      {selectedUserId && selectedUser ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                     <button onClick={() => setSelectedUserId(null)} className="p-2.5 rounded-full bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2a303c] transition-colors"><ArrowLeft size={20} /></button>
                     <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Relatório de {selectedUser.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Análise de desempenho individual</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-[#151a21] px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2a303c]">{dateRange}</span>
                    <button onClick={handlePrint} className={`p-2.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors shadow-lg`}><Printer size={20} /></button>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                 <KPICard label="Total Atribuído" value={filteredTasks.filter(t => t.assigneeId === selectedUserId).length} icon={FileText} colorClass="blue" />
                 <KPICard label="Conclusão" value={`${Math.round((filteredTasks.filter(t => t.assigneeId === selectedUserId && ['approved', 'published'].includes(t.stage)).length / (filteredTasks.filter(t => t.assigneeId === selectedUserId).length || 1)) * 100)}%`} icon={CheckCircle} colorClass="green" />
                 <KPICard label="Tempo Total" value={formatTime(filteredTasks.filter(t => t.assigneeId === selectedUserId).reduce((acc, t) => acc + (t.timeSpent || 0), 0))} icon={Clock} colorClass="orange" />
                 <KPICard label="Atrasadas" value={filteredTasks.filter(t => t.assigneeId === selectedUserId && t.dueDate < Date.now() && !['approved', 'published'].includes(t.stage)).length} icon={AlertTriangle} colorClass="teal" />
             </div>
>>>>>>> fe06aaa8afaf67824d6d0840f5dbca71c1cfdce6
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
<<<<<<< HEAD
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Visão Geral</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-light">Métricas globais de produtividade do time</p>
            </div>
            <div className="flex items-center gap-3 no-print relative z-50">
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e232d] hover:text-indigo-600 dark:hover:text-white transition-colors">
                  <Calendar size={16} />{dateRange}<ChevronDown size={14} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] rounded-xl shadow-xl overflow-hidden z-50">
                    {['Últimos 7 Dias', 'Últimos 30 Dias', 'Este Mês', 'Mês Passado', 'Todo o Período'].map((range) => (
                      <button key={range} onClick={() => { setDateRange(range); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-[#1e232d] transition-colors ${dateRange === range ? `text-indigo-600 dark:text-indigo-400 font-bold` : 'text-gray-700 dark:text-gray-300'}`}>{range}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handlePrint} className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-lg hover:bg-indigo-700 transition-all`}><Printer size={16} />Exportar</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <KPICard label="Projetos" value={kpis.total} icon={FileText} colorClass="blue" />
            <KPICard label="Concluídos" value={kpis.completed} icon={BarChart2} colorClass="green" />
            <KPICard label="Aprovação" value={`${kpis.approvalRate}%`} icon={TrendingUp} colorClass="violet" />
            <KPICard label="Tempo Médio" value={`${kpis.avgTime}d`} icon={Clock} colorClass="orange" />
            <KPICard label="Ativos" value={kpis.activeMembers} icon={Users} colorClass="indigo" />
            <KPICard label="No Prazo" value={`${kpis.onTime}%`} icon={CheckSquare} colorClass="teal" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#151a21] p-8 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 flex flex-col h-[450px]">
              <div className="mb-8 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Eficiência por Membro</h3>
                <Activity size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {users.length > 0 && users.some(u => filteredTasks.some(t => t.assigneeId === u.id)) ? (
                  users.map((member) => {
                    const userTasks = filteredTasks.filter(t => t.assigneeId === member.id);
                    if (userTasks.length === 0) return null;
                    const completedCount = userTasks.filter(t => ['approved', 'published'].includes(t.stage)).length;
                    const efficiency = Math.round((completedCount / userTasks.length) * 100);
                    return (
                      <div key={member.id} onClick={() => setSelectedUserId(member.id)} className="group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1e232d] transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#2a303c]" alt={member.name} />
                            <div><span className="font-bold text-gray-900 dark:text-white block text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{member.name}</span><span className="text-[10px] text-gray-500 uppercase">{member.role}</span></div>
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{efficiency}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-[#0b0e11] rounded-full overflow-hidden border border-gray-200 dark:border-[#2a303c]/30">
                          <div className="h-full bg-indigo-500" style={{ width: `${efficiency}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                    <Users size={40} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Sem dados de membros</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#151a21] p-8 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 h-[450px] flex flex-col items-center justify-center relative overflow-hidden">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white absolute top-8 left-8">Status Geral</h3>
              {kpis.total > 0 ? (
                <div className="w-full h-64 mt-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#6366f1" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', color: '#111', border: '1px solid #ddd' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-bold text-gray-500">Concluído</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-xs font-bold text-gray-500">Pendente</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <BarChart2 size={48} className="mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhum dado para exibir</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO DE REUNIÕES */}
      <div className="bg-white dark:bg-[#151a21] p-8 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Histórico de Reuniões</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registro completo de eventos realizados</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className="text-left py-4 px-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Data</th>
                <th className="text-left py-4 px-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Evento</th>
                <th className="text-left py-4 px-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Participantes</th>
                <th className="text-left py-4 px-4 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.filter(e => e.completed || new Date(e.end).getTime() < Date.now()).sort((a, b) => b.start - a.start).map(event => (
                <tr key={event.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e2235]/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(event.start).toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs text-gray-500">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">{event.title}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${event.type === 'meeting' ? 'text-indigo-500' : 'text-gray-400'}`}>{event.type}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex -space-x-2">
                      {event.attendeeIds?.map(uid => {
                        const user = users.find(u => u.id === uid);
                        return user ? <img key={uid} src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#151a21]" title={user.name} /> : null;
                      })}
                      {(!event.attendeeIds || event.attendeeIds.length === 0) && <span className="text-xs text-gray-400 italic">Sem participantes</span>}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {event.completed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle size={12} /> Realizada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-500 text-[10px] font-black uppercase tracking-wider">
                        Finalizada
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {events.filter(e => e.completed || new Date(e.end).getTime() < Date.now()).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">Nenhum histórico de reunião encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
=======
              <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Visão Geral</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-light">Métricas globais de produtividade do time</p>
              </div>
              <div className="flex items-center gap-3 no-print relative z-50">
                   <div className="relative" ref={dropdownRef}>
                       <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e232d] hover:text-indigo-600 dark:hover:text-white transition-colors">
                           <Calendar size={16} />{dateRange}<ChevronDown size={14} />
                       </button>
                       {isDropdownOpen && (
                         <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] rounded-xl shadow-xl overflow-hidden z-50">
                           {['Últimos 7 Dias', 'Últimos 30 Dias', 'Este Mês', 'Mês Passado', 'Todo o Período'].map((range) => (
                             <button key={range} onClick={() => { setDateRange(range); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-[#1e232d] transition-colors ${dateRange === range ? `text-indigo-600 dark:text-indigo-400 font-bold` : 'text-gray-700 dark:text-gray-300'}`}>{range}</button>
                           ))}
                         </div>
                       )}
                   </div>
                   <button onClick={handlePrint} className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-lg hover:bg-indigo-700 transition-all`}><Printer size={16} />Exportar</button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <KPICard label="Projetos" value={kpis.total} icon={FileText} colorClass="blue" />
              <KPICard label="Concluídos" value={kpis.completed} icon={BarChart2} colorClass="green" />
              <KPICard label="Aprovação" value={`${kpis.approvalRate}%`} icon={TrendingUp} colorClass="violet" />
              <KPICard label="Tempo Médio" value={`${kpis.avgTime}d`} icon={Clock} colorClass="orange" />
              <KPICard label="Ativos" value={kpis.activeMembers} icon={Users} colorClass="indigo" />
              <KPICard label="No Prazo" value={`${kpis.onTime}%`} icon={CheckSquare} colorClass="teal" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#151a21] p-8 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 flex flex-col h-[450px]">
                  <div className="mb-8 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Eficiência por Membro</h3>
                      <Activity size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                      {users.length > 0 && users.some(u => filteredTasks.some(t => t.assigneeId === u.id)) ? (
                        users.map((member) => {
                            const userTasks = filteredTasks.filter(t => t.assigneeId === member.id);
                            if (userTasks.length === 0) return null;
                            const completedCount = userTasks.filter(t => ['approved', 'published'].includes(t.stage)).length;
                            const efficiency = Math.round((completedCount / userTasks.length) * 100);
                            return (
                                <div key={member.id} onClick={() => setSelectedUserId(member.id)} className="group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1e232d] transition-colors">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatar} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#2a303c]" alt={member.name} />
                                            <div><span className="font-bold text-gray-900 dark:text-white block text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{member.name}</span><span className="text-[10px] text-gray-500 uppercase">{member.role}</span></div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{efficiency}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-[#0b0e11] rounded-full overflow-hidden border border-gray-200 dark:border-[#2a303c]/30">
                                        <div className="h-full bg-indigo-500" style={{ width: `${efficiency}%` }}></div>
                                    </div>
                                </div>
                            );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                            <Users size={40} className="mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">Sem dados de membros</p>
                        </div>
                      )}
                  </div>
              </div>

              <div className="bg-white dark:bg-[#151a21] p-8 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 h-[450px] flex flex-col items-center justify-center relative overflow-hidden">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white absolute top-8 left-8">Status Geral</h3>
                  {kpis.total > 0 ? (
                    <div className="w-full h-64 mt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                  data={pieData} 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={70} 
                                  outerRadius={90} 
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#6366f1" />
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', color: '#111', border: '1px solid #ddd' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-bold text-gray-500">Concluído</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                <span className="text-xs font-bold text-gray-500">Pendente</span>
                            </div>
                        </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <BarChart2 size={48} className="mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Nenhum dado para exibir</p>
                    </div>
                  )}
              </div>
          </div>
        </div>
      )}
>>>>>>> fe06aaa8afaf67824d6d0840f5dbca71c1cfdce6
    </div>
  );
};
