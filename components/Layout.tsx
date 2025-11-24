
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Kanban, Calendar as CalendarIcon, CheckCircle, Settings, LogOut, Menu, Bell, FileBarChart, Check, Trash2, Moon, Sun } from 'lucide-react';
import { User, UserRole, SystemSettings, Notification } from '../types';

interface LayoutProps {
  currentUser: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onNewTask: () => void;
  settings: SystemSettings;
  onToggleTheme: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearNotifications: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  currentUser, 
  currentView, 
  onNavigate, 
  onLogout, 
  onNewTask, 
  settings, 
  onToggleTheme,
  notifications,
  onMarkRead,
  onClearNotifications,
  children 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeColor = settings.themeColor;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notification dropdown when clicking outside
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
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER] },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'reports', label: 'Reports', icon: FileBarChart, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  // Dynamic class helpers
  const getActiveNavClass = () => {
    switch (themeColor) {
      case 'emerald': return 'bg-emerald-600 text-white shadow-md';
      case 'rose': return 'bg-rose-600 text-white shadow-md';
      case 'blue': return 'bg-blue-600 text-white shadow-md';
      case 'violet': return 'bg-violet-600 text-white shadow-md';
      case 'orange': return 'bg-orange-600 text-white shadow-md';
      default: return 'bg-indigo-600 text-white shadow-md';
    }
  };
  
  const getButtonClass = () => {
     switch (themeColor) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'rose': return 'bg-rose-600 hover:bg-rose-700';
      case 'blue': return 'bg-blue-600 hover:bg-blue-700';
      case 'violet': return 'bg-violet-600 hover:bg-violet-700';
      case 'orange': return 'bg-orange-600 hover:bg-orange-700';
      default: return 'bg-indigo-600 hover:bg-indigo-700';
    }
  };
  
  const getLogoBgClass = () => {
     switch (themeColor) {
      case 'emerald': return 'bg-emerald-500';
      case 'rose': return 'bg-rose-500';
      case 'blue': return 'bg-blue-500';
      case 'violet': return 'bg-violet-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-indigo-500';
    }
  };
  
  const getBorderClass = () => {
     switch (themeColor) {
      case 'emerald': return 'border-emerald-500';
      case 'rose': return 'border-rose-500';
      case 'blue': return 'border-blue-500';
      case 'violet': return 'border-violet-500';
      case 'orange': return 'border-orange-500';
      default: return 'border-indigo-500';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col flex-shrink-0 relative z-20 shadow-xl`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              {settings.companyLogo ? (
                  <img src={settings.companyLogo} className="w-8 h-8 rounded bg-white p-0.5 object-contain" alt="Logo"/>
              ) : (
                  <div className={`w-8 h-8 ${getLogoBgClass()} rounded-lg flex items-center justify-center`}>
                    <span className="text-white">{settings.companyName.charAt(0)}</span>
                  </div>
              )}
              <span className="truncate max-w-[140px]">{settings.companyName}</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          {navItems
            .filter((item) => item.roles.includes(currentUser.role))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? getActiveNavClass()
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={22} strokeWidth={1.5} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
            <img
              src={currentUser.avatar}
              alt="Profile"
              className={`w-10 h-10 rounded-full border-2 ${getBorderClass()}`}
            />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{currentUser.role.toLowerCase()}</p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
             <button
             onClick={onLogout}
             className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white border border-slate-700 rounded py-1.5 hover:bg-slate-800 transition-colors"
           >
             <LogOut size={14} />
             Sign Out
           </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-200">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white capitalize tracking-tight">
                {currentView === 'crm' ? 'CRM Kanban' : currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </h1>
            <div className="flex items-center gap-4">
                {/* Dark Mode Toggle */}
                <button 
                  onClick={onToggleTheme}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition-colors"
                >
                   {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <div 
                      className="relative cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                    >
                        <Bell className={`text-gray-500 dark:text-slate-400 hover:text-${themeColor}-600`} size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                        )}
                    </div>

                    {isNotifOpen && (
                      <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                         <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-950">
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm">Notifications</h3>
                            {notifications.length > 0 && (
                                <button 
                                  onClick={onClearNotifications} 
                                  className="text-xs text-gray-500 dark:text-slate-400 hover:text-red-600 flex items-center gap-1"
                                >
                                  <Trash2 size={12} /> Clear All
                                </button>
                            )}
                         </div>
                         <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                                    <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map(n => (
                                  <div 
                                    key={n.id} 
                                    onClick={() => onMarkRead(n.id)}
                                    className={`p-3 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-slate-800/50' : ''}`}
                                  >
                                      <div className="flex justify-between items-start mb-1">
                                          <span className={`text-xs font-bold ${n.type === 'error' ? 'text-red-600' : n.type === 'success' ? 'text-green-600' : 'text-gray-800 dark:text-white'}`}>
                                            {n.title}
                                          </span>
                                          <span className="text-[10px] text-gray-400">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2">{n.message}</p>
                                  </div>
                                ))
                            )}
                         </div>
                      </div>
                    )}
                </div>

                {/* Only show New Task button if allowed (ADMIN or MANAGER) */}
                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && (
                    <button 
                        onClick={onNewTask}
                        className={`${getButtonClass()} text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow-md`}
                    >
                        + New Task
                    </button>
                )}
            </div>
        </header>
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-950 p-6 transition-colors duration-200">
            {children}
        </div>
      </main>
    </div>
  );
};