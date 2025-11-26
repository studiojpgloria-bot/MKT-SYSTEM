import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, CheckCircle, AlertCircle, Clock, Timer, User as UserIcon, Coffee, Wifi, Activity, ChevronRight, PlayCircle } from 'lucide-react';
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
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  workflow, 
  themeColor, 
  currentUser, 
  users,
  notifications,
  onUpdateUserStatus,
  onTaskClick
}) => {
  const isMember = currentUser.role === UserRole.MEMBER;

  // 1. Logic for Pending Tasks Widget
  const pendingTasksList = tasks
    .filter(t => isMember ? t.assigneeId === currentUser.id : true)
    .filter(t => t.stage !== 'approved' && t.stage !== 'published')
    .sort((a, b) => a.dueDate - b.dueDate) 
    .slice(0, 4); // Show top 4 to fit height

  // 2. Logic for Metrics
  const relevantTasks = isMember 
    ? tasks.filter(t => t.assigneeId === currentUser.id) 
    : tasks;

  const tasksWithTime = relevantTasks.filter(t => t.timeSpent > 0);
  const totalTimeMinutes = tasksWithTime.reduce((acc, t) => acc + t.timeSpent, 0);
  const avgTimeMinutes = tasksWithTime.length > 0 ? Math.round(totalTimeMinutes / tasksWithTime.length) : 0;

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const metrics: DashboardMetrics = {
    activeCampaigns: isMember ? 0 : 5,
    pendingTasks: relevantTasks.filter(t => t.stage !== 'published' && t.stage !== 'approved').length,
    approvalRate: isMember ? 90 : 85,
    completedThisMonth: relevantTasks.filter(t => t.stage === 'approved' || t.stage === 'published').length,
    avgProductionTime: avgTimeMinutes,
  };

  // Chart Data
  const dataPerformance = [
    { name: 'Week 1', completed: isMember ? 2 : 4, created: isMember ? 3 : 6 },
    { name: 'Week 2', completed: isMember ? 4 : 7, created: isMember ? 2 : 5 },
    { name: 'Week 3', completed: isMember ? 1 : 5, created: isMember ? 4 : 8 },
    { name: 'Week 4', completed: isMember ? 5 : 9, created: isMember ? 3 : 4 },
  ];
  
  const getBarFill = () => {
      switch(themeColor) {
          case 'emerald': return '#10b981';
          case 'rose': return '#e11d48';
          case 'orange': return '#f97316';
          case 'violet': return '#8b5cf6';
          case 'blue': return '#3b82f6';
          default: return '#4f46e5';
      }
  };

  // Custom Stat Card matching the screenshot design
  const StatCard = ({ icon: Icon, label, value, iconBgClass }: any) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{label}</p>
        <h3 className="text-4xl font-bold text-gray-800 dark:text-white">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClass}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            icon={TrendingUp} 
            label={isMember ? "My Active Tasks" : "Active Campaigns"} 
            value={metrics.activeCampaigns} 
            iconBgClass="bg-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-none" 
        />
        <StatCard 
            icon={Clock} 
            label="Pending Tasks" 
            value={metrics.pendingTasks} 
            iconBgClass="bg-amber-500 shadow-lg shadow-amber-200 dark:shadow-none" 
        />
        <StatCard 
            icon={Timer} 
            label="Avg Production Time" 
            value={formatTime(metrics.avgProductionTime)} 
            iconBgClass="bg-blue-500 shadow-lg shadow-blue-200 dark:shadow-none" 
        />
        <StatCard 
            icon={CheckCircle} 
            label="Total Completed (Mo)" 
            value={metrics.completedThisMonth} 
            iconBgClass="bg-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-none" 
        />
      </div>

      {/* Operational Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Team Status Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-[450px]">
             <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Wifi size={18} className="text-indigo-600" /> Team Status
                </h3>
                
                {/* Current User Status Toggle */}
                {currentUser.status === 'paused' ? (
                    <button 
                        onClick={() => onUpdateUserStatus('online')}
                        className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                        <PlayCircle size={14} /> Resume
                    </button>
                ) : (
                    <button 
                        onClick={() => onUpdateUserStatus('paused')}
                        className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
                    >
                        <Coffee size={14} /> Pause 15m
                    </button>
                )}
             </div>
             <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-slate-700" />
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                    user.status === 'online' ? 'bg-emerald-500' : 
                                    user.status === 'paused' ? 'bg-amber-500' : 'bg-gray-400'
                                }`}></span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{user.name}</p>
                                <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="text-xs font-medium">
                            {user.status === 'online' && <span className="text-emerald-600">Online</span>}
                            {user.status === 'paused' && <span className="text-amber-600 flex items-center gap-1"><Coffee size={12}/> Paused</span>}
                            {user.status === 'offline' && <span className="text-gray-400">Offline</span>}
                        </div>
                    </div>
                ))}
             </div>
          </div>

          {/* 2. Pending Tasks Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-[450px]">
             <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-500" /> 
                    {isMember ? 'My Pending Tasks' : 'All Pending Tasks'}
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-2">
                {pendingTasksList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center">
                        <CheckCircle size={32} className="mb-2 opacity-20" />
                        No pending tasks!
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pendingTasksList.map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => onTaskClick && onTaskClick(task.id)}
                                className="p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded uppercase tracking-wide">
                                        {task.clients?.name || 'No Client'}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                        task.priority === 'URGENT' ? 'bg-red-50 text-red-600' : 
                                        task.priority === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                                        'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                    {task.title}
                                </h4>
                                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> 
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                    {!isMember && (
                                        <div className="flex items-center gap-1">
                                            <UserIcon size={12} />
                                            {users.find(u => u.id === task.assigneeId)?.name.split(' ')[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
             <div className="p-3 border-t border-gray-100 dark:border-slate-800 text-center">
                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 w-full py-1">
                    View All <ChevronRight size={12} />
                </button>
             </div>
          </div>

          {/* 3. Recent History Widget (Timeline Style) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-[450px]">
             <div className="p-5 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" /> Recent History
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-6 relative">
                {/* Timeline Vertical Line */}
                <div className="absolute left-[33px] top-6 bottom-6 w-0.5 bg-gray-100 dark:bg-slate-800"></div>

                {notifications.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-10 relative z-10">
                        No recent activity.
                    </div>
                ) : (
                    <div className="space-y-6 relative z-10">
                        {notifications.slice(0, 10).map((notif, idx) => (
                            <div key={notif.id || idx} className="flex gap-4">
                                <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 border-white dark:border-slate-900 ${
                                    notif.type === 'success' ? 'bg-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-900/20' : 
                                    notif.type === 'warning' ? 'bg-amber-500 ring-4 ring-amber-50 dark:ring-amber-900/20' : 
                                    'bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20'
                                }`}></div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5 font-medium">
                                        {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-slate-200 leading-tight mb-0.5">
                                        {notif.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>

      </div>

      {/* Charts Row (Optional, kept for functionality) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">{isMember ? "My Throughput" : "Team Throughput"}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f1f5f9', opacity: 0.4}}
                    contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px'}} 
                />
                <Bar dataKey="created" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} name="Assigned" />
                <Bar dataKey="completed" fill={getBarFill()} radius={[4, 4, 0, 0]} barSize={20} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};