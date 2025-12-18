
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Task, User, UserRole, WorkflowStage, SystemSettings, Notification, 
  CalendarEvent, Document, TaskStage, Attachment
} from './types';
import { 
  MOCK_USERS, INITIAL_TASKS, INITIAL_EVENTS, INITIAL_SETTINGS, INITIAL_DOCUMENTS 
} from './constants';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { CalendarView } from './components/CalendarView';
import { ApprovalCenter } from './components/ApprovalCenter';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { DocumentsView } from './components/DocumentsView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { UserProfileModal } from './components/UserProfileModal';
import { DocumentEditorModal } from './components/DocumentEditorModal';
import { supabase } from './supabase';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [workflow, setWorkflow] = useState<WorkflowStage[]>([
    { id: 'briefing', name: 'Briefing', color: 'gray' },
    { id: 'design', name: 'Design & Criação', color: 'blue' },
    { id: 'review', name: 'Em Revisão', color: 'orange' },
    { id: 'changes', name: 'Alterações', color: 'red' },
    { id: 'approved', name: 'Aprovado', color: 'green' },
    { id: 'published', name: 'Publicado', color: 'purple' }
  ]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDocEditorOpen, setIsDocEditorOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const sanitizeUserForDb = (user: User) => {
    const payload: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status
    };
    // Adiciona password apenas se presente para evitar erros de schema cache se a coluna for recém-criada
    if (user.password) payload.password = user.password;
    return payload;
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.from('users_profiles').select('*');
      if (userData) setUsers(userData.map(u => ({ ...u, lastSeen: Date.now() })));

      const { data: taskData } = await supabase.from('tasks').select('*');
      if (taskData) setTasks(taskData);

      const { data: docData } = await supabase.from('documents').select('*');
      if (docData) setDocuments(docData);

      const { data: eventData } = await supabase.from('calendar_events').select('*');
      if (eventData) setEvents(eventData);

      const { data: settingsData } = await supabase.from('system_settings').select('*').maybeSingle();
      if (settingsData) setSettings({ ...INITIAL_SETTINGS, ...settingsData });

      const { data: flowData } = await supabase.from('workflow_stages').select('*');
      if (flowData && flowData.length > 0) setWorkflow(flowData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      await supabase.from('tasks').update(updates).eq('id', taskId);
  };

  const handleUpdateUsers = async (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    // Fix: Using sanitizeUserForDb instead of the undefined sanitizeUserDb
    const dbPayload = updatedUsers.map(sanitizeUserForDb);
    await supabase.from('users_profiles').upsert(dbPayload, { onConflict: 'id' });
  };

  const resetAndSeedDatabase = async () => {
    if(!confirm("CUIDADO: Isso apagará todos os dados atuais do Supabase. Deseja prosseguir?")) return;
    setIsLoading(true);
    try {
        await supabase.from('tasks').delete().neq('id', 'void');
        await supabase.from('users_profiles').delete().neq('id', 'void');
        const sanitizedSeedUsers = MOCK_USERS.map(sanitizeUserForDb);
        await supabase.from('users_profiles').insert(sanitizedSeedUsers);
        await supabase.from('system_settings').upsert([INITIAL_SETTINGS]);
        alert("Banco inicializado com sucesso!");
        await fetchAllData();
    } catch (err) {
        alert("Erro ao inicializar: " + err);
    } finally {
        setIsLoading(false);
    }
  };

  if (!currentUser) {
    return <Login users={users} onLogin={setCurrentUser} settings={settings} onSystemInit={resetAndSeedDatabase} />;
  }

  return (
    <Layout
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={() => setCurrentUser(null)}
        onNewTask={() => {
            const newTask: Task = { id: `t-${Date.now()}`, title: '', description: '', stage: workflow[0].id, priority: 'MEDIUM' as any, assigneeId: currentUser.id, dueDate: Date.now() + 86400000, client: 'Novo Cliente', tags: [], subtasks: [], attachments: [], comments: [], timeSpent: 0, accepted: false };
            setSelectedTask(newTask); setIsTaskModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        settings={settings}
        onToggleTheme={() => { const updated = {...settings, darkMode: !settings.darkMode}; setSettings(updated); supabase.from('system_settings').upsert([updated]); }}
        notifications={notifications}
        onNotificationClick={(n) => {}}
        onClearNotifications={() => setNotifications([])}
    >
        {currentView === 'dashboard' && <Dashboard tasks={tasks} workflow={workflow} themeColor={settings.themeColor} currentUser={currentUser} users={users} notifications={notifications} onUpdateUserStatus={async (s) => { const updated = {...currentUser, status: s}; setCurrentUser(updated); await supabase.from('users_profiles').upsert([sanitizeUserForDb(updated)]); }} onNavigate={setCurrentView} />}
        {currentView === 'crm' && <KanbanBoard tasks={tasks} users={users} workflow={workflow} themeColor={settings.themeColor} currentUser={currentUser} onUpdateTask={handleTaskUpdate} onTaskClick={(tid) => { setSelectedTask(tasks.find(t => t.id === tid)!); setIsTaskModalOpen(true); }} onDeleteTask={async (tid) => { setTasks(p => p.filter(t => t.id !== tid)); await supabase.from('tasks').delete().eq('id', tid); }} onExportTask={() => {}} onNewTask={() => {}} />}
        {currentView === 'calendar' && <CalendarView events={events} onAddEvent={async (e) => { setEvents(p => [...p, e]); await supabase.from('calendar_events').insert([e]); }} onDeleteEvent={async (id) => { setEvents(p => p.filter(ev => ev.id !== id)); await supabase.from('calendar_events').delete().eq('id', id); }} onViewTask={() => {}} />}
        {currentView === 'reports' && <Reports tasks={tasks} users={users} workflow={workflow} themeColor={settings.themeColor} />}
        {currentView === 'settings' && <Settings settings={settings} users={users} workflow={workflow} tasks={tasks} currentUser={currentUser} onUpdateSettings={async (s) => { setSettings(s); await supabase.from('system_settings').upsert([s]); }} onUpdateUsers={handleUpdateUsers} onUpdateWorkflow={async (w) => { setWorkflow(w); await supabase.from('workflow_stages').delete().neq('id', 'void'); await supabase.from('workflow_stages').insert(w); }} onResetApp={resetAndSeedDatabase} />}
        {currentView === 'documents' && <DocumentsView documents={documents} users={users} onCreate={() => { setSelectedDoc(null); setIsDocEditorOpen(true); }} onEdit={(doc) => { setSelectedDoc(doc); setIsDocEditorOpen(true); }} onDelete={async (id) => { setDocuments(p => p.filter(d => d.id !== id)); await supabase.from('documents').delete().eq('id', id); }} themeColor={settings.themeColor} />}
        
        <TaskDetailModal currentUser={currentUser} isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} task={selectedTask} allTasks={tasks} users={users} workflow={workflow} onUpdate={handleTaskUpdate} onCreate={async (t) => { setTasks(p => [...p, t]); await supabase.from('tasks').insert([t]); setIsTaskModalOpen(false); }} onAddComment={(tid, text) => handleTaskUpdate(tid, { comments: [...tasks.find(t => t.id === tid)!.comments, { id: Date.now().toString(), userId: currentUser.id, text, timestamp: Date.now() }] })} onDelete={async (tid) => { setTasks(p => p.filter(t => t.id !== tid)); await supabase.from('tasks').delete().eq('id', tid); setIsTaskModalOpen(false); }} onDuplicate={() => {}} onUpload={() => {}} onCloudImport={() => {}} onAccept={(tid) => handleTaskUpdate(tid, { accepted: true, stage: settings.workflowRules.onAccept })} onApprove={() => {}} onReject={() => {}} settings={settings} />
        <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} onUpdateProfile={async (up) => { const updated = {...currentUser, ...up}; setCurrentUser(updated); await supabase.from('users_profiles').upsert([sanitizeUserForDb(updated)]); }} />
        <DocumentEditorModal isOpen={isDocEditorOpen} onClose={() => setIsDocEditorOpen(false)} document={selectedDoc} onSave={async (doc) => { if(selectedDoc) { const updated = {...selectedDoc, ...doc, updatedAt: Date.now()}; setDocuments(p => p.map(d => d.id === updated.id ? updated : d)); await supabase.from('documents').update(updated).eq('id', updated.id); } else { const newDoc = {id: Date.now().toString(), createdAt: Date.now(), updatedAt: Date.now(), authorId: currentUser.id, ...doc} as Document; setDocuments(p => [...p, newDoc]); await supabase.from('documents').insert([newDoc]); } }} themeColor={settings.themeColor} tasks={tasks} users={users} currentUser={currentUser} />
    </Layout>
  );
};
