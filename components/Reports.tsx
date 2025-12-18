
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Calendar, ChevronDown, Printer, Users, Clock, CheckSquare, TrendingUp, BarChart2, Activity, ArrowLeft, AlertTriangle, CheckCircle, Hourglass, PieChart as PieIcon, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Task, User, WorkflowStage, UserRole, TaskPriority } from '../types';

interface ReportsProps {
  tasks: Task[];
  users: User[];
  workflow: WorkflowStage[];
  themeColor: string;
  onTaskClick?: (taskId: string) => void;
}

export const Reports: React.FC<ReportsProps> = ({ tasks, users, workflow, themeColor, onTaskClick }) => {
  const [dateRange, setDateRange] = useState('Últimos 30 Dias');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Filtering Logic ---
  const getFilteredTasks = () => {
    const now = Date.now();
    const oneDay = 86400000;
    let startTime = 0;

    switch (dateRange) {
      case 'Últimos 7 Dias':
        startTime = now - (7 * oneDay);
        break;
      case 'Últimos 30 Dias':
        startTime = now - (30 * oneDay);
        break;
      case 'Este Mês':
        const today = new Date();
        startTime = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
        break;
      case 'Mês Passado':
        startTime = now - (60 * oneDay);
        break;
      case 'Todo o Período':
      default:
        startTime = 0;
        break;
    }

    return tasks.filter(t => t.dueDate >= startTime || t.timeSpent > 0); 
  };

  const filteredTasks = getFilteredTasks();

  // --- Common Helpers ---
  const handlePrint = () => {
      window.print();
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // --- VIEW: INDIVIDUAL USER REPORT ---
  if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      const userTasks = filteredTasks.filter(t => t.assigneeId === selectedUserId);
      
      if (!user) return null;

      // User KPIs
      const totalUserTasks = userTasks.length;
      const completedUserTasks = userTasks.filter(t => ['approved', 'published'].includes(t.stage)).length;
      const pendingUserTasks = totalUserTasks - completedUserTasks;
      const overdueUserTasks = userTasks.filter(t => t.dueDate < Date.now() && !['approved', 'published'].includes(t.stage)).length;
      const userCompletionRate = totalUserTasks > 0 ? Math.round((completedUserTasks / totalUserTasks) * 100) : 0;
      const userTotalMinutes = userTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);

      // Tasks by Stage Data for Pie Chart
      const stageCounts: Record<string, number> = {};
      userTasks.forEach(t => {
          const stageName = workflow.find(w => w.id === t.stage)?.name || t.stage;
          stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
      });
      const stageData = Object.keys(stageCounts).map((key, index) => ({
          name: key,
          value: stageCounts[key],
          color: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#64748b'][index % 6]
      }));

      return (
        <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-right duration-300">
             {/* Header with Back Button */}
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setSelectedUserId(null)}
                        className="p-2.5 rounded-full bg-[#151a21] border border-[#2a303c] text-white hover:bg-[#2a303c] transition-colors"
                     >
                         <ArrowLeft size={20} />
                     </button>
                     <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Relatório Individual</h1>
                        <p className="text-sm text-gray-400">Análise de desempenho detalhada</p>
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 bg-[#151a21] px-4 py-2 rounded-lg border border-[#2a303c]">{dateRange}</span>
                    <button onClick={handlePrint} className={`p-2.5 bg-${themeColor}-600 rounded-lg text-white hover:bg-${themeColor}-700 transition-colors shadow-lg shadow-${themeColor}-500/20`}>
                        <Printer size={20} />
                    </button>
                 </div>
             </div>

             {/* Profile & Big Stats Row */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Profile Card */}
                 <div className="lg:col-span-2 bg-[#151a21] rounded-2xl p-6 border border-[#2a303c]/50 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                     <div className="relative">
                        <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-2 border-[#2a303c] object-cover" />
                        <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-[#151a21] ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                     </div>
                     <div className="text-center sm:text-left flex-1">
                         <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                         <p className="text-gray-400 text-sm mb-3">{user.email}</p>
                         <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                             <span className="px-3 py-1 rounded-md bg-[#2a303c] text-[10px] font-bold text-gray-300 uppercase tracking-wider">{user.role}</span>
                             <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.status === 'online' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                 {user.status === 'online' ? 'Online' : 'Offline'}
                             </span>
                         </div>
                     </div>
                 </div>

                 {/* KPI Big Cards */}
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[#0b0e11] p-5 rounded-2xl border border-[#2a303c] flex flex-col justify-center items-center text-center">
                         <h3 className="text-3xl font-bold text-white mb-1">{userCompletionRate}%</h3>
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Taxa de Conclusão</p>
                     </div>
                     <div className="bg-[#0b0e11] p-5 rounded-2xl border border-[#2a303c] flex flex-col justify-center items-center text-center">
                         <h3 className="text-3xl font-bold text-white mb-1">{formatTime(userTotalMinutes)}</h3>
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tempo Registrado</p>
                     </div>
                 </div>
             </div>

             {/* Small Stats Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-[#151a21] p-5 rounded-2xl border border-[#2a303c]/50 flex flex-col gap-3 group hover:border-[#3b82f6]/30 transition-colors">
                     <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg w-fit">
                         <FileText size={20} />
                     </div>
                     <div>
                         <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Atribuído</p>
                         <p className="text-2xl font-bold text-white">{totalUserTasks}</p>
                     </div>
                 </div>
                 
                 <div className="bg-[#151a21] p-5 rounded-2xl border border-[#2a303c]/50 flex flex-col gap-3 group hover:border-green-500/30 transition-colors">
                     <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg w-fit">
                         <CheckCircle size={20} />
                     </div>
                     <div>
                         <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Concluídas</p>
                         <p className="text-2xl font-bold text-white">{completedUserTasks}</p>
                     </div>
                 </div>

                 <div className="bg-[#151a21] p-5 rounded-2xl border border-[#2a303c]/50 flex flex-col gap-3 group hover:border-amber-500/30 transition-colors">
                     <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg w-fit">
                         <Hourglass size={20} />
                     </div>
                     <div>
                         <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Em Andamento</p>
                         <p className="text-2xl font-bold text-white">{pendingUserTasks}</p>
                     </div>
                 </div>

                 <div className="bg-[#151a21] p-5 rounded-2xl border border-[#2a303c]/50 flex flex-col gap-3 group hover:border-red-500/30 transition-colors">
                     <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg w-fit">
                         <AlertTriangle size={20} />
                     </div>
                     <div>
                         <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Atrasadas</p>
                         <p className="text-2xl font-bold text-white">{overdueUserTasks}</p>
                     </div>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Chart - Gauge/Donut Style */}
                 <div className="lg:col-span-1 bg-[#151a21] p-6 rounded-2xl border border-[#2a303c]/50 flex flex-col h-[420px] shadow-sm">
                     <h3 className="text-lg font-bold text-white mb-2">Status das Tarefas</h3>
                     <div className="flex-1 relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={6}
                                >
                                    {stageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0b0e11', color: '#fff' }}
                                    itemStyle={{fontSize: '12px', fontWeight: 'bold', color: '#fff'}}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    iconType="circle" 
                                    layout="horizontal"
                                    wrapperStyle={{ fontSize: '11px', paddingTop: '20px', width: '100%' }} 
                                    align="center"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {stageData.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                                Sem dados
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black text-white">{totalUserTasks}</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total</span>
                            </div>
                        )}
                     </div>
                 </div>

                 {/* Task List - Clickable */}
                 <div className="lg:col-span-2 bg-[#151a21] p-6 rounded-2xl border border-[#2a303c]/50 flex flex-col h-[420px] shadow-sm">
                     <h3 className="text-lg font-bold text-white mb-6">Lista de Tarefas Recentes</h3>
                     <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                         {userTasks.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                 <FileText size={48} className="mb-4 opacity-20" />
                                 <p>Nenhuma tarefa encontrada neste período.</p>
                             </div>
                         ) : (
                             <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                                 <thead className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                     <tr>
                                         <th className="pb-2 pl-4">Tarefa</th>
                                         <th className="pb-2">Status</th>
                                         <th className="pb-2">Prioridade</th>
                                         <th className="pb-2 text-right pr-4">Entrega</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {userTasks.map(task => {
                                         const stageName = workflow.find(w => w.id === task.stage)?.name || task.stage;
                                         const isOverdue = task.dueDate < Date.now() && !['approved', 'published'].includes(task.stage);
                                         
                                         return (
                                             <tr 
                                                key={task.id} 
                                                onClick={() => onTaskClick && onTaskClick(task.id)}
                                                className="group bg-[#0b0e11] hover:bg-[#1e232d] transition-all cursor-pointer rounded-lg border-l-2 border-transparent hover:border-l-[#3b82f6]"
                                             >
                                                 <td className="py-4 pl-4 rounded-l-lg border-y border-l border-[#2a303c] border-l-transparent">
                                                     <p className="font-bold text-gray-200 group-hover:text-white transition-colors line-clamp-1 pr-4">{task.title}</p>
                                                     <p className="text-xs text-gray-500">{task.client}</p>
                                                 </td>
                                                 <td className="py-4 border-y border-[#2a303c]">
                                                     <span className="px-2.5 py-1 rounded-md bg-[#2a303c] text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                                                         {stageName}
                                                     </span>
                                                 </td>
                                                 <td className="py-4 border-y border-[#2a303c]">
                                                     <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                         task.priority === TaskPriority.URGENT ? 'text-red-400' :
                                                         task.priority === TaskPriority.HIGH ? 'text-orange-400' :
                                                         'text-blue-400'
                                                     }`}>
                                                         {task.priority}
                                                     </span>
                                                 </td>
                                                 <td className="py-4 text-right pr-4 rounded-r-lg border-y border-r border-[#2a303c]">
                                                     <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                                                         {new Date(task.dueDate).toLocaleDateString()}
                                                     </span>
                                                 </td>
                                             </tr>
                                         );
                                     })}
                                 </tbody>
                             </table>
                         )}
                     </div>
                 </div>
             </div>
        </div>
      );
  }

  // --- VIEW: GENERAL DASHBOARD (Overview) ---

  // --- KPIs Calculations ---
  const totalProjects = filteredTasks.length;
  const completedProjects = filteredTasks.filter(t => t.stage === 'approved' || t.stage === 'published').length;
  const approvalRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  
  const totalTime = filteredTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const avgTimeDays = filteredTasks.length > 0 ? (totalTime / 60 / 8).toFixed(1) : '0';
  
  const activeMembers = users.filter(u => filteredTasks.some(t => t.assigneeId === u.id)).length;
  const onTimeDelivery = totalProjects > 0 ? 90 + (totalProjects % 5) : 0; // Mock calculation

  // --- Productivity Data ---
  const memberProductivity = users.map(user => {
      const userTasks = filteredTasks.filter(t => t.assigneeId === user.id);
      const userCompleted = userTasks.filter(t => t.stage === 'approved' || t.stage === 'published').length;
      const efficiency = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;
      
      return {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          total: userTasks.length,
          approved: userCompleted,
          efficiency: efficiency === 0 && userTasks.length > 0 ? 50 : efficiency
      };
  })
  .filter(m => m.total > 0)
  .sort((a, b) => b.total - a.total);

  // --- Distribution Data ---
  const getCategoryFromTags = (tags: string[]) => {
      if (tags.some(t => ['Social', 'Instagram', 'Linkedin', 'Facebook'].includes(t))) return 'Redes Sociais';
      if (tags.some(t => ['Web', 'Website', 'App', 'Design'].includes(t))) return 'Design Web';
      if (tags.some(t => ['Campaign', 'Strategy', 'Planning'].includes(t))) return 'Campanhas';
      if (tags.some(t => ['Video', 'Reels', 'Youtube'].includes(t))) return 'Material Gráfico';
      if (tags.some(t => ['Email', 'Copy', 'Writing'].includes(t))) return 'Copywriting';
      return 'Outros';
  };

  const distributionCounts: Record<string, number> = {
      'Redes Sociais': 0, 'Design Web': 0, 'Campanhas': 0,
      'Material Gráfico': 0, 'Copywriting': 0, 'Outros': 0
  };

  filteredTasks.forEach(t => {
      const cat = getCategoryFromTags(t.tags);
      distributionCounts[cat] = (distributionCounts[cat] || 0) + 1;
  });

  const distributionData = Object.keys(distributionCounts)
      .filter(key => distributionCounts[key] > 0)
      .map((key, idx) => {
          const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#64748b'];
          return { name: key, value: distributionCounts[key], color: colors[idx % colors.length] };
      });

  if (distributionData.length === 0) {
      distributionData.push({ name: 'Sem Dados', value: 1, color: '#2a303c' });
  }

  // --- Charts Data ---
  const weeklyData = [
      { name: 'Sem 1', iniciados: Math.floor(totalProjects * 0.4), concluidos: Math.floor(completedProjects * 0.3) },
      { name: 'Sem 2', iniciados: Math.floor(totalProjects * 0.5), concluidos: Math.floor(completedProjects * 0.5) },
      { name: 'Sem 3', iniciados: Math.floor(totalProjects * 0.3), concluidos: Math.floor(completedProjects * 0.7) },
      { name: 'Sem 4', iniciados: Math.floor(totalProjects * 0.6), concluidos: Math.floor(completedProjects * 0.8) },
  ];

  const trendData = [
      { name: 'Jan', rate: 85 }, { name: 'Fev', rate: 88 }, { name: 'Mar', rate: 92 },
      { name: 'Abr', rate: 87 }, { name: 'Mai', rate: 91 }, { name: 'Jun', rate: approvalRate > 0 ? approvalRate : 89 },
  ];

  const KPICard = ({ label, value, icon: Icon, colorClass }: any) => {
      let bgClass = "bg-[#2a303c]";
      let iconColor = "text-white";
      let glowColor = "rgba(255,255,255,0.05)";
      
      if (colorClass === 'blue') { bgClass = "bg-blue-500/10"; iconColor = "text-blue-400"; glowColor = "rgba(59, 130, 246, 0.1)"; }
      else if (colorClass === 'green') { bgClass = "bg-emerald-500/10"; iconColor = "text-emerald-400"; glowColor = "rgba(16, 185, 129, 0.1)"; }
      else if (colorClass === 'violet') { bgClass = "bg-violet-500/10"; iconColor = "text-violet-400"; glowColor = "rgba(139, 92, 246, 0.1)"; }
      else if (colorClass === 'orange') { bgClass = "bg-orange-500/10"; iconColor = "text-orange-400"; glowColor = "rgba(249, 115, 22, 0.1)"; }
      else if (colorClass === 'indigo') { bgClass = "bg-indigo-500/10"; iconColor = "text-indigo-400"; glowColor = "rgba(99, 102, 241, 0.1)"; }
      else if (colorClass === 'teal') { bgClass = "bg-teal-500/10"; iconColor = "text-teal-400"; glowColor = "rgba(20, 184, 166, 0.1)"; }

      return (
        <div className="bg-[#151a21] p-6 rounded-3xl border border-[#2a303c]/50 flex flex-col justify-between h-36 hover:border-[#3b82f6]/30 transition-all group relative overflow-hidden break-inside-avoid shadow-sm">
            <div className="flex justify-between items-start z-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <div className={`p-2.5 rounded-xl ${bgClass} ${iconColor} transition-transform group-hover:scale-110`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="z-10">
                <h3 className="text-4xl font-bold text-white tracking-tight">{value}</h3>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl transition-opacity duration-500" style={{ backgroundColor: glowColor }}></div>
        </div>
      );
  };

  return (
    <div className="space-y-8 pb-10" id="report-container">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #report-container, #report-container * { visibility: visible; }
            #report-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white !important; color: black !important; }
            .no-print { display: none !important; }
            .bg-\\[\\#151a21\\] { background-color: #ffffff !important; border: 1px solid #e5e7eb !important; color: black !important; }
            .text-white { color: #111827 !important; }
          }
        `}
      </style>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
              <p className="text-sm text-gray-400 mt-1 font-light">Acompanhe métricas e eficiência da equipe</p>
          </div>
          
          <div className="flex items-center gap-3 no-print relative z-50">
               {/* Date Range Dropdown */}
               <div className="relative" ref={dropdownRef}>
                   <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#151a21] border border-[#2a303c] rounded-full text-sm font-medium text-gray-300 hover:bg-[#1e232d] hover:text-white transition-colors"
                   >
                       <Calendar size={16} />
                       {dateRange}
                       <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                   </button>
                   
                   {isDropdownOpen && (
                     <div className="absolute right-0 top-full mt-2 w-48 bg-[#151a21] border border-[#2a303c] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                       {['Últimos 7 Dias', 'Últimos 30 Dias', 'Este Mês', 'Mês Passado', 'Todo o Período'].map((range) => (
                         <button
                           key={range}
                           onClick={() => {
                             setDateRange(range);
                             setIsDropdownOpen(false);
                           }}
                           className={`w-full text-left px-4 py-3 text-sm hover:bg-[#1e232d] transition-colors ${
                             dateRange === range ? `text-${themeColor}-400 font-bold bg-[#1e232d]/50` : 'text-gray-300'
                           }`}
                         >
                           {range}
                         </button>
                       ))}
                     </div>
                   )}
               </div>

               {/* Export Button */}
               <button 
                  onClick={handlePrint}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-${themeColor}-600 text-white rounded-full text-sm font-medium hover:bg-${themeColor}-700 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]`}
               >
                   <Printer size={16} />
                   Exportar
               </button>
          </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <KPICard label="Projetos" value={totalProjects} icon={FileText} colorClass="blue" />
          <KPICard label="Concluídos" value={completedProjects} icon={BarChart2} colorClass="green" />
          <KPICard label="Aprovação" value={`${approvalRate}%`} icon={TrendingUp} colorClass="violet" />
          <KPICard label="Tempo Médio" value={`${avgTimeDays}d`} icon={Clock} colorClass="orange" />
          <KPICard label="Ativos" value={activeMembers} icon={Users} colorClass="indigo" />
          <KPICard label="No Prazo" value={`${onTimeDelivery}%`} icon={CheckSquare} colorClass="teal" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Productivity By Member (Clickable) */}
          <div className="bg-[#151a21] p-8 rounded-3xl border border-[#2a303c]/50 break-inside-avoid flex flex-col h-[450px]">
              <div className="mb-8 flex justify-between items-center">
                  <div>
                      <h3 className="text-xl font-bold text-white">Produtividade por Membro</h3>
                      <p className="text-xs text-gray-500 mt-1">Clique para ver detalhes individuais</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#1e232d] text-gray-400 border border-[#2a303c]">
                      <Activity size={16} />
                  </div>
              </div>
              
              <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {memberProductivity.map((member, idx) => (
                      <div 
                          key={idx} 
                          onClick={() => setSelectedUserId(member.id)}
                          className="group cursor-pointer p-2 -mx-2 rounded-2xl hover:bg-[#1e232d] transition-colors"
                      >
                          <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#2a303c] p-0.5 group-hover:border-blue-500 transition-colors">
                                      <img src={member.avatar} className="w-full h-full object-cover rounded-full" alt={member.name} />
                                  </div>
                                  <div>
                                      <span className="font-bold text-white block text-sm group-hover:text-blue-400 transition-colors">{member.name}</span>
                                      <span className="text-[10px] text-gray-500 uppercase">{member.role}</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className="text-sm font-bold text-white block">{member.efficiency}%</span>
                                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Eficiência</span>
                              </div>
                          </div>
                          
                          <div className="h-2 w-full bg-[#0b0e11] rounded-full overflow-hidden border border-[#2a303c]/30">
                              <div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full group-hover:shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all duration-500" 
                                  style={{ width: `${member.efficiency}%` }}
                              ></div>
                          </div>
                      </div>
                  ))}
                  {memberProductivity.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <Users size={48} className="mb-4 opacity-20" />
                          <p>Sem dados de membros para este período</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Distribution by Type */}
          <div className="bg-[#151a21] p-8 rounded-3xl border border-[#2a303c]/50 break-inside-avoid flex flex-col h-[450px]">
              <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Distribuição de Projetos</h3>
                  <p className="text-xs text-gray-500 mt-1">Por categoria de projeto</p>
              </div>

              <div className="flex-1 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={distributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                          >
                              {distributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip 
                              contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: '1px solid #2a303c', 
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', 
                                  backgroundColor: '#0b0e11', 
                                  color: '#fff',
                                  padding: '12px'
                              }} 
                              itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}
                          />
                      </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl font-bold text-white tracking-tight">{totalProjects}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Total</span>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-4 px-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {distributionData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: item.color, boxShadow: `0 0 5px ${item.color}` }}></span>
                          <span className="text-xs text-gray-400 font-medium truncate">{item.name}</span>
                          <span className="text-xs text-white font-bold ml-auto">{item.value}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Weekly Progress */}
          <div className="bg-[#151a21] p-8 rounded-3xl border border-[#2a303c]/50 break-inside-avoid">
              <div className="mb-8">
                  <h3 className="text-xl font-bold text-white">Progresso Semanal</h3>
                  <p className="text-xs text-gray-500 mt-1">Iniciados vs Concluídos ao longo do tempo</p>
              </div>
              
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} barGap={12}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a303c" strokeOpacity={0.5} />
                          <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                              dy={15} 
                          />
                          <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#9ca3af', fontSize: 12 }} 
                              dx={-10}
                          />
                          <Tooltip 
                              cursor={{fill: '#2a303c', opacity: 0.3}} 
                              contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: '1px solid #2a303c', 
                                  backgroundColor: '#0b0e11', 
                                  color: '#fff',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                  padding: '12px'
                              }} 
                              itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="iniciados" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={24} name="Iniciados" />
                          <Bar dataKey="concluidos" fill="#10b981" radius={[6, 6, 6, 6]} barSize={24} name="Concluídos" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Approval Rate Trend */}
          <div className="bg-[#151a21] p-8 rounded-3xl border border-[#2a303c]/50 break-inside-avoid">
              <div className="mb-8">
                  <h3 className="text-xl font-bold text-white">Tendência de Aprovação</h3>
                  <p className="text-xs text-gray-500 mt-1">Desempenho da taxa de aprovação mensal</p>
              </div>
              
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                          <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a303c" strokeOpacity={0.5} />
                          <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                              dy={15} 
                          />
                          <YAxis 
                              domain={[80, 100]} 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#9ca3af', fontSize: 12 }} 
                              dx={-10}
                          />
                          <Tooltip 
                              contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: '1px solid #2a303c', 
                                  backgroundColor: '#0b0e11', 
                                  color: '#fff',
                                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                  padding: '12px'
                              }} 
                              itemStyle={{ color: '#fff' }}
                          />
                          <Line 
                              type="monotone" 
                              dataKey="rate" 
                              stroke="#8b5cf6" 
                              strokeWidth={4} 
                              dot={{ fill: '#151a21', stroke: '#8b5cf6', strokeWidth: 3, r: 6 }} 
                              activeDot={{ r: 8, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
                          />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

      </div>
    </div>
  );
};
