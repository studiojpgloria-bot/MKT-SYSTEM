
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, CheckCircle, AlertCircle, Clock, Timer, User as UserIcon, Coffee, Wifi, Activity, ChevronRight, PlayCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Task, DashboardMetrics, WorkflowStage, User, UserRole, Notification } from '../types';

interface DashboardProps {
  tasks: Task[];
  workflow: WorkflowStage[];
  themeColor: string;
  currentUser: User;
  users: User[];
  notifications: Notification[];
  onUpdateUserStatus: (status: 'online' | 'paused' | 'offline') => void;
  onTaskClick?: (taskId: string) => void;
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  workflow, 
  themeColor, 
  currentUser, 
  users,
  notifications,
  onUpdateUserStatus,
  onTaskClick,
  onNavigate
}) => {
  const isMember = currentUser.role === UserRole.MEMBER;

  const pendingTasksList = tasks
    .filter(t => isMember ? t.assigneeId === currentUser.id : true)
    .filter(t => t.stage !== 'approved' && t.stage !== 'published')
    .sort((a, b) => a.dueDate - b.dueDate) 
    .slice(0, 4);

  const relevantTasks = isMember 
    ? tasks.filter(t => t.assigneeId === currentUser.id) 
    : tasks;

  const tasksWithTime = relevantTasks.filter(t => t.timeSpent > 0);
  const totalTimeMinutes = tasksWithTime.reduce((acc, t) => acc + t.timeSpent, 0);
  const avgTimeMinutes = tasksWithTime.length > 0 ? Math.round(totalTimeMinutes / tasksWithTime.length) : 0;

  const displayCardCount = isMember 
    ? tasks.filter(t => t.assigneeId === currentUser.id).length 
    : tasks.length;

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const metrics: DashboardMetrics = {
    activeCampaigns: isMember ? 0 : 5,
    pendingTasks: relevantTasks.filter(t => t.stage !== 'published' && t.stage !== 'approved').length,
    approvalRate: isMember ? 90 : 85,
    completedThisMonth: relevantTasks.filter(t => t.stage === 'approved' || t.stage === 'published').length,
    avgProductionTime: avgTimeMinutes,
  };

  const dataPerformance = [
    { name: '01 Ago', completed: isMember ? 2 : 4, created: isMember ? 3 : 6 },
    { name: '02 Ago', completed: isMember ? 4 : 7, created: isMember ? 2 : 5 },
    { name: '03 Ago', completed: isMember ? 1 : 5, created: isMember ? 4 : 8 },
    { name: '04 Ago', completed: isMember ? 5 : 9, created: isMember ? 3 : 4 },
    { name: '05 Ago', completed: isMember ? 3 : 6, created: isMember ? 5 : 7 },
    { name: '06 Ago', completed: isMember ? 6 : 8, created: isMember ? 2 : 5 },
    { name: '07 Ago', completed: isMember ? 2 : 5, created: isMember ? 4 : 6 },
  ];
  
  const StatCard = ({ icon: Icon, label, value, trend, isPositive, onClick }: any) => (
    <div 
        onClick={onClick}
        className="bg-white dark:bg-[#151a21] p-6 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 relative overflow-hidden group transition-all duration-300 cursor-pointer hover:shadow-lg"
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
            <div className={`p-2 rounded-full ${isPositive ? 'bg-green-500/10 text-green-500 dark:text-green-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                <ArrowUpRight size={16} />
            </div>
        </div>
        <div className="flex items-baseline gap-3">
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
            {trend && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                    {trend}
                </span>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => onNavigate('crm')} className="bg-white p-6 rounded-3xl shadow-lg relative overflow-hidden cursor-pointer hover:shadow-xl transition-shadow border border-gray-100">
             <div className="flex justify-between items-start mb-6 text-gray-600">
                 <span className="font-medium">{isMember ? "Meus Cards" : "Total de Cards"}</span>
                 <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white"><TrendingUp size={20} /></div>
             </div>
             <h3 className="text-4xl font-bold mb-2 text-gray-900">{displayCardCount}</h3>
             <p className="text-xs text-gray-500 font-bold">+2.5% vs mês anterior</p>
        </div>

        <StatCard onClick={() => onNavigate('crm')} label="Tarefas Pendentes" value={metrics.pendingTasks} trend="-2.0%" isPositive={false} />
        <StatCard onClick={() => onNavigate('reports')} label="Tempo Médio Prod." value={formatTime(metrics.avgProductionTime)} trend="+5.6%" isPositive={true} />
        <StatCard onClick={() => onNavigate('reports')} label="Concluídos (Mês)" value={metrics.completedThisMonth} trend="+12%" isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#151a21] rounded-3xl p-8 border border-gray-200 dark:border-[#2a303c]/50">
             <div className="flex justify-between items-center mb-8 text-gray-900 dark:text-white">
                 <div>
                     <h3 className="text-xl font-bold">Produtividade</h3>
                     <p className="text-sm text-gray-500">Tarefas Criadas vs Concluídas</p>
                 </div>
                 <button onClick={() => onNavigate('reports')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2a303c] flex items-center justify-center text-gray-600 dark:text-white hover:bg-white hover:text-black transition-colors">
                     <ArrowUpRight size={18} />
                 </button>
             </div>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataPerformance} barGap={12}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a303c" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
                    <Tooltip cursor={{fill: '#2a303c', opacity: 0.1}} contentStyle={{ backgroundColor: '#0b0e11', borderRadius: '16px', border: 'none' }} />
                    <Bar dataKey="created" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={32} name="Atribuídas" />
                    <Bar dataKey="completed" fill="#64748b" radius={[6, 6, 6, 6]} barSize={32} name="Concluídas" />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-[#151a21] rounded-3xl p-6 border border-gray-200 dark:border-[#2a303c]/50 h-[480px] flex flex-col">
             <h3 className="font-bold text-gray-900 dark:text-white mb-6">Status da Equipe</h3>
             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1e232d] transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-[#151a21]" />
                                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#151a21] ${user.status === 'online' ? 'bg-green-500' : user.status === 'paused' ? 'bg-orange-500' : 'bg-gray-500'}`}></span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-white" />
                    </div>
                ))}
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#151a21] rounded-3xl p-6 border border-gray-200 dark:border-[#2a303c]/50 h-[400px] flex flex-col">
             <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-500"/> Proximas Entregas
             </h3>
             <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {pendingTasksList.map(task => (
                    <div key={task.id} onClick={() => onTaskClick && onTaskClick(task.id)} className="p-4 bg-gray-50 dark:bg-[#0b0e11] rounded-2xl border border-gray-200 dark:border-[#2a303c] hover:border-blue-500 transition-all cursor-pointer group">
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{task.client}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${task.priority === 'URGENT' ? 'bg-red-500/10 text-red-500' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{task.priority}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-400 transition-colors">{task.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500"><Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                ))}
             </div>
          </div>

          <div className="bg-white dark:bg-[#151a21] rounded-3xl p-6 border border-gray-200 dark:border-[#2a303c]/50 h-[400px] flex flex-col">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Distribuição</h3>
              <div className="flex-1 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Design', value: 40 },
                                { name: 'Copy', value: 30 },
                                { name: 'Estratégia', value: 20 },
                                { name: 'Admin', value: 10 },
                            ]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            <Cell fill="#3b82f6" /><Cell fill="#f59e0b" /><Cell fill="#10b981" /><Cell fill="#ef4444" />
                        </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white block">85%</span>
                      <span className="text-xs text-gray-500">Média</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
