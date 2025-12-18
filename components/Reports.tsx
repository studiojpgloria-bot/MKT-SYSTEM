
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Printer, Users, Clock, CheckSquare, TrendingUp, BarChart2, Activity, ArrowLeft, AlertTriangle, CheckCircle, Hourglass, ChevronDown, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Task, User, WorkflowStage } from '../types';

interface ReportsProps {
  tasks: Task[];
  users: User[];
  workflow: WorkflowStage[];
  themeColor: string;
  onTaskClick?: (taskId: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ tasks = [], users = [], workflow = [], themeColor, onTaskClick }) => {
  const [dateRange, setDateRange] = useState('Últimos 30 Dias');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
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

    return tasks.filter(t => t.dueDate >= startTime || t.timeSpent > 0);
  }, [tasks, dateRange]);

  const kpis = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => ['approved', 'published'].includes(t.stage)).length;
    const totalTime = filteredTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    
    return {
        total,
        completed,
        approvalRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgTime: total > 0 ? (totalTime / 60 / 8).toFixed(1) : '0',
        activeMembers: users.filter(u => filteredTasks.some(t => t.assigneeId === u.id)).length,
        onTime: 95
    };
  }, [filteredTasks, users]);

  const selectedUser = useMemo(() => 
    selectedUserId ? users.find(u => u.id === selectedUserId) : null
  , [selectedUserId, users]);

  const handlePrint = () => window.print();

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const KPICard = ({ label, value, icon: Icon, colorClass }: any) => {
      const colorMap: any = {
          blue: { bg: "bg-blue-500/10", icon: "text-blue-400" },
          green: { bg: "bg-emerald-500/10", icon: "text-emerald-400" },
          violet: { bg: "bg-violet-500/10", icon: "text-violet-400" },
          orange: { bg: "bg-orange-500/10", icon: "text-orange-400" },
          indigo: { bg: "bg-indigo-500/10", icon: "text-indigo-400" },
          teal: { bg: "bg-teal-500/10", icon: "text-teal-400" },
      };
      const theme = colorMap[colorClass] || colorMap.blue;
      return (
        <div className="bg-[#151a21] p-6 rounded-3xl border border-[#2a303c]/50 flex flex-col justify-between h-36 hover:border-indigo-500/30 transition-all group relative overflow-hidden break-inside-avoid shadow-sm">
            <div className="flex justify-between items-start z-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.icon} transition-transform group-hover:scale-110`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="z-10">
                <h3 className="text-4xl font-bold text-white tracking-tight">{value}</h3>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-8 pb-10" id="report-container">
      {selectedUserId && selectedUser ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                     <button onClick={() => setSelectedUserId(null)} className="p-2.5 rounded-full bg-[#151a21] border border-[#2a303c] text-white hover:bg-[#2a303c] transition-colors"><ArrowLeft size={20} /></button>
                     <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Relatório de {selectedUser.name}</h1>
                        <p className="text-sm text-gray-400">Análise de desempenho individual</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 bg-[#151a21] px-4 py-2 rounded-lg border border-[#2a303c]">{dateRange}</span>
                    <button onClick={handlePrint} className={`p-2.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors shadow-lg`}><Printer size={20} /></button>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                 <KPICard label="Total Atribuído" value={filteredTasks.filter(t => t.assigneeId === selectedUserId).length} icon={FileText} colorClass="blue" />
                 <KPICard label="Conclusão" value={`${Math.round((filteredTasks.filter(t => t.assigneeId === selectedUserId && ['approved', 'published'].includes(t.stage)).length / (filteredTasks.filter(t => t.assigneeId === selectedUserId).length || 1)) * 100)}%`} icon={CheckCircle} colorClass="green" />
                 <KPICard label="Tempo Total" value={formatTime(filteredTasks.filter(t => t.assigneeId === selectedUserId).reduce((acc, t) => acc + (t.timeSpent || 0), 0))} icon={Clock} colorClass="orange" />
                 <KPICard label="Atrasadas" value={filteredTasks.filter(t => t.assigneeId === selectedUserId && t.dueDate < Date.now() && !['approved', 'published'].includes(t.stage)).length} icon={AlertTriangle} colorClass="teal" />
             </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
                  <p className="text-sm text-gray-400 mt-1 font-light">Métricas globais de produtividade do time</p>
              </div>
              <div className="flex items-center gap-3 no-print relative z-50">
                   <div className="relative" ref={dropdownRef}>
                       <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 px-4 py-2.5 bg-[#151a21] border border-[#2a303c] rounded-full text-sm font-medium text-gray-300 hover:bg-[#1e232d] hover:text-white transition-colors">
                           <Calendar size={16} />{dateRange}<ChevronDown size={14} />
                       </button>
                       {isDropdownOpen && (
                         <div className="absolute right-0 top-full mt-2 w-48 bg-[#151a21] border border-[#2a303c] rounded-xl shadow-xl overflow-hidden z-50">
                           {['Últimos 7 Dias', 'Últimos 30 Dias', 'Este Mês', 'Mês Passado', 'Todo o Período'].map((range) => (
                             <button key={range} onClick={() => { setDateRange(range); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-[#1e232d] transition-colors ${dateRange === range ? `text-indigo-400 font-bold` : 'text-gray-300'}`}>{range}</button>
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
              <div className="bg-[#151a21] p-8 rounded-3xl border border-[#2a303c]/50 flex flex-col h-[450px]">
                  <div className="mb-8 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Produtividade por Membro</h3>
                      <Activity size={16} className="text-gray-500" />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                      {users.map((member) => {
                          const userTasks = filteredTasks.filter(t => t.assigneeId === member.id);
                          if (userTasks.length === 0) return null;
                          const completedCount = userTasks.filter(t => ['approved', 'published'].includes(t.stage)).length;
                          const efficiency = Math.round((completedCount / userTasks.length) * 100);
                          return (
                              <div key={member.id} onClick={() => setSelectedUserId(member.id)} className="group cursor-pointer p-2 rounded-2xl hover:bg-[#1e232d] transition-colors">
                                  <div className="flex justify-between items-center mb-3">
                                      <div className="flex items-center gap-3">
                                          <img src={member.avatar} className="w-10 h-10 rounded-full border-2 border-[#2a303c]" />
                                          <div><span className="font-bold text-white block text-sm group-hover:text-blue-400">{member.name}</span><span className="text-[10px] text-gray-500 uppercase">{member.role}</span></div>
                                      </div>
                                      <span className="text-sm font-bold text-white">{efficiency}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-[#0b0e11] rounded-full overflow-hidden border border-[#2a303c]/30">
                                      <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500" style={{ width: `${efficiency}%` }}></div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>

              <div className="bg-[#151a21] p-8 rounded-3xl border border-[#2a303c]/50 h-[450px] flex flex-col items-center justify-center relative">
                  <h3 className="text-xl font-bold text-white absolute top-8 left-8">Status Geral</h3>
                  <div className="w-full h-64 mt-10">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={[{name: 'Concluído', value: kpis.completed}, {name: 'Pendente', value: kpis.total - kpis.completed}]} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value">
                                  <Cell fill="#10b981" /><Cell fill="#3b82f6" />
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0b0e11', border: 'none', borderRadius: '12px' }} />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};
