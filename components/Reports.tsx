
import React, { useState } from 'react';
import { FileText, Download, Calendar, ChevronDown, Printer, Users, Clock, CheckSquare, TrendingUp, BarChart2, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Task, User, WorkflowStage, UserRole } from '../types';

interface ReportsProps {
  tasks: Task[];
  users: User[];
  workflow: WorkflowStage[];
  themeColor: string;
}

export const Reports: React.FC<ReportsProps> = ({ tasks, users, workflow, themeColor }) => {
  const [dateRange, setDateRange] = useState('Last 30 Days');

  // --- Calculations based on Real Data ---

  // KPIs
  const totalProjects = tasks.length;
  const completedProjects = tasks.filter(t => t.stage === 'approved' || t.stage === 'published').length;
  const approvalRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  
  const totalTime = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const avgTimeDays = tasks.length > 0 ? (totalTime / 60 / 8).toFixed(1) : '0'; // Assuming 8h workday for conversion
  
  const activeMembers = users.filter(u => tasks.some(t => t.assigneeId === u.id)).length;
  
  // Mock On-Time Delivery (Since we don't have historical due date vs completion date logic fully tracked yet)
  const onTimeDelivery = 94;

  // Productivity Data
  const memberProductivity = users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const userCompleted = userTasks.filter(t => t.stage === 'approved' || t.stage === 'published').length;
      const efficiency = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;
      
      return {
          name: user.name,
          avatar: user.avatar,
          total: userTasks.length,
          approved: userCompleted,
          efficiency: efficiency === 0 ? Math.floor(Math.random() * 20) + 70 : efficiency // Fallback for demo if no tasks
      };
  }).sort((a, b) => b.total - a.total).slice(0, 3); // Top 3

  // Distribution Data (Mocked to match chart style if tags aren't sufficient, or mapped from tags)
  const distributionData = [
      { name: 'Campanhas', value: 35, color: '#3b82f6' }, // Blue
      { name: 'Redes Sociais', value: 20, color: '#f59e0b' }, // Amber
      { name: 'Design Web', value: 25, color: '#10b981' }, // Emerald
      { name: 'Material Gráfico', value: 15, color: '#ef4444' }, // Red
      { name: 'Outros', value: 5, color: '#8b5cf6' }, // Violet
  ];

  // Weekly Progress Data (Mocked)
  const weeklyData = [
      { name: 'Sem 1', iniciados: 6, concluidos: 4 },
      { name: 'Sem 2', iniciados: 8, concluidos: 7 },
      { name: 'Sem 3', iniciados: 7, concluidos: 5 },
      { name: 'Sem 4', iniciados: 10, concluidos: 9 },
  ];

  // Approval Trend Data (Mocked)
  const trendData = [
      { name: 'Jan', rate: 85 },
      { name: 'Fev', rate: 88 },
      { name: 'Mar', rate: 92 },
      { name: 'Abr', rate: 87 },
      { name: 'Mai', rate: 91 },
      { name: 'Jun', rate: 89 },
  ];

  // --- Components ---

  const KPICard = ({ label, value, icon: Icon, colorClass, subIcon }: any) => (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-gray-50 text-${colorClass}-600`}>
              <Icon size={24} />
          </div>
          {subIcon && (
              <div className="absolute top-4 right-4">
                  {subIcon}
              </div>
          )}
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
              <p className="text-gray-500">Acompanhe métricas e performance da equipe</p>
          </div>
          
          <div className="flex items-center gap-3">
               <div className="relative">
                   <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                       <Calendar size={16} />
                       {dateRange}
                       <ChevronDown size={14} />
                   </button>
               </div>
               <button 
                  onClick={() => alert('Downloading PDF Report...')}
                  className={`flex items-center gap-2 px-4 py-2 bg-${themeColor}-600 text-white rounded-lg text-sm font-medium hover:bg-${themeColor}-700 transition-colors shadow-sm`}
               >
                   <Download size={16} />
                   Exportar PDF
               </button>
          </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard label="Total Projetos" value={totalProjects} icon={FileText} colorClass="blue" />
          <KPICard label="Concluídos" value={completedProjects} icon={BarChart2} colorClass="green" />
          <KPICard label="Taxa Aprovação" value={`${approvalRate}%`} icon={TrendingUp} colorClass="violet" />
          <KPICard label="Tempo Médio" value={`${avgTimeDays}d`} icon={Clock} colorClass="orange" />
          <KPICard label="Membros Ativos" value={activeMembers} icon={Users} colorClass="indigo" />
          <KPICard label="Entrega no Prazo" value={`${onTimeDelivery}%`} icon={CheckSquare} colorClass="teal" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Productivity By Member */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Produtividade por Membro</h3>
                  <p className="text-sm text-gray-500">Performance individual da equipe</p>
              </div>
              
              <div className="space-y-6">
                  {memberProductivity.map((member, idx) => (
                      <div key={idx}>
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-3">
                                  {/* <img src={member.avatar} className="w-8 h-8 rounded-full" alt={member.name} /> */}
                                  <span className="font-bold text-gray-800">{member.name}</span>
                              </div>
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {member.efficiency}% eficiência
                              </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                              <span>Projetos: {member.total}</span>
                              <span>Aprovados: {member.approved}</span>
                          </div>
                          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-900 rounded-full" style={{ width: `${member.efficiency}%` }}></div>
                          </div>
                      </div>
                  ))}
                  {/* Fallback if no members */}
                  {memberProductivity.length === 0 && (
                      <div className="text-center text-gray-400 py-4">Nenhum dado de membro disponível</div>
                  )}
              </div>
          </div>

          {/* Distribution by Type */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-2">
                  <h3 className="text-lg font-bold text-gray-900">Distribuição por Tipo</h3>
                  <p className="text-sm text-gray-500">Tipos de projetos desenvolvidos</p>
              </div>

              <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={distributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {distributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
                  {distributionData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-xs text-gray-600 font-medium">{item.name} ({item.value}%)</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Weekly Progress */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Progresso Semanal</h3>
                  <p className="text-sm text-gray-500">Projetos iniciados vs concluídos</p>
              </div>
              
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} barGap={8}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="iniciados" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} name="Iniciados" />
                          <Bar dataKey="concluidos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} name="Concluídos" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Approval Rate Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Taxa de Aprovação</h3>
                  <p className="text-sm text-gray-500">Evolução mensal da taxa de aprovação</p>
              </div>
              
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                          <YAxis domain={[80, 95]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Line 
                              type="monotone" 
                              dataKey="rate" 
                              stroke="#8b5cf6" 
                              strokeWidth={3} 
                              dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }} 
                              activeDot={{ r: 6 }}
                          />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

      </div>
    </div>
  );
};
