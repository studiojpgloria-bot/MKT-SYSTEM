
import React, { useState, useEffect, useCallback } from 'react';
import {
  Task, User, UserRole, WorkflowStage, SystemSettings, Notification as AppNotification,
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

const APP_SCHEMA_VERSION = '4.0'; // Upgrade para garantir limpeza total

export const App: React.FC = () => {
  /* isSyncing state removed */
  const [isLoading, setIsLoading] = useState(true);

  // 1. Limpeza de emergência e Bump de Versão
  useEffect(() => {
    const savedVersion = localStorage.getItem('nexus_schema_version');
    if (savedVersion !== APP_SCHEMA_VERSION) {
      console.log("⚠️ Nova versão do sistema. Resetando cache local...");
      const user = localStorage.getItem('nexus_user');
      localStorage.clear();
      if (user) localStorage.setItem('nexus_user', user);
      localStorage.setItem('nexus_schema_version', APP_SCHEMA_VERSION);
      window.location.reload();
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return (parsed && parsed.id) ? parsed : null;
    } catch (e) { return null; }
  });

  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('nexus_view') || 'dashboard';
  });

  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
  }, [settings]);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  const fetchSettings = async () => {
    const { data } = await supabase.from('system_settings').select('*').eq('id', 'global-config').maybeSingle();
    if (data && Array.isArray(data.deliveryTypes) && data.deliveryTypes.length > 0) {
      setSettings(data);
    }
  };

  const fetchWorkflow = async () => {
    const { data } = await supabase.from('workflow_stages').select('*').order('id');
    if (data && data.length > 0) setWorkflow(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users_profiles').select('*');
    if (data && data.length > 0) setUsers(data);
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*');
    if (data) setTasks(data);
  };

  const fetchDocuments = async () => {
    const { data } = await supabase.from('documents').select('*');
    if (data) setDocuments(data);
  };

  const fetchEvents = async () => {
    const { data } = await supabase.from('calendar_events').select('*');
    if (data) setEvents(data);
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    const { data } = await supabase.from('notifications').select('*').eq('userId', currentUser.id).order('timestamp', { ascending: false }).limit(10);
    if (data) setNotifications(data);
  };

  const fetchAllData = useCallback(async () => {

    try {
      console.log(`[SYNC] Conectando ao Banco de Dados...`);
      await Promise.all([
        fetchSettings(),
        fetchWorkflow(),
        fetchUsers(),
        fetchTasks(),
        fetchDocuments(),
        fetchEvents(),
        fetchNotifications()
      ]);
      console.log("✅ Banco sincronizado.");
      setConnectionStatus('connected');
    } catch (err) {
      console.error("❌ Erro ao sincronizar:", err);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllData();

    const channel = supabase.channel('nexus-realtime-v4')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('[REALTIME] Change received:', payload);
        const table = payload.table;

        // Granular updates based on table name
        switch (table) {
          case 'tasks': fetchTasks(); break;
          case 'calendar_events': fetchEvents(); break;
          case 'documents': fetchDocuments(); break;
          case 'notifications':
            fetchNotifications();
            if (payload.eventType === 'INSERT' && payload.new.userId === currentUser?.id) {
              // Simple browser notification or alert if window is not focused
              if (Notification.permission === 'granted') {
                new Notification(payload.new.title, { body: payload.new.message });
              }
            }
            break;
          case 'users_profiles': fetchUsers(); break;
          case 'system_settings': fetchSettings(); break;
          case 'workflow_stages': fetchWorkflow(); break;
          default: fetchAllData(); // Fallback
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('connected');
        if (status === 'CHANNEL_ERROR') setConnectionStatus('error');
        if (status === 'TIMED_OUT') setConnectionStatus('error');
        if (status === 'CLOSED') setConnectionStatus('connecting');
      });

    return () => { supabase.removeChannel(channel); };
  }, [fetchAllData]);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, ...updates };
        supabase.from('tasks').upsert([updated]);
        return updated;
      }
      return t;
    }));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nexus_user', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nexus_user');
  };

  const handleResetApp = async () => {
    if (!confirm("🚨 ATENÇÃO: Isso deletará DEFINITIVAMENTE todas as tarefas, eventos e documentos do banco de dados para que você comece do zero. Deseja continuar?")) return;
    setIsLoading(true);
    try {
      localStorage.clear();
      // Deletar com filtro que pegue todos (ex: neq id -1)
      await supabase.from('tasks').delete().neq('id', 'placeholder');
      await supabase.from('calendar_events').delete().neq('id', 'placeholder');
      await supabase.from('documents').delete().neq('id', 'placeholder');
      await supabase.from('notifications').delete().neq('id', 'placeholder');
      alert("Banco de dados resetado com sucesso!");
      window.location.reload();
    } catch (e) {
      alert("Erro ao limpar banco: Verifique permissões RLS.");
    }
  };

  if (!currentUser) return <Login users={users} onLogin={handleLogin} settings={settings} onSystemInit={() => { }} />;

  return (
    <Layout
      currentUser={currentUser}
      currentView={currentView}
      onNavigate={setCurrentView}
      onLogout={handleLogout}
      connectionStatus={connectionStatus}
      onNewTask={() => {
        const firstDeliveryId = settings?.deliveryTypes?.[0]?.id || 'social-media';
        const newTask: Task = { id: `t-${Date.now()}`, title: '', description: '', stage: workflow[0].id, priority: TaskPriority.MEDIUM, assigneeId: currentUser.id, dueDate: Date.now() + 86400000, client: 'Novo Cliente', projectType: firstDeliveryId, estimatedHours: 4, tags: [], subtasks: [], attachments: [], comments: [], timeSpent: 0, accepted: false };
        setSelectedTask(newTask); setIsTaskModalOpen(true);
      }}
      onOpenProfile={() => setIsProfileModalOpen(true)}
      settings={settings}
      onToggleTheme={async () => {
        const updated = { ...settings, darkMode: !settings.darkMode, id: 'global-config' };
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
      {currentView === 'dashboard' && <Dashboard tasks={tasks} workflow={workflow} themeColor={settings.themeColor} currentUser={currentUser} users={users} notifications={notifications} onUpdateUserStatus={() => { }} onNavigate={setCurrentView} />}
      {currentView === 'crm' && <KanbanBoard tasks={tasks} users={users} workflow={workflow} themeColor={settings.themeColor} currentUser={currentUser} onUpdateTask={handleTaskUpdate} onTaskClick={(tid) => { setSelectedTask(tasks.find(t => t.id === tid)!); setIsTaskModalOpen(true); }} onDeleteTask={async (tid) => { await supabase.from('tasks').delete().eq('id', tid); setTasks(p => p.filter(t => t.id !== tid)); }} onExportTask={() => { }} onNewTask={(stage) => { const newTask: Task = { id: `t-${Date.now()}`, title: '', description: '', stage, priority: TaskPriority.MEDIUM, assigneeId: currentUser.id, dueDate: Date.now() + 86400000, client: 'Novo Cliente', projectType: settings?.deliveryTypes?.[0]?.id || 'social-media', estimatedHours: 4, tags: [], subtasks: [], attachments: [], comments: [], timeSpent: 0, accepted: false }; setSelectedTask(newTask); setIsTaskModalOpen(true); }} />}
      {currentView === 'calendar' && <CalendarView
        events={events}
        users={users}
        onAddEvent={async (e) => { await supabase.from('calendar_events').upsert([e]); }}
        onUpdateEvent={async (id, updates) => { const event = events.find(ev => ev.id === id); if (event) await supabase.from('calendar_events').upsert([{ ...event, ...updates }]); }}
        onDeleteEvent={async (id) => { await supabase.from('calendar_events').delete().eq('id', id); }}
        onViewTask={() => { }}
        onToggleComplete={async (event) => {
          const updated = { ...event, completed: !event.completed, completedAt: !event.completed ? Date.now() : null };
          setEvents(prev => prev.map(e => e.id === event.id ? updated : e));
          await supabase.from('calendar_events').upsert([updated]);
        }}
        onNotifyParticipants={async (event) => {
          if (!event.attendeeIds || event.attendeeIds.length === 0) return;
          const newNotifs: AppNotification[] = event.attendeeIds.map(uid => ({
            id: `n-${Date.now()}-${uid}`,
            userId: uid,
            title: 'Evento Iniciando',
            message: `O evento "${event.title}" está prestes a começar!`,
            type: 'info',
            read: false,
            timestamp: Date.now(),
            resourceId: event.id,
            resourceType: 'task' // reusing task type or could add 'event' to types if stricter
          }));
          await supabase.from('notifications').insert(newNotifs);
          alert('Participantes notificados com sucesso!');
        }}
        themeColor={settings.themeColor}
        settings={settings}
      />}
      {currentView === 'reports' && <Reports tasks={tasks} users={users} events={events} workflow={workflow} themeColor={settings.themeColor} />}
      {currentView === 'approvals' && <ApprovalCenter tasks={tasks} onApprove={async (tid, aid) => { const task = tasks.find(t => t.id === tid); if (task) { const updatedAttachments = task.attachments.map(a => a.id === aid ? { ...a, status: 'approved' } : a); handleTaskUpdate(tid, { attachments: updatedAttachments as any, stage: settings.workflowRules.onApprove }); } }}
        onReject={async (tid, aid, feedback) => {
          const task = tasks.find(t => t.id === tid);
          if (task) {
            const updatedAttachments = task.attachments.map(a => a.id === aid ? { ...a, status: 'rejected', feedback } : a);
            await handleTaskUpdate(tid, { attachments: updatedAttachments as any, stage: settings.workflowRules.onReject });

            // Notify Assignee
            const notification: AppNotification = {
              id: `n-${Date.now()}`,
              userId: task.assigneeId,
              title: 'Correção Solicitada',
              message: `O entregável da tarefa "${task.title}" precisa de ajustes. Toque para ver o feedback.`,
              type: 'warning',
              read: false,
              timestamp: Date.now(),
              resourceId: task.id,
              resourceType: 'task'
            };
            await supabase.from('notifications').insert([notification]);
          }
        }} />}
      {currentView === 'settings' && <Settings settings={settings} users={users} workflow={workflow} tasks={tasks} currentUser={currentUser} onUpdateSettings={async (s) => { const updated = { ...s, id: 'global-config' }; await supabase.from('system_settings').upsert([updated]); setSettings(updated); }} onUpdateUsers={async (updatedUsers) => { setUsers(updatedUsers); await supabase.from('users_profiles').upsert(updatedUsers); }} onUpdateWorkflow={async (nw) => { setWorkflow(nw); await supabase.from('workflow_stages').upsert(nw); }} onResetApp={handleResetApp} />}
      {currentView === 'documents' && <DocumentsView documents={documents} users={users} onCreate={() => { setSelectedDoc(null); setIsDocEditorOpen(true); }} onEdit={(doc) => { setSelectedDoc(doc); setIsDocEditorOpen(true); }} onDelete={async (id) => { await supabase.from('documents').delete().eq('id', id); }} themeColor={settings.themeColor} />}

      <TaskDetailModal currentUser={currentUser} isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} task={selectedTask} allTasks={tasks} workflow={workflow} onUpdate={handleTaskUpdate} onCreate={async (t) => { await supabase.from('tasks').upsert([t]); setIsTaskModalOpen(false); }} onAddComment={async (taskId, text) => { const task = tasks.find(t => t.id === taskId); if (task) { const newComment: Comment = { id: `c-${Date.now()}`, userId: currentUser.id, text, timestamp: Date.now() }; handleTaskUpdate(taskId, { comments: [...(task.comments || []), newComment] }); } }} onDelete={async (tid) => { await supabase.from('tasks').delete().eq('id', tid); setIsTaskModalOpen(false); }} onAccept={(tid) => handleTaskUpdate(tid, { accepted: true, stage: settings.workflowRules.onAccept })} settings={settings} users={users} />
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} onUpdateProfile={async (up) => { const updated = { ...currentUser, ...up }; setCurrentUser(updated); await supabase.from('users_profiles').upsert([updated]); }} />
      <DocumentEditorModal isOpen={isDocEditorOpen} onClose={() => setIsDocEditorOpen(false)} document={selectedDoc} onSave={async (doc) => { const id = selectedDoc ? selectedDoc.id : Date.now().toString(); const payload = { id, authorId: currentUser.id, createdAt: selectedDoc ? selectedDoc.createdAt : Date.now(), updatedAt: Date.now(), ...doc }; await supabase.from('documents').upsert([payload]); }} themeColor={settings.themeColor} tasks={tasks} users={users} currentUser={currentUser} />
    </Layout>
  );
};
