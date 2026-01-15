
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Kanban, Calendar as CalendarIcon, CheckCircle, Settings, LogOut, Menu, Bell, FileBarChart, Moon, Sun, FileText, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { User, UserRole, SystemSettings, Notification } from '../types';

interface LayoutProps {
  currentUser: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onNewTask: () => void;
  onOpenProfile: () => void;
  settings: SystemSettings;
  onToggleTheme: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClearNotifications: () => void;
  connectionStatus?: 'connecting' | 'connected' | 'error';
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  onNewTask,
  onOpenProfile,
  settings,
  onToggleTheme,
  notifications,
  onNotificationClick,
  onClearNotifications,
  connectionStatus = 'connected',
  children
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const connectionColors = {
    connecting: 'bg-amber-500',
    connected: 'bg-emerald-500',
    error: 'bg-red-500'
  };

  const themeColors: any = {
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-600', border: 'border-indigo-600', shadow: 'shadow-indigo-500/20', hover: 'hover:bg-indigo-700', fill: 'fill-indigo-600' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', border: 'border-emerald-600', shadow: 'shadow-emerald-500/20', hover: 'hover:bg-emerald-700', fill: 'fill-emerald-600' },
    rose: { text: 'text-rose-600', bg: 'bg-rose-600', border: 'border-rose-600', shadow: 'shadow-rose-500/20', hover: 'hover:bg-rose-700', fill: 'fill-rose-600' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-600', shadow: 'shadow-blue-500/20', hover: 'hover:bg-blue-700', fill: 'fill-blue-600' },
    violet: { text: 'text-violet-600', bg: 'bg-violet-600', border: 'border-violet-600', shadow: 'shadow-violet-500/20', hover: 'hover:bg-violet-700', fill: 'fill-violet-600' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-600', shadow: 'shadow-orange-500/20', hover: 'hover:bg-orange-700', fill: 'fill-orange-600' },
  };

  const activeTheme = themeColors[settings.themeColor] || themeColors.indigo;
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER] },
    { id: 'crm', label: 'CRM Kanban', icon: Kanban, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER] },
    { id: 'calendar', label: 'Calendário', icon: CalendarIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER] },
    { id: 'documents', label: 'Documentos', icon: FileText, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER] },
    { id: 'approvals', label: 'Aprovações', icon: CheckCircle, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'reports', label: 'Relatórios', icon: FileBarChart, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'dashboard': return `Olá, ${currentUser.name.split(' ')[0]}! 👋`;
      case 'crm': return 'CRM Kanban';
      case 'calendar': return 'Calendário';
      case 'documents': return 'Documentos & Atas';
      case 'approvals': return 'Central de Aprovações';
      case 'reports': return 'Relatórios de Performance';
      case 'settings': return 'Configurações do Sistema';
      default: return view.charAt(0).toUpperCase() + view.slice(1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0b0e11] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#0b0e11] border-r border-gray-200 dark:border-[#2a303c] transition-all duration-300 flex flex-col flex-shrink-0 relative z-20`}
      >
        <div className="h-20 flex items-center justify-between px-6">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              {settings.companyLogo ? (
                <img src={settings.companyLogo} alt="Logo" className="w-9 h-9 rounded-xl object-contain" />
              ) : (
                <div className={`w-9 h-9 rounded-xl ${activeTheme.bg} flex items-center justify-center shadow-lg ${activeTheme.shadow}`}>
                  <ShieldCheck size={20} className="text-white" />
                </div>
              )}
              <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white truncate">{settings.companyName}</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#151a21] transition-colors"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto custom-scrollbar">
          {navItems
            .filter((item) => item.roles.includes(currentUser.role))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-200 group ${currentView === item.id
                  ? `bg-gray-100 dark:bg-[#151a21] text-gray-900 dark:text-white`
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#151a21]/50'
                  }`}
              >
                <item.icon size={20} className={`${currentView === item.id ? activeTheme.text : 'text-gray-500 group-hover:text-gray-400 dark:group-hover:text-gray-300'}`} />
                {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              </button>
            ))}
        </div>

        <div className="p-6">
          {isSidebarOpen ? (
            <div className="bg-gray-50 dark:bg-[#151a21] rounded-3xl p-4 flex items-center gap-3 border border-gray-200 dark:border-[#2a303c]/50">
              <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0b0e11] cursor-pointer" onClick={onOpenProfile} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                <p className={`text-[10px] ${activeTheme.text} font-bold uppercase`}>{currentUser.role.toLowerCase()}</p>
              </div>
              <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Sair">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0b0e11] cursor-pointer" onClick={onOpenProfile} />
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-gray-50 dark:bg-[#0b0e11] transition-colors duration-300">
        <header className="h-20 flex items-center justify-between px-8 flex-shrink-0 bg-gray-50 dark:bg-[#0b0e11] border-b border-gray-100 dark:border-[#2a303c]/50 transition-colors duration-300">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              {getViewTitle(currentView)}
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{currentUser.role} Access</p>
          </div>

          <div className="flex items-center gap-6">
            <div title={`Status: ${connectionStatus}`} className={`w-3 h-3 rounded-full ${connectionColors[connectionStatus]} shadow-sm ring-2 ring-white dark:ring-[#0b0e11] cursor-help transition-all duration-500`}></div>


            <button
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-all"
            >
              {settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative" ref={notifRef}>
              <button
                className="w-10 h-10 rounded-full bg-white dark:bg-[#151a21] border border-gray-200 dark:border-[#2a303c] flex items-center justify-center text-gray-400 transition-all relative group"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <Bell size={18} className={`group-hover:${activeTheme.text}`} />
                {unreadCount > 0 && (
                  <span className={`absolute top-1 right-1 w-2.5 h-2.5 ${activeTheme.bg} rounded-full border-2 border-white dark:border-[#0b0e11]`}></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-14 w-80 bg-white dark:bg-[#151a21] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a303c] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-gray-200 dark:border-[#2a303c] flex items-center justify-between bg-gray-50 dark:bg-[#0b0e11]">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notificações</h3>
                    <button onClick={onClearNotifications} className={`text-[10px] font-black uppercase ${activeTheme.text}`}>Limpar</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-xs">Sem notificações recentes</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => { onNotificationClick(n); setIsNotifOpen(false); }}
                          className={`p-4 border-b border-gray-100 dark:border-[#2a303c] hover:bg-gray-50 dark:hover:bg-[#1e232d] cursor-pointer transition-colors ${!n.read ? `bg-${settings.themeColor}-500/5` : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-black uppercase ${n.type === 'error' ? 'text-red-500' : n.type === 'warning' ? 'text-amber-500' : activeTheme.text}`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-400 font-medium leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-[#2a303c]"></div>

            <button
              onClick={onNewTask}
              className={`${activeTheme.bg} ${activeTheme.hover} text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${activeTheme.shadow} active:scale-95`}
            >
              + Nova Tarefa
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 pt-4 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
