import React, from 'react';
import { LayoutDashboard, Kanban, Calendar as CalendarIcon, CheckCircle, Settings, LogOut, Menu, Bell, FileBarChart, User as UserIcon, Briefcase, X } from 'lucide-react';
import { User, UserRole, SystemSettings, Notification } from '../types';

interface LayoutProps {
  currentUser: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onNewTask: () => void;
  settings: SystemSettings;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearNotifications: () => void;
  children: React.ReactNode;
}

const NavItem: React.FC<{
  id: string;
  label: string;
  icon: React.ElementType;
  currentView: string;
  isSidebarOpen: boolean;
  themeColor: string;
  onClick: (view: string) => void;
}> = ({ id, label, icon: Icon, currentView, isSidebarOpen, themeColor, onClick }) => {
  const isActive = currentView === id;
  const activeClass = `bg-${themeColor}-600 text-white shadow-md`;
  const inactiveClass = 'text-slate-400 hover:bg-slate-800 hover:text-white';

  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors w-full ${isActive ? activeClass : inactiveClass}`}
    >
      <Icon size={22} strokeWidth={1.5} />
      {isSidebarOpen && <span className="font-medium truncate">{label}</span>}
    </button>
  );
};

const SidebarContent: React.FC<{
  currentUser: User;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  settings: SystemSettings;
  isSidebarOpen: boolean;
  onClose?: () => void;
}> = ({ currentUser, currentView, onNavigate, onLogout, settings, isSidebarOpen, onClose }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const themeColor = settings.themeColor;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (view: string) => {
    onNavigate(view);
    if (onClose) onClose();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER] },
    { id: 'crm', label: 'CRM Kanban', icon: Kanban, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER] },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER] },
    { id: 'clients', label: 'Clients', icon: Briefcase, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'reports', label: 'Reports', icon: FileBarChart, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <div className="h-16 flex items-center px-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className={`w-8 h-8 bg-${themeColor}-500 rounded-lg flex items-center justify-center`}>
            <span className="text-white">{settings.companyName.charAt(0)}</span>
          </div>
          {isSidebarOpen && <span className="truncate max-w-[140px]">{settings.companyName}</span>}
        </div>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
        {navItems
          .filter((item) => item.roles.includes(currentUser.role))
          .map((item) => (
            <NavItem
              key={item.id}
              {...item}
              currentView={currentView}
              isSidebarOpen={isSidebarOpen}
              themeColor={themeColor}
              onClick={handleNavigation}
            />
          ))}
      </nav>

      <div className="p-4 border-t border-slate-800 relative" ref={profileMenuRef}>
        <div
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={`flex items-center gap-3 cursor-pointer p-2 -m-2 rounded-lg hover:bg-slate-800 transition-colors ${!isSidebarOpen && 'justify-center'}`}
        >
          <img
            src={currentUser.avatar}
            alt="Profile"
            className={`w-10 h-10 rounded-full border-2 border-${themeColor}-500`}
          />
          {isSidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{currentUser.role.toLowerCase()}</p>
            </div>
          )}
        </div>

        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 w-auto bg-slate-950 rounded-lg shadow-2xl border border-slate-800 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => { handleNavigation('profile'); setIsProfileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <UserIcon size={16} />
              Meu Perfil
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-t border-slate-800"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  onNewTask,
  settings,
  notifications,
  onMarkRead,
  onClearNotifications,
  children
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const themeColor = settings.themeColor;
  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 shadow-xl z-20 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <SidebarContent
          currentUser={currentUser}
          currentView={currentView}
          onNavigate={onNavigate}
          onLogout={onLogout}
          settings={settings}
          isSidebarOpen={isSidebarOpen}
        />
      </aside>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="w-64 h-full" onClick={(e) => e.stopPropagation()}>
          <SidebarContent
            currentUser={currentUser}
            currentView={currentView}
            onNavigate={onNavigate}
            onLogout={onLogout}
            settings={settings}
            isSidebarOpen={true}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        </div>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:block p-2 hover:bg-gray-100 rounded-md text-gray-500">
              <Menu size={20} />
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-md text-gray-500">
              <Menu size={20} />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 capitalize tracking-tight">
              {currentView === 'crm' ? 'CRM Kanban' : currentView}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && (
              <button
                onClick={onNewTask}
                className={`hidden sm:flex items-center gap-2 bg-${themeColor}-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow-md hover:bg-${themeColor}-700`}
              >
                + New Task
              </button>
            )}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className={`text-gray-500 hover:text-${themeColor}-600`} size={20} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                    {notifications.length > 0 && <button onClick={onClearNotifications} className="text-xs text-gray-500 hover:text-red-600">Clear All</button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => onMarkRead(n.id)} className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}>
                          <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};