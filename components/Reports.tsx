"use client";

import React, { useState } from 'react';
import { FileText, Download, Calendar, ChevronDown, Users, Clock, CheckSquare, TrendingUp, BarChart2, PieChart as PieIcon, LayoutDashboard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Task, User, WorkflowStage } from '../types';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4'];

export const Reports: React.FC<{ tasks: Task[]; users: User[]; workflow: WorkflowStage[]; themeColor: string; }> = ({ tasks, users, workflow, themeColor }) => {
  const [dateRange, setDateRange] = useState('All Time');

  // --- REAL DATA CALCULATIONS ---

  // KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.stage === 'approved' || t.stage === 'published').length;
  const approvalRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalTime = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
  const avgTimeDays = completedTasks > 0 ? (totalTime / completedTasks / 60 / 8).toFixed(1) : '0';
  const activeMembers = users.filter(u => tasks.some(t => t.assigneeId === u.id)).length;
  const overdueTasks = tasks.filter(t => t.dueDate < Date.now() && t.stage !== 'published' && t.stage !== 'approved').length;

  // Productivity Data
  const memberProductivity = users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const userCompleted = userTasks.filter(t => t.stage === 'approved' || t.stage === 'published').length;
      const totalTime = userTasks.reduce((acc, t) => acc + t.timeSpent, 0);
      return {
          name: user.name,
          total: userTasks.length,
          completed: userCompleted,
          time: totalTime / 60, // hours
      };
  }).sort((a, b) => b.completed - a.completed).slice(0, 5);

  // Tag Distribution
  const tagCounts = tasks.reduce((acc, task) => {
    task.tags.forEach(tag => { acc[tag] = (acc[tag] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);

  const tagDistributionData = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }));

  // Task Creation Trend (Last 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentTasks = tasks.filter(t => t.createdAt > thirtyDaysAgo);
  const creationTrendData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(thirtyDaysAgo + (i + 1) * 24 * 60 * 60 * 1000);
      return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: recentTasks.filter(t => new Date(t.createdAt).toDateString() === date.toDateString()).length
      };
  });

  // Workflow Stage Distribution
  const stageDistributionData = workflow.map((stage, i) => ({
      name: stage.name,
      tasks: tasks.filter(t => t.stage === stage.id).length,
      color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  // --- Components ---
  const KPICard = ({ label, value, icon: Icon, colorClass }: any) => (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-start justify-between">
          <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-${colorClass}-50 dark:bg-${colorClass}-900/20 text-${colorClass}-600 dark:text-${colorClass}-400`}>
              <Icon size={24} />
          </div>
      </div>
  );

  const getThemeColorHex = () => {
      switch(themeColor) {
          case 'emerald': return '#10b981';
          case 'rose': return '#e11d48';
          case 'orange': return '#f97316';
          case 'violet': return '#8b5cf6';
          case 'blue': return '#3b82f6';
          default: return '#4f46e5';
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
              <p className="text-gray-500 dark:text-slate-400">Track metrics and team performance.</p>
          </div>
          <div className="flex items-center gap-3">
               <div className="relative">
                   <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                       <Calendar size={16} /> {dateRange} <ChevronDown size={14} />
                   </button>
               </div>
               <button className={`flex items-center gap-2 px-4 py-2 bg-${themeColor}-600 text-white rounded-lg text-sm font-medium hover:bg-${themeColor}-700 transition-colors shadow-sm`}>
                   <Download size={16} /> Export PDF
               </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard label="Total Tasks" value={totalTasks} icon={FileText} colorClass="blue" />
          <KPICard label="Completed" value={completedTasks} icon={CheckSquare} colorClass="emerald" />
          <KPICard label="Approval Rate" value={`${approvalRate}%`} icon={TrendingUp} colorClass="violet" />
          <KPICard label="Avg Time/Task" value={`${avgTimeDays}d`} icon={Clock} colorClass="orange" />
          <KPICard label="Active Members" value={activeMembers} icon={Users} colorClass="rose" />
          <KPICard label="Overdue" value={overdueTasks} icon={BarChart2} colorClass="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Team Productivity</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Top 5 members by tasks completed.</p>
              <div className="space-y-4">
                  {memberProductivity.map((member) => (
                      <div key={member.name} className="flex items-center gap-4">
                          <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-sm text-gray-800 dark:text-white">{member.name}</span>
                                  <span className="text-xs font-mono text-gray-500 dark:text-slate-400">{member.completed} / {member.total} tasks</span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${member.total > 0 ? (member.completed / member.total) * 100 : 0}%` }}></div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Workflow Distribution</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Current tasks in each stage.</p>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stageDistributionData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" dark:stroke="#334155" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={80} />
                          <Tooltip cursor={{fill: '#f9fafb', dark: '#1e293b'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                          <Bar dataKey="tasks" fill={getThemeColorHex()} radius={[0, 4, 4, 0]} barSize={20}>
                              {stageDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Task Creation Trend</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">New tasks created over the last 30 days.</p>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={creationTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" dark:stroke="#334155" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                          <Line type="monotone" dataKey="count" name="New Tasks" stroke={getThemeColorHex()} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Distribution by Tag</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Breakdown of the most common task tags.</p>
              <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={tagDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {tagDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
                  {tagDistributionData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-xs text-gray-600 dark:text-slate-300 font-medium">{item.name} ({item.value})</span>
                      </div>
                  ))}
              </div>
          </div>

      </div>
    </div>
  );
};