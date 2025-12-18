import React, { useState, useEffect, useCallback } from 'react';
import { 
  Task, User, UserRole, WorkflowStage, SystemSettings, Notification, 
  CalendarEvent, Document, TaskStage
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
import { NotificationToast } from './components/NotificationToast';
import { NiftyImportView } from './components/NiftyImportView';
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

  const resetAndSeedDatabase = async () => {
    setIsLoading(true);
    try {
        console.log("Iniciando Reset de Banco de Dados...");
        
        await supabase.from('tasks').delete().neq('id', 'void');
        await supabase.from('documents').delete().neq('id', 'void');
        await supabase.from('calendar_events').delete().neq('id', 'void');
        await supabase.from('workflow_stages').delete().neq('id', 'void');
        await supabase.from('users_profiles').delete().neq('id', 'void');
        await supabase.from('system_settings').delete().neq('companyName', 'void');

        const { error: userErr } = await supabase.from('users_profiles').insert(MOCK_USERS);
        if (userErr) throw userErr;

        await supabase.from('system_settings').insert([INITIAL_SETTINGS]);
        await supabase.from('workflow_stages').insert(workflow);

        console.log("Banco de dados resetado e semeado com sucesso!");
        alert("Sistema Inicializado com o novo Admin: studiojpgloria@gmail.com");
        window.location.reload();
    } catch (err) {
        console.error("Erro ao resetar banco:", err);
        alert("Erro ao sincronizar reset. Verifique as permissões do Supabase.");
    } finally {
        setIsLoading(false);
    }
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.from('users_profiles').select('*');
      if (!userData || userData.length === 0) {
          setUsers(MOCK_USERS);
      } else {
          setUsers(userData);
      }

      const { data: taskData } = await supabase.from('tasks').select('*');
      if (taskData) setTasks(taskData);

      const { data: docData } = await supabase.from('documents').select('*');
      if (docData) setDocuments(docData);

      const { data: eventData } = await supabase.from('calendar_events').select('*');
      if (eventData) setEvents(eventData);

      const { data: settingsData, error: settingsError } = await supabase.from('system_settings').select('*').maybeSingle();
      if (settingsData && !settingsError) {
          setSettings({
              ...INITIAL_SETTINGS,
              ...settingsData,
              loginScreen: { 
                ...INITIAL_SETTINGS.loginScreen, 
                ...(settingsData.loginScreen || {}) 
              },
              notifications: { 
                ...INITIAL_SETTINGS.notifications, 
                ...(settingsData.notifications || {}) 
              },
              security: { 
                ...INITIAL_SETTINGS.security, 
                ...(settingsData.security || {}) 
              },
              workflowRules: { 
                ...INITIAL_SETTINGS.workflowRules, 
                ...(settingsData.workflowRules || {}) 
              }
          });
      }

      const { data: flowData } = await supabase.from('workflow_stages').select('*');
      if (flowData && flowData.length > 0) setWorkflow(flowData);

    } catch (err) {
      console.error("Supabase Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const addNotification = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const newNotif: Notification = {
      id: `n-${Date.now()}`,
      userId: currentUser?.id || 'system',
      title,
      message,
      type,
      read: false,
      timestamp: Date.now()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (settings?.darkMode !== undefined) {
      document.documentElement.classList.toggle('dark', settings.darkMode);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    }
  };

  const handleNewTask = (stageId?: string | any) => {
    const validStageId = typeof stageId === 'string' ? stageId : workflow[0].id;
    const newTask: Task = {
        id: `t-${Date.now()}`,
        title: '',
        description: '',
        stage: validStageId,
        priority: 'MEDIUM' as any,
        assigneeId: currentUser?.id || '',
        dueDate: Date.now() + 86400000,
        client: 'Novo Cliente',
        tags: [],
        subtasks: [],
        attachments: [],
        comments: [],
        timeSpent: 0,
        accepted: false
    };
    setSelectedTask(newTask);
    setIsTaskModalOpen(true);
  };

  const handleSaveNewTask = async (taskToSave: Task) => {
      setTasks(prev => [...prev, taskToSave]);
      addNotification('Tarefa Criada', `A tarefa "${taskToSave.title}" foi criada.`, 'success');
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      await supabase.from('tasks').insert([taskToSave]);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      if (selectedTask?.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
      }
      await supabase.from('tasks').update(updates).eq('id', taskId);
  };

  const handleAcceptTask = async (taskId: string) => {
      const targetStage = settings.workflowRules.onAccept || 'design';
      await handleTaskUpdate(taskId, { accepted: true, stage: targetStage });
      addNotification('Tarefa Aceita', 'Você aceitou a tarefa.', 'success');
  };

  const handleDeleteTask = async (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      addNotification('Tarefa Excluída', 'A tarefa foi removida.', 'warning');
      await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleAddComment = (taskId: string, text: string) => {
      const comment = {
          id: `c-${Date.now()}`,
          userId: currentUser?.id || 'unknown',
          text,
          timestamp: Date.now()
      };
      const task = tasks.find(t => t.id === taskId);
      if (task) {
          const updatedComments = [...task.comments, comment];
          handleTaskUpdate(taskId, { comments: updatedComments });
      }
  };

  const handleImportTasks = async (newTasks: Task[]) => {
      setTasks(prev => [...prev, ...newTasks]);
      addNotification('Importação Concluída', `${newTasks.length} tarefas importadas.`, 'success');
      await supabase.from('tasks').insert(newTasks);
  };

  const handleAddEvent = async (event: CalendarEvent) => {
      setEvents(prev => [...prev, event]);
      addNotification('Evento Criado', event.title, 'success');
      await supabase.from('calendar_events').insert([event]);
  };

  const handleDeleteEvent = async (id: string) => {
      setEvents(prev => prev.filter(e => e.id !== id));
      await supabase.from('calendar_events').delete().eq('id', id);
  };

  const handleSaveDocument = async (docData: Partial<Document>) => {
      if (selectedDoc) {
          const updated = { ...selectedDoc, ...docData, updatedAt: Date.now() };
          setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? updated : d));
          await supabase.from('documents').update(updated).eq('id', selectedDoc.id);
          addNotification('Documento Salvo', 'As alterações foram salvas.', 'success');
      } else {
          const newDoc: Document = {
              id: `d-${Date.now()}`,
              title: docData.title || 'Sem Título',
              content: docData.content || '',
              type: docData.type || 'general',
              tags: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              authorId: currentUser?.id || 'unknown',
              ...docData
          } as Document;
          setDocuments(prev => [...prev, newDoc]);
          await supabase.from('documents').insert([newDoc]);
          addNotification('Documento Criado', 'Novo documento criado.', 'success');
      }
      setIsDocEditorOpen(false);
  };

  const handleDeleteDocument = async (id: string) => {
      if(confirm('Excluir este documento?')) {
          setDocuments(prev => prev.filter(d => d.id !== id));
          await supabase.from('documents').delete().eq('id', id);
      }
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
      if (currentUser) {
          const updated = { ...currentUser, ...data };
          setCurrentUser(updated);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
          await supabase.from('users_profiles').upsert([updated]);
          addNotification('Perfil Atualizado', 'Seus dados foram salvos.', 'success');
      }
  };

  const handleUpdateSettings = async (newSettings: SystemSettings) => {
      setSettings(newSettings);
      document.documentElement.classList.toggle('dark', newSettings.darkMode);
      await supabase.from('system_settings').upsert([newSettings]);
      addNotification('Configurações Salvas', 'O sistema foi atualizado.', 'success');
  };

  const handleUpdateWorkflow = async (newFlow: WorkflowStage[]) => {
      setWorkflow(newFlow);
      await supabase.from('workflow_stages').delete().neq('id', 'void');
      await supabase.from('workflow_stages').insert(newFlow);
  };

  if (!currentUser) {
      return (
        <Login 
            users={users} 
            onLogin={handleLogin} 
            settings={settings} 
            onSystemInit={resetAndSeedDatabase} 
        />
      );
  }

  if (isLoading) {
      return (
          <div className="h-screen bg-[#0b0e11] flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium animate-pulse">Sincronizando com Supabase...</p>
          </div>
      );
  }

  return (
    <Layout
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onNewTask={handleNewTask}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        settings={settings}
        onToggleTheme={() => handleUpdateSettings({...settings, darkMode: !settings.darkMode})}
        notifications={notifications}
        onNotificationClick={(n) => {
            setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
        }}
        onClearNotifications={() => setNotifications([])}
    >
        {currentView === 'dashboard' && (
            <Dashboard 
                tasks={tasks} 
                workflow={workflow} 
                themeColor={settings.themeColor}
                currentUser={currentUser}
                users={users}
                notifications={notifications}
                onUpdateUserStatus={(status) => handleUpdateProfile({ status })}
                onTaskClick={handleTaskClick}
                onNavigate={handleNavigate}
            />
        )}
        
        {currentView === 'crm' && (
            <KanbanBoard 
                tasks={tasks}
                users={users}
                workflow={workflow}
                themeColor={settings.themeColor}
                currentUser={currentUser}
                onUpdateTask={handleTaskUpdate}
                onTaskClick={handleTaskClick}
                onDeleteTask={handleDeleteTask}
                onExportTask={(id) => console.log('Export', id)}
                onNewTask={handleNewTask}
            />
        )}

        {currentView === 'calendar' && (
            <CalendarView 
                events={events}
                onAddEvent={handleAddEvent}
                onDeleteEvent={handleDeleteEvent}
                onViewTask={handleTaskClick}
            />
        )}

        {currentView === 'documents' && (
            <DocumentsView 
                documents={documents}
                users={users}
                onCreate={() => { setSelectedDoc(null); setIsDocEditorOpen(true); }}
                onEdit={(doc) => { setSelectedDoc(doc); setIsDocEditorOpen(true); }}
                onDelete={handleDeleteDocument}
                themeColor={settings.themeColor}
            />
        )}

        {currentView === 'approvals' && (
            <ApprovalCenter 
                tasks={tasks}
                onApprove={(tid, aid) => handleTaskUpdate(tid, { attachments: tasks.find(t => t.id === tid)?.attachments.map(a => a.id === aid ? {...a, status: 'approved'} : a) as any })}
                onReject={(tid, aid, feed) => handleTaskUpdate(tid, { attachments: tasks.find(t => t.id === tid)?.attachments.map(a => a.id === aid ? {...a, status: 'rejected', feedback: feed} : a) as any })}
            />
        )}

        {currentView === 'reports' && (
            <Reports 
                tasks={tasks}
                users={users}
                workflow={workflow}
                themeColor={settings.themeColor}
                onTaskClick={handleTaskClick}
            />
        )}

        {currentView === 'import' && (
            <NiftyImportView 
                users={users}
                workflow={workflow}
                themeColor={settings.themeColor}
                onImportTasks={handleImportTasks}
                allTasks={tasks}
            />
        )}

        {currentView === 'settings' && (
            <Settings 
                settings={settings}
                users={users}
                workflow={workflow}
                tasks={tasks}
                currentUser={currentUser}
                onUpdateSettings={handleUpdateSettings}
                onUpdateUsers={setUsers}
                onUpdateWorkflow={handleUpdateWorkflow}
                onResetApp={resetAndSeedDatabase}
            />
        )}

        <TaskDetailModal 
            currentUser={currentUser}
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            task={selectedTask}
            allTasks={tasks}
            users={users}
            workflow={workflow}
            onUpdate={handleTaskUpdate}
            onCreate={handleSaveNewTask}
            onAddComment={handleAddComment}
            onDelete={handleDeleteTask}
            onDuplicate={(id) => { const t = tasks.find(x => x.id === id); if(t) handleSaveNewTask({...t, id: `t-${Date.now()}`, title: `${t.title} (Cópia)`}); }}
            onUpload={(tid, file) => console.log('File Upload to tid:', tid, file)}
            onCloudImport={() => {}}
            onAccept={handleAcceptTask}
            onApprove={(tid, aid) => handleTaskUpdate(tid, { attachments: tasks.find(t => t.id === tid)?.attachments.map(a => a.id === aid ? {...a, status: 'approved'} : a) as any })}
            onReject={(tid, aid, feed) => handleTaskUpdate(tid, { attachments: tasks.find(t => t.id === tid)?.attachments.map(a => a.id === aid ? {...a, status: 'rejected', feedback: feed} : a) as any })}
            settings={settings}
        />

        <UserProfileModal 
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
        />

        <DocumentEditorModal 
            isOpen={isDocEditorOpen}
            onClose={() => setIsDocEditorOpen(false)}
            document={selectedDoc}
            onSave={handleSaveDocument}
            themeColor={settings.themeColor}
            tasks={tasks}
            users={users}
            currentUser={currentUser}
        />

        <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 pointer-events-none">
            {notifications.filter(n => !n.read).slice(0, 3).map(n => (
                <NotificationToast 
                    key={n.id} 
                    notification={n} 
                    onClose={() => setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))}
                    onClick={() => setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))}
                />
            ))}
        </div>
    </Layout>
  );
};