
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Task, User, UserRole, WorkflowStage, SystemSettings, Notification, 
  CalendarEvent, Document, TaskStage, Attachment, TaskPriority, MindMapDocument, MindMapNode,
  Comment
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

// Bump para 2.2: Força todos os clientes a limparem caches locais antigos/errados
const APP_SCHEMA_VERSION = '2.2';

export const App: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inicialização segura do Usuário
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed.id || !parsed.email) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  });
  
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('nexus_view') || 'dashboard';
  });

  // Inicialização segura das Configurações com Sanitização de Cache
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const savedVersion = localStorage.getItem('nexus_schema_version');
      if (savedVersion !== APP_SCHEMA_VERSION) {
        // Se a versão mudou, limpa configurações locais para evitar conflitos
        localStorage.removeItem('nexus_settings');
        localStorage.setItem('nexus_schema_version', APP_SCHEMA_VERSION);
        return INITIAL_SETTINGS;
      }
      const saved = localStorage.getItem('nexus_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch (e) {
      return INITIAL_SETTINGS;
    }
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
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

  // Aplicação imediata do tema e salvamento de versão
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
    localStorage.setItem('nexus_schema_version', APP_SCHEMA_VERSION);
  }, [settings]);

  const fetchAllData = useCallback(async (manual = false) => {
    if (manual) setIsSyncing(true);
    
    try {
      console.log(`🔄 [Schema ${APP_SCHEMA_VERSION}] Sincronizando com Supabase...`);

      // 1. Configurações - Sempre a verdade vem do banco
      const { data: settingsData } = await supabase.from('system_settings').select('*').eq('id', 'global-config').maybeSingle();
      if (settingsData) setSettings(settingsData);
      else await supabase.from('system_settings').upsert([INITIAL_SETTINGS]);

      // 2. Workflow
      const { data: flowData } = await supabase.from('workflow_stages').select('*').order('id');
      if (flowData && flowData.length > 0) setWorkflow(flowData);

      // 3. Usuários (Sanitização: Remove duplicatas se houver)
      const { data: userData } = await supabase.from('users_profiles').select('*');
      if (userData && userData.length > 0) {
        setUsers(userData);
      } else {
        await supabase.from('users_profiles').upsert(MOCK_USERS);
        setUsers(MOCK_USERS);
      }

      // 4. Tarefas
      const { data: taskData } = await supabase.from('tasks').select('*');
      if (taskData) setTasks(taskData);

      // 5. Outros dados
      const { data: docData } = await supabase.from('documents').select('*');
      if (docData) setDocuments(docData);

      const { data: eventData } = await supabase.from('calendar_events').select('*');
      if (eventData) setEvents(eventData);

      if (currentUser) {
        const { data: notifData } = await supabase.from('notifications').select('*').eq('userId', currentUser.id).order('timestamp', { ascending: false }).limit(10);
        if (notifData) setNotifications(notifData);
      }
      
      console.log("✅ Dados verificados e sincronizados.");
    } catch (err) {
      console.error("❌ Falha na sincronização:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllData();
    const taskSubscription = supabase.channel('nexus-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          fetchAllData(); // Refresh silencioso em caso de qualquer mudança
      })
      .subscribe();
    return () => { supabase.removeChannel(taskSubscription); };
  }, [fetchAllData]);

  const persistTask = async (task: Task) => {
    const { error } = await supabase.from('tasks').upsert([task]);
    if (error) console.error("Erro ao salvar no Supabase:", error);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              const updated = { ...t, ...updates };
              persistTask(updated); 
              return updated;
          }
          return t;
      }));
  };

  const handleAddComment = async (taskId: string, text: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !currentUser) return;
    const newComment: Comment = { id: `c-${Date.now()}`, userId: currentUser.id, text, timestamp: Date.now() };
    const updatedComments = [...(task.comments || []), newComment];
    handleTaskUpdate(taskId, { comments: updatedComments });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nexus_user', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_view');
  };

  const handleResetApp = async () => {
    if (!confirm("⚠️ ATENÇÃO: Isso apagará TODOS os dados do banco e o cache do seu navegador. Deseja continuar?")) return;
    try {
      setIsLoading(true);
      localStorage.clear();
      await supabase.from('tasks').delete().neq('id', '_');
      await supabase.from('calendar_events').delete().neq('id', '_');
      await supabase.from('documents').delete().neq('id', '_');
      await supabase.from('notifications').delete().neq('id', '_');
      window.location.reload();
    } catch (e) {
      alert("Erro ao resetar: " + (e as Error).message);
    }
  };

  if (!currentUser) return <Login users={users} onLogin={handleLogin} settings={settings} onSystemInit={() => {}} />;

  return (
    <Layout
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        onSync={() => fetchAllData(true)}
        onNewTask={() => {
            const newTask: Task = { 
                id: `t-${Date.now()}`, 
                title: '', 
                description: '', 
                stage: workflow[0].id, 
                priority: TaskPriority.MEDIUM, 
                assigneeId: currentUser.id, 
                dueDate: Date.now() + 86400000, 
                client: 'Novo Projeto', 
                projectType: settings.deliveryTypes[0]?.id || 'social-media', 
                estimatedHours: 4, 
                tags: [], 
                subtasks: [], 
                attachments: [], 
                comments: [], 
                timeSpent: 0, 
                accepted: false 
            };
            setSelectedTask(newTask); 
            setIsTaskModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        settings={settings}
        onToggleTheme={async () => { 
          const updated = {...settings, darkMode: !settings.darkMode, id: 'global-config'}; 
          setSettings(updated); 
          await supabase.from('system_settings').upsert([updated]); 
        }}
        notifications={notifications}
        onNotificationClick={async (n) => {
          setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
          await supabase.from('notifications').update({ read: true }).eq('id', n.id);
        }}
        onClearNotifications={async () => {
          setNotifications([]);
          await supabase.from('notifications').delete().eq('userId', currentUser.id);
        }}
    >
        {currentView === 'dashboard' && <Dashboard tasks={tasks} workflow={workflow} themeColor={settings.themeColor} currentUser={currentUser} users={users} notifications={notifications} onUpdateUserStatus={() => {}} onNavigate={setCurrentView} />}
        {currentView === 'crm' && <KanbanBoard tasks={tasks} users={users} workflow={workflow} themeColor={settings.themeColor} currentUser={currentUser} onUpdateTask={handleTaskUpdate} onTaskClick={(tid) => { setSelectedTask(tasks.find(t => t.id === tid)!); setIsTaskModalOpen(true); }} onDeleteTask={async (tid) => { 
            const { error } = await supabase.from('tasks').delete().eq('id', tid);
            if (!error) setTasks(p => p.filter(t => t.id !== tid)); 
        }} onExportTask={() => {}} onNewTask={(stage) => {
            const newTask: Task = { id: `t-${Date.now()}`, title: '', description: '', stage, priority: TaskPriority.MEDIUM, assigneeId: currentUser.id, dueDate: Date.now() + 86400000, client: 'Novo Projeto', projectType: settings.deliveryTypes[0]?.id || 'social-media', estimatedHours: 4, tags: [], subtasks: [], attachments: [], comments: [], timeSpent: 0, accepted: false };
            setSelectedTask(newTask); setIsTaskModalOpen(true);
        }} />}
        {currentView === 'calendar' && <CalendarView events={events} users={users} onAddEvent={async (e) => { 
            const { error } = await supabase.from('calendar_events').upsert([e]);
            if (!error) setEvents(p => [...p, e]);
        }} onUpdateEvent={async (id, updates) => { 
            const event = events.find(ev => ev.id === id);
            if (event) {
                const updated = {...event, ...updates};
                await supabase.from('calendar_events').upsert([updated]);
                setEvents(p => p.map(ev => ev.id === id ? updated : ev));
            }
        }} onDeleteEvent={async (id) => { 
            await supabase.from('calendar_events').delete().eq('id', id);
            setEvents(p => p.filter(ev => ev.id !== id));
        }} onViewTask={() => {}} themeColor={settings.themeColor} settings={settings} />}
        {currentView === 'reports' && <Reports tasks={tasks} users={users} workflow={workflow} themeColor={settings.themeColor} />}
        {currentView === 'approvals' && <ApprovalCenter tasks={tasks} onApprove={async (tid, aid) => { 
            const task = tasks.find(t => t.id === tid);
            if (task) {
                const updatedAttachments = task.attachments.map(a => a.id === aid ? { ...a, status: 'approved' } : a);
                handleTaskUpdate(tid, { attachments: updatedAttachments as any, stage: settings.workflowRules.onApprove });
            }
        }} onReject={async (tid, aid, feedback) => {
            const task = tasks.find(t => t.id === tid);
            if (task) {
                const updatedAttachments = task.attachments.map(a => a.id === aid ? { ...a, status: 'rejected', feedback } : a);
                handleTaskUpdate(tid, { attachments: updatedAttachments as any, stage: settings.workflowRules.onReject });
            }
        }} />}
        {currentView === 'settings' && <Settings settings={settings} users={users} workflow={workflow} tasks={tasks} currentUser={currentUser} onUpdateSettings={async (s) => { 
            const updated = { ...s, id: 'global-config' };
            const { error } = await supabase.from('system_settings').upsert([updated]); 
            if (!error) setSettings(updated);
        }} onUpdateUsers={async (updatedUsers) => { 
            setUsers(updatedUsers); 
            await supabase.from('users_profiles').upsert(updatedUsers); 
        }} onUpdateWorkflow={async (nw) => { 
            setWorkflow(nw); 
            await supabase.from('workflow_stages').upsert(nw); 
        }} onResetApp={handleResetApp} />}
        {currentView === 'documents' && <DocumentsView documents={documents} users={users} onCreate={() => { setSelectedDoc(null); setIsDocEditorOpen(true); }} onEdit={(doc) => { setSelectedDoc(doc); setIsDocEditorOpen(true); }} onDelete={async (id) => { 
            await supabase.from('documents').delete().eq('id', id);
            setDocuments(p => p.filter(d => d.id !== id));
        }} themeColor={settings.themeColor} />}
        
        <TaskDetailModal currentUser={currentUser} isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} task={selectedTask} allTasks={tasks} workflow={workflow} onUpdate={handleTaskUpdate} onCreate={async (t) => { 
          const { error } = await supabase.from('tasks').upsert([t]);
          if (!error) {
              setTasks(p => [...p, t]);
              setIsTaskModalOpen(false);
          }
        }} onAddComment={handleAddComment} onDelete={async (tid) => { 
            await supabase.from('tasks').delete().eq('id', tid);
            setTasks(p => p.filter(t => t.id !== tid)); 
            setIsTaskModalOpen(false);
        }} onAccept={(tid) => handleTaskUpdate(tid, { accepted: true, stage: settings.workflowRules.onAccept })} settings={settings} users={users} />
        
        <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} onUpdateProfile={async (up) => { 
            const updated = {...currentUser, ...up}; 
            setCurrentUser(updated); 
            await supabase.from('users_profiles').upsert([updated]); 
        }} />
        
        <DocumentEditorModal isOpen={isDocEditorOpen} onClose={() => setIsDocEditorOpen(false)} document={selectedDoc} onSave={async (doc) => { 
            const id = selectedDoc ? selectedDoc.id : Date.now().toString();
            const payload = {
                id,
                authorId: currentUser.id,
                createdAt: selectedDoc ? selectedDoc.createdAt : Date.now(),
                updatedAt: Date.now(),
                ...doc
            };
            const { error } = await supabase.from('documents').upsert([payload]);
            if (!error) {
                if (selectedDoc) setDocuments(p => p.map(d => d.id === id ? payload as Document : d));
                else setDocuments(p => [...p, payload as Document]);
            }
        }} themeColor={settings.themeColor} tasks={tasks} users={users} currentUser={currentUser} />
    </Layout>
  );
};
