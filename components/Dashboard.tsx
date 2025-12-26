
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, ArrowUpRight, ChevronRight, PieChart as PieChartIcon, Target } from 'lucide-react';
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
  themeColor, 
  currentUser, 
  users,
  onNavigate
}) => {
  const isMember = currentUser.role === UserRole.MEMBER;

  const relevantTasks = useMemo(() => isMember 
    ? tasks.filter(t => t.assigneeId === currentUser.id) 
    : tasks, [tasks, isMember, currentUser.id]);

  const tasksWithTime = relevantTasks.filter(t => t.timeSpent > 0);
  const totalTimeMinutes = tasksWithTime.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const avgTimeMinutes = tasksWithTime.length > 0 ? Math.round(totalTimeMinutes / tasksWithTime.length) : 0;

  const displayCardCount = relevantTasks.length;

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const metrics: DashboardMetrics = {
    activeCampaigns: isMember ? 0 : Array.from(new Set(relevantTasks.map(t => t.client))).length,
    pendingTasks: relevantTasks.filter(t => t.stage !== 'published' && t.stage !== 'approved').length,
    approvalRate: 0,
    completedThisMonth: relevantTasks.filter(t => t.stage === 'approved' || t.stage === 'published').length,
    avgProductionTime: avgTimeMinutes,
  };

  // Dados para o Gráfico de Radar (Tipos de Entrega)
  const radarData = useMemo(() => {
    const types: Record<string, string> = {
      'social-media': 'Social Media',
      'video': 'Edição de Vídeo',
      'design': 'Design',
      'ads': 'Tráfego Pago',
      'strategy': 'Estratégia'
    };

    const counts: Record<string, number> = {};
    Object.keys(types).forEach(key => counts[key] = 0);

    relevantTasks.forEach(task => {
      const type = task.projectType || 'social-media';
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return Object.entries(types).map(([key, label]) => ({
      subject: label,
      A: counts[key],
      fullMark: Math.max(...Object.values(counts), 5)
    }));
  }, [relevantTasks]);

  // Performance dos últimos 7 dias
  const dataPerformance = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      
      const created = relevantTasks.filter(t => {
        const taskDate = new Date(parseInt(t.id.split('-')[1]) || 0);
        return taskDate.toDateString() === d.toDateString();
      }).length;

      const completed = relevantTasks.filter(t => {
        if (t.stage === 'approved' || t.stage === 'published') {
           const taskDate = new Date(parseInt(t.id.split('-')[1]) || 0);
           return taskDate.toDateString() === d.toDateString();
        }
        return false;
      }).length;

      days.push({ name: dateStr, created, completed });
    }
    return days;
  }, [relevantTasks]);
  
  const StatCard = ({ icon: Icon, label, value, trend, isPositive, onClick }: any) => (
    <div 
        onClick={onClick}
        className="bg-white dark:bg-[#151a21] p-6 rounded-3xl border border-gray-200 dark:border-[#2a303c]/50 relative overflow-hidden group transition-all duration-300 cursor-pointer hover:shadow-lg"
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
            <div className={`p-2 rounded-full ${isPositive ? 'bg-green-500/10 text-green-500 dark:text-green-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                <Icon size={16} />
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
        <div onClick={() => onNavigate('crm')} className="bg-white dark:bg-[#151a21] p-6 rounded-3xl border border-gray-100 dark:border-[#2a303c]/50 shadow-lg relative overflow-hidden cursor-pointer hover:shadow-xl transition-all">
             <div className="flex justify-between items-start mb-6 text-gray-600 dark:text-gray-400">
                 <span className="font-medium">{isMember ? "Meus Cards" : "Total de Cards"}</span>
                 <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg"><TrendingUp size={20} /></div>
             </div>
             <h3 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{displayCardCount}</h3>
             <p className="text-xs text-gray-500 font-bold">{displayCardCount > 0 ? "Dados sincronizados" : "Nenhum card criado"}</p>
        </div>

        <StatCard onClick={() => onNavigate('crm')} label="Tarefas Pendentes" value={metrics.pendingTasks} icon={Target} isPositive={metrics.pendingTasks === 0} />
        <StatCard onClick={() => onNavigate('reports')} label="Tempo Médio Prod." value={formatTime(metrics.avgProductionTime)} icon={PieChartIcon} isPositive={true} />
        <StatCard onClick={() => onNavigate('reports')} label="Concluídos (Mês)" value={metrics.completedThisMonth} icon={TrendingUp} isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#151a21] rounded-3xl p-8 border border-gray-200 dark:border-[#2a303c]/50">
             <div className="flex justify-between items-center mb-8 text-gray-900 dark:text-white">
                 <div>
                     <h3 className="text-xl font-bold">Produtividade</h3>
                     <p className="text-sm text-gray-500">Tarefas Criadas vs Concluídas (7 dias)</p>
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
                    <Tooltip cursor={{fill: '#2a303c', opacity: 0.1}} contentStyle={{ backgroundColor: '#0b0e11', borderRadius: '16px', border: 'none', color: '#fff' }} />
                    <Bar dataKey="created" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={32} name="Criadas" />
                    <Bar dataKey="completed" fill="#94a3b8" radius={[6, 6, 6, 6]} barSize={32} name="Concluídas" />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-[#151a21] rounded-3xl p-6 border border-gray-200 dark:border-[#2a303c]/50 h-[480px] flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">Tipos de Entrega</h3>
                <PieChartIcon size={16} className="text-gray-400" />
             </div>
             <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#2a303c" opacity={0.3} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar name="Volume" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                            <Tooltip contentStyle={{ backgroundColor: '#0b0e11', borderRadius: '12px', border: 'none', color: '#fff' }} itemStyle={{ color: '#6366f1' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Demanda por Categoria</p>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};
