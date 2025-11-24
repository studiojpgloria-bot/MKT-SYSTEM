import React, { useState, useEffect } from 'react';
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
import { MOCK_USERS, INITIAL_TASKS, INITIAL_EVENTS, INITIAL_SETTINGS } from './constants';
import { Task, User, UserRole, TaskPriority, Attachment, Notification, SystemSettings, WorkflowStage, CalendarEvent } from './types';

// Initial Workflow
const INITIAL_WORKFLOW: WorkflowStage[] = [
  { id: 'briefing', name: 'Briefing', color: 'indigo' },
  { id: 'design', name: 'Design', color: 'indigo' },
  { id: 'review', name: 'Review', color: 'indigo' },
  { id: 'approved', name: 'Approved', color: 'indigo' },
  { id: 'published', name: 'Published', color: 'indigo' }
];

export const App: React.FC = () => {
  // State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Load from LocalStorage or use Initial
  const [tasks, setTasks] = useState<Task[]>(() => {
      const saved = localStorage.getItem('nexus_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
      const saved = localStorage.getItem('nexus_events');
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  const [users, setUsers] = useState<User[]>(() => {
      const saved = localStorage.getItem('nexus_users');
      return saved ? JSON.parse(saved) : MOCK_USERS;
  });
  const [workflow, setWorkflow] = useState<WorkflowStage[]>(() => {
      const saved = localStorage.getItem('nexus_workflow');
      return saved ? JSON.parse(saved) : INITIAL_WORKFLOW;
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
      const saved = localStorage.getItem('nexus_notifications');
      return saved ? JSON.parse(saved) : [];
  });
  
  const [settings, setSettings] = useState<SystemSettings>(() => {
      const savedTheme = localStorage.getItem('nexus_settings');
      return savedTheme ? JSON.parse(savedTheme) : INITIAL_SETTINGS;
  });
  
  // Modal State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Transient Toasts (Not persisted)
  const [toasts, setToasts] = useState<Notification[]>([]);

  // Apply Dark Mode Effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nexus_darkMode', JSON.stringify(settings.darkMode));
  }, [settings.darkMode]);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('nexus_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('nexus_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('nexus_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('nexus_workflow', JSON.stringify(workflow)); }, [workflow]);
  useEffect(() => { localStorage.setItem('nexus_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('nexus_settings', JSON.stringify(settings)); }, [settings]);

  // Derived State
  const currentUser = users[currentUserIndex % users.length];
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Helper: Add Notification (Both Toast and History)
  const addNotification = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      const newNotif: Notification = { id, title, message, type, read: false, timestamp: Date.now() };
      
      // Add to history
      setNotifications(prev => [newNotif, ...prev]);
      
      // Add to toast queue
      setToasts(prev => [...prev, newNotif]);
      setTimeout(() => {
          setToasts(prev => prev.filter(n => n.id !== id));
      }, 5000);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(n => n.id !== id));
  };

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const clearNotifications = () => {
      setNotifications([]);
  };

  // Reset Logic
  const handleResetApp = () => {
      localStorage.clear();
      setTasks(INITIAL_TASKS);
      setEvents(INITIAL_EVENTS);
      setUsers(MOCK_USERS);
      setWorkflow(INITIAL_WORKFLOW);
      setNotifications([]);
      setSettings(INITIAL_SETTINGS);
      addNotification('System Reset', 'All data has been restored to defaults.', 'info');
  };

  // Auth Handlers
  const handleLogin = (user: User) => {
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
          setCurrentUserIndex(index);
          setIsAuthenticated(true);
          addNotification('Welcome Back', `Signed in as ${user.name}`, 'success');
          
          // Set status to online on login
          const updatedUsers = users.map(u => u.id === user.id ? { ...u, status: 'online' as const, lastSeen: Date.now() } : u);
          setUsers(updatedUsers);
      }
  };

  const handleLogout = () => {
      // Set status to offline on logout
      const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, status: 'offline' as const, lastSeen: Date.now() } : u);
      setUsers(updatedUsers);
      
      setIsAuthenticated(false);
      setCurrentView('dashboard');
  };

  const handleUpdateUserStatus = (status: 'online' | 'paused' | 'offline') => {
      const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, status, lastSeen: Date.now() } : u);
      setUsers(updatedUsers);
      
      if (status === 'paused') {
          addNotification('Status Updated', 'You are now paused for 15 minutes.', 'warning');
      } else if (status === 'online') {
          addNotification('Status Updated', 'You are back online.', 'success');
      }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const handleAcceptTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
            ...t,
            stage: 'design', 
            accepted: true
        };
    }));
    addNotification('Task Accepted', 'Task moved to Design stage.', 'success');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTaskId === taskId) {
        setIsTaskModalOpen(false);
        setSelectedTaskId(null);
    }
    addNotification('Task Deleted', 'The task has been permanently removed.', 'warning');
  };
  
  const handleExportTask = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Create CSV Content
      const headers = ['ID', 'Title', 'Client', 'Status', 'Priority', 'Due Date', 'Assignee'];
      const row = [
          task.id,
          `"${task.title.replace(/"/g, '""')}"`, // Escape quotes
          `"${task.client}"`,
          task.stage,
          task.priority,
          new Date(task.dueDate).toLocaleDateString(),
          users.find(u => u.id === task.assigneeId)?.name || 'Unassigned'
      ];

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), row.join(',')].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `task_${task.id}.csv`);
      document.body.appendChild(link); // Required for FF
      
      link.click();
      document.body.removeChild(link);

      addNotification('Export Complete', 'Task details downloaded as CSV.', 'success');
  };

  const handleUploadAttachment = (taskId: string, file: File) => {
    const mockUrl = URL.createObjectURL(file);
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'pdf';
    
    const isManagerOrAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
    
    // Admin uploads are references (approved by default), Members are deliverables (pending)
    const category = isManagerOrAdmin ? 'reference' : 'deliverable';
    const status = isManagerOrAdmin ? 'approved' : 'pending';

    const newAttachment: Attachment = {
        id: `a${Date.now()}`,
        name: file.name,
        url: mockUrl,
        type: type as any,
        source: 'local',
        category: category,
        uploadedBy: currentUser.id,
        status: status
    };

    processAttachmentLogic(taskId, newAttachment);
  };

  const handleCloudImport = (taskId: string, service: string) => {
      // Simulate async cloud fetch
      addNotification('Connecting to Cloud', `Fetching files from ${service.replace('_', ' ')}...`, 'info');
      
      const isManagerOrAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
      const category = isManagerOrAdmin ? 'reference' : 'deliverable';
      const status = isManagerOrAdmin ? 'approved' : 'pending';

      setTimeout(() => {
          const newAttachment: Attachment = {
            id: `c${Date.now()}`,
            name: `Project_Brief_${service}.pdf`,
            url: '#', // Mock URL
            type: 'pdf',
            source: service as any,
            category: category,
            uploadedBy: currentUser.id,
            status: status
          };
          
          processAttachmentLogic(taskId, newAttachment);
      }, 1500);
  };

  const processAttachmentLogic = (taskId: string, newAttachment: Attachment) => {
    setTasks(prev => prev.map(t => {
        if(t.id !== taskId) return t;
        
        // WORKFLOW RULE: If Member uploads a DELIVERABLE in Design stage, move to Review
        let newStage = t.stage;
        if (t.stage === 'design' && newAttachment.category === 'deliverable') {
            newStage = 'review';
            addNotification('Submitted for Review', 'Deliverable attached and task sent for approval.', 'success');
        } else if (newAttachment.category === 'reference') {
             addNotification('Reference Added', 'Reference file added to task.', 'success');
        } else {
            addNotification('Attachment Added', 'File added to task.', 'success');
        }

        return { 
            ...t, 
            stage: newStage,
            attachments: [...t.attachments, newAttachment] 
        };
    }));
  };

  const handleAddComment = (taskId: string, text: string) => {
      const newComment = {
          id: Date.now().toString(),
          userId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;
          return { ...t, comments: [...t.comments, newComment] };
      }));
  };

  const handleApproveFile = (taskId: string, attachmentId: string) => {
    setTasks(prev => prev.map(t => {
        if(t.id !== taskId) return t;
        return {
            ...t,
            stage: 'approved',
            attachments: t.attachments.map(a => a.id === attachmentId ? {...a, status: 'approved'} : a)
        };
    }));
    addNotification('Asset Approved', 'Task moved to Approved stage.', 'success');
  };

  const handleRejectFile = (taskId: string, attachmentId: string, feedback?: string) => {
    setTasks(prev => prev.map(t => {
        if(t.id !== taskId) return t;
        return {
            ...t,
            stage: 'design', // Move back to Design/Changes column
            attachments: t.attachments.map(a => a.id === attachmentId ? {...a, status: 'rejected', feedback: feedback || a.feedback} : a)
        };
    }));
    addNotification('Revisão Solicitada', 'A tarefa retornou para o estágio de Design.', 'warning');
  };

  const handleOpenTask = (taskId: string) => {
      setSelectedTaskId(taskId);
      setIsTaskModalOpen(true);
  };

  const handleNewTask = () => {
      const newTask: Task = {
          id: `t${Date.now()}`,
          title: 'New Task',
          description: '',
          stage: 'briefing',
          priority: TaskPriority.MEDIUM,
          assigneeId: currentUser.id,
          dueDate: Date.now() + 86400000,
          client: 'New Client',
          tags: [],
          subtasks: [],
          attachments: [],
          comments: [],
          timeSpent: 0,
          accepted: false
      };
      setTasks(prev => [...prev, newTask]);
      setSelectedTaskId(newTask.id);
      setIsTaskModalOpen(true);
      addNotification('Task Created', 'New task added to Briefing.', 'success');
  };
  
  const handleQuickCreateTask = (title: string, stageId: string) => {
      const newTask: Task = {
          id: `t${Date.now()}`,
          title: title,
          description: '',
          stage: stageId,
          priority: TaskPriority.MEDIUM,
          assigneeId: currentUser.id,
          dueDate: Date.now() + 86400000,
          client: 'New Client',
          tags: [],
          subtasks: [],
          attachments: [],
          comments: [],
          timeSpent: 0,
          accepted: false
      };
      setTasks(prev => [...prev, newTask]);
      addNotification('Task Created', `Added "${title}" to ${workflow.find(w => w.id === stageId)?.name}`, 'success');
  };

  const handleAddEvent = (event: CalendarEvent) => {
      setEvents(prev => [...prev, event]);
      addNotification('Event Created', `Added "${event.title}" to calendar.`, 'success');
  };

  const handleDeleteEvent = (id: string) => {
      setEvents(prev => prev.filter(e => e.id !== id));
      addNotification('Event Deleted', 'Calendar event removed.', 'info');
  };

  // Redirect to allowed view if role changes
  useEffect(() => {
     if (!isAuthenticated) return; // Don't redirect if not logged in

     if ((currentView === 'approvals' || currentView === 'reports') && currentUser.role === UserRole.MEMBER) {
         setCurrentView('dashboard');
     }
     if (currentView === 'settings' && currentUser.role !== UserRole.ADMIN) {
         setCurrentView('dashboard');
     }
  }, [currentUser.role, currentView, isAuthenticated]);

  // Main Render Logic
  if (!isAuthenticated) {
      return <Login users={users} onLogin={handleLogin} settings={settings} />;
  }
  
  // Merge Manual Events + Task Deadlines for Calendar
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
    <Layout 
        currentUser={currentUser} 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout}
        onNewTask={handleNewTask}
        settings={settings}
        onToggleTheme={() => setSettings(prev => ({...prev, darkMode: !prev.darkMode}))}
        notifications={notifications}
        onMarkRead={markNotificationRead}
        onClearNotifications={clearNotifications}
    >
      {currentView === 'dashboard' ? (
        <Dashboard 
            tasks={tasks} 
            workflow={workflow} 
            themeColor={settings.themeColor} 
            currentUser={currentUser} 
            users={users}
            notifications={notifications}
            onUpdateUserStatus={handleUpdateUserStatus}
            onTaskClick={handleOpenTask}
        />
      ) : currentView === 'crm' ? (
        <div className="h-full">
            <KanbanBoard 
                tasks={tasks} 
                users={users} 
                workflow={workflow}
                themeColor={settings.themeColor}
                onUpdateTask={handleTaskUpdate}
                onTaskClick={handleOpenTask}
                onDeleteTask={handleDeleteTask}
                onExportTask={handleExportTask}
                onCreateTask={handleQuickCreateTask}
                currentUser={currentUser}
            />
        </div>
      ) : currentView === 'calendar' ? (
        <CalendarView events={calendarEvents} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} />
      ) : currentView === 'approvals' ? (
        <ApprovalCenter tasks={tasks} onApprove={handleApproveFile} onReject={handleRejectFile} />
      ) : currentView === 'reports' ? (
        <Reports tasks={tasks} users={users} workflow={workflow} themeColor={settings.themeColor} />
      ) : currentView === 'settings' ? (
        <Settings 
            settings={settings}
            users={users}
            workflow={workflow}
            currentUser={currentUser}
            onUpdateSettings={setSettings}
            onUpdateUsers={setUsers}
            onUpdateWorkflow={setWorkflow}
            onResetApp={handleResetApp}
        />
      ) : (
        <Dashboard 
            tasks={tasks} 
            workflow={workflow} 
            themeColor={settings.themeColor} 
            currentUser={currentUser} 
            users={users}
            notifications={notifications}
            onUpdateUserStatus={handleUpdateUserStatus}
            onTaskClick={handleOpenTask}
        />
      )}

      {/* Transient Toasts */}
      <div className="fixed top-4 right-4 z-[60] space-y-3 pointer-events-none">
        {toasts.map(n => (
            <NotificationToast 
                key={n.id} 
                title={n.title} 
                message={n.message} 
                type={n.type} 
                onClose={() => removeToast(n.id)} 
            />
        ))}
      </div>

      <TaskDetailModal 
        currentUser={currentUser}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        users={users}
        workflow={workflow}
        onUpdate={handleTaskUpdate}
        onAddComment={handleAddComment}
        onDelete={handleDeleteTask}
        onUpload={handleUploadAttachment}
        onCloudImport={handleCloudImport}
        onAccept={handleAcceptTask}
        onApprove={handleApproveFile}
        onReject={handleRejectFile}
      />
    </Layout>
  );
};