import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { ApprovalCenter } from './components/ApprovalCenter';
import { TaskDetailModal } from './components/TaskDetailModal';
import { NotificationToast } from './components/NotificationToast';
import { Settings } from './components/Settings';
import { Reports } from './components/Reports'; 
import { ProfilePage } from './components/ProfilePage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MOCK_USERS, INITIAL_TASKS, INITIAL_EVENTS, INITIAL_SETTINGS } from './constants';
import { Task, User, UserRole, Notification, SystemSettings, WorkflowStage, CalendarEvent } from './types';
import { supabase } from './integrations/supabase/client';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  
  const [dataLoading, setDataLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const refetchData = useCallback(() => setRefetchTrigger(prev => prev + 1), []);

  const addNotification = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      const newToast: Notification = { id, title, message, type, read: false, timestamp: Date.now() };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => setToasts(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!isAuthenticated) return;
      setDataLoading(true);

      const [settingsRes, usersRes, tasksRes, eventsRes, notifsRes] = await Promise.all([
        supabase.from('app_settings').select('*').single(),
        supabase.from('profiles').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('calendar_events').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data.system_settings);
        setWorkflow(settingsRes.data.workflow);
      }
      if (usersRes.data) {
        const allUsers = usersRes.data.map(p => ({
          id: p.id,
          name: p.name || 'Unnamed User',
          role: p.role as UserRole,
          avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.name?.replace(' ', '+') || 'U'}&background=random`,
          email: p.email || '',
          status: 'offline',
          lastSeen: Date.now(),
        } as User));
        setUsers(allUsers);
      }
      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (eventsRes.data) setEvents(eventsRes.data as CalendarEvent[]);
      if (notifsRes.data) setNotifications(notifsRes.data as Notification[]);
      
      setDataLoading(false);
    };

    fetchAllData();
  }, [isAuthenticated, refetchTrigger]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleLogin = (user: User) => {
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      addNotification('Welcome Back', `Signed in as ${foundUser.name}`, 'success');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  const handleSaveSettings = async (newSettings: SystemSettings, newWorkflow: WorkflowStage[]) => {
    addNotification('Saving...', 'Updating system settings.', 'info');
    const { error } = await supabase
      .from('app_settings')
      .update({ system_settings: newSettings, workflow: newWorkflow })
      .eq('id', 1);

    if (error) {
      addNotification('Error', `Failed to save settings: ${error.message}`, 'error');
    } else {
      addNotification('Success', 'Settings have been saved.', 'success');
      refetchData();
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    
    if (error) {
      addNotification('Error', `Failed to update role: ${error.message}`, 'error');
    } else {
      addNotification('Success', "User's role has been updated.", 'success');
      refetchData();
    }
  };

  const handleOpenTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskModalOpen(true);
  };

  if (!isAuthenticated) {
    return <Login users={MOCK_USERS} onLogin={handleLogin} settings={settings} />;
  }

  if (dataLoading) {
    return <LoadingSpinner />;
  }

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;
  const calendarEvents: CalendarEvent[] = [
      ...events,
      ...tasks.map(t => ({
          id: `deadline-${t.id}`,
          title: `Due: ${t.title}`,
          start: t.dueDate,
          end: t.dueDate,
          type: 'deadline' as const,
          taskId: t.id
      }))
  ];

  return (
    <>
      <Layout 
          currentUser={currentUser} 
          currentView={currentView} 
          onNavigate={setCurrentView} 
          onLogout={handleLogout}
          onNewTask={() => {}}
          settings={settings}
          onToggleTheme={() => handleSaveSettings({ ...settings, darkMode: !settings.darkMode }, workflow)}
          notifications={notifications}
          onMarkRead={() => {}}
          onClearNotifications={() => {}}
      >
        {currentView === 'dashboard' ? <Dashboard tasks={tasks} workflow={workflow} themeColor={settings.themeColor} currentUser={currentUser} users={users} notifications={notifications} onUpdateUserStatus={() => {}} onTaskClick={handleOpenTask} />
        : currentView === 'crm' ? <KanbanBoard tasks={tasks} users={users} workflow={workflow} themeColor={settings.themeColor} onUpdateTask={() => {}} onTaskClick={handleOpenTask} onDeleteTask={() => {}} onExportTask={() => {}} onCreateTask={() => {}} currentUser={currentUser} />
        : currentView === 'calendar' ? <CalendarView events={calendarEvents} onAddEvent={() => {}} onDeleteEvent={() => {}} />
        : currentView === 'approvals' ? <ApprovalCenter tasks={tasks} onApprove={() => {}} onReject={() => {}} />
        : currentView === 'reports' ? <Reports tasks={tasks} users={users} workflow={workflow} themeColor={settings.themeColor} />
        : currentView === 'settings' ? <Settings settings={settings} users={users} workflow={workflow} currentUser={currentUser} onSave={handleSaveSettings} onUpdateUserRole={handleUpdateUserRole} onResetApp={() => {}} />
        : currentView === 'profile' ? <ProfilePage currentUser={currentUser} onUpdateUser={() => {}} themeColor={settings.themeColor} />
        : <Dashboard tasks={tasks} workflow={workflow} themeColor={settings.themeColor} currentUser={currentUser} users={users} notifications={notifications} onUpdateUserStatus={() => {}} onTaskClick={handleOpenTask} />}
      </Layout>

      <div className="fixed top-4 right-4 z-[60] space-y-3 pointer-events-none">
        {toasts.map(n => <NotificationToast key={n.id} title={n.title} message={n.message} type={n.type} onClose={() => setToasts(p => p.filter(t => t.id !== n.id))} />)}
      </div>

      {selectedTask && <TaskDetailModal currentUser={currentUser} isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} task={selectedTask} users={users} workflow={workflow} onUpdate={() => {}} onAddComment={() => {}} onDelete={() => {}} onUpload={() => {}} onCloudImport={() => {}} onAccept={() => {}} onApprove={() => {}} onReject={() => {}} />}
    </>
  );
};