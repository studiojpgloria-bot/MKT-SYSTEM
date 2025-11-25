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
import { ProfilePage } from './components/ProfilePage';
import { INITIAL_SETTINGS, INITIAL_WORKFLOW } from './constants';
import { Task, User, UserRole, TaskPriority, Attachment, Notification, SystemSettings, WorkflowStage, CalendarEvent } from './types';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useSupabaseData } from './hooks/useSupabaseData';
import { supabase } from './integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { currentUser, isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth();
  const { 
    tasks, 
    events, 
    allUsers: users, 
    notifications, 
    workflow, 
    settings, 
    dataLoading, 
    refetchData 
  } = useSupabaseData();

  const [currentView, setCurrentView] = useState('dashboard');
  
  // Modal State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Transient Toasts (Not persisted)
  const [toasts, setToasts] = useState<Notification[]>([]);

  // Enforce Light Mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  // Derived State
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Helper: Add Notification (Both Toast and History)
  const addNotification = async (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      const newNotif: Notification = { id, title, message, type, read: false, timestamp: Date.now(), user_id: currentUser?.id || 'system' };
      
      // Add to toast queue
      setToasts(prev => [...prev, newNotif]);
      setTimeout(() => {
          setToasts(prev => prev.filter(n => n.id !== id));
      }, 5000);

      // Persist notification (if user is logged in)
      if (currentUser) {
          const { error } = await supabase.from('notifications').insert({
              user_id: currentUser.id,
              title,
              message,
              type,
              read: false,
          });
          if (error) console.error('Error saving notification:', error);
          refetchData(); // Refresh notification list
      }
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(n => n.id !== id));
  };

  const markNotificationRead = async (id: string) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
      if (error) console.error('Error marking notification read:', error);
      refetchData();
  };
  
  const clearNotifications = async () => {
      // Note: RLS should ensure users can only delete their own notifications
      const { error } = await supabase.from('notifications').delete().eq('user_id', currentUser?.id);
      if (error) console.error('Error clearing notifications:', error);
      refetchData();
  };

  // Reset Logic (Only resets local settings/workflow, not Supabase data)
  const handleResetApp = () => {
      localStorage.clear();
      
      addNotification('System Reset', 'Local settings have been restored to defaults.', 'info');
      refetchData();
  };

  // Auth Handlers
  // Login is handled entirely by SupabaseProvider now. We just trigger a notification.
  useEffect(() => {
      if (isAuthenticated && currentUser) {
          addNotification('Welcome Back', `Signed in as ${currentUser.name}`, 'success');
      }
  }, [isAuthenticated, currentUser]);

  const handleLogout = async () => {
      // Set status to offline (local state only for now)
      
      const { error } = await supabase.auth.signOut();
      if (error) {
          console.error('Error signing out:', error);
          addNotification('Logout Failed', 'Could not sign out.', 'error');
      }
      // SupabaseProvider handles setting isAuthenticated=false and clearing currentUser
  };

  const handleUpdateUserStatus = (status: 'online' | 'paused' | 'offline') => {
      // Status updates are currently local state only.
      if (status === 'paused') {
          addNotification('Status Updated', 'You are now paused for 15 minutes.', 'warning');
      } else if (status === 'online') {
          addNotification('Status Updated', 'You are back online.', 'success');
      }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    // Update profile data in Supabase
    const { error } = await supabase
        .from('profiles')
        .update({ 
            name: updates.name, 
            avatar_url: updates.avatar,
            role: updates.role,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        addNotification('Profile Update Failed', 'Could not save changes.', 'error');
    } else {
        addNotification('Profile Updated', 'Your changes have been saved.', 'success');
        refetchData(); // Refresh data to update local state
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    // Map camelCase keys to snake_case for Supabase if necessary (e.g., dueDate -> due_date)
    const supabaseUpdates: any = {};
    for (const key in updates) {
        const snakeCaseKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        supabaseUpdates[snakeCaseKey] = (updates as any)[key];
    }

    const { error } = await supabase
        .from('tasks')
        .update(supabaseUpdates)
        .eq('id', taskId);
    
    if (error) console.error('Error updating task:', error);
    refetchData();
  };

  const handleAcceptTask = async (taskId: string) => {
    const { error } = await supabase
        .from('tasks')
        .update({ stage: 'design', accepted: true })
        .eq('id', taskId);
    
    if (error) console.error('Error accepting task:', error);
    addNotification('Task Accepted', 'Task moved to Design stage.', 'success');
    refetchData();
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
    
    if (error) console.error('Error deleting task:', error);
    if (selectedTaskId === taskId) {
        setIsTaskModalOpen(false);
        setSelectedTaskId(null);
    }
    addNotification('Task Deleted', 'The task has been permanently removed.', 'warning');
    refetchData();
  };
  
  const handleExportTask = (taskId: string) => {
      // Export logic remains local as it's a client-side operation
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const headers = ['ID', 'Title', 'Client', 'Status', 'Priority', 'Due Date', 'Assignee'];
      const row = [
          task.id,
          `"${task.title.replace(/"/g, '""')}"`,
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
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);

      addNotification('Export Complete', 'Task details downloaded as CSV.', 'success');
  };

  const handleUploadAttachment = (taskId: string, file: File) => {
    // Attachment logic remains mock for now, updating the task's attachments JSONB column.
    const mockUrl = URL.createObjectURL(file);
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'pdf';
    
    const isManagerOrAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;
    
    const category = isManagerOrAdmin ? 'reference' : 'deliverable';
    const status = isManagerOrAdmin ? 'approved' : 'pending';

    const newAttachment: Attachment = {
        id: `a${Date.now()}`,
        name: file.name,
        url: mockUrl,
        type: type as any,
        source: 'local',
        category: category,
        uploadedBy: currentUser?.id || 'system',
        status: status
    };

    processAttachmentLogic(taskId, newAttachment);
  };

  const handleCloudImport = (taskId: string, service: string) => {
      addNotification('Connecting to Cloud', `Fetching files from ${service.replace('_', ' ')}...`, 'info');
      
      const isManagerOrAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;
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
            uploadedBy: currentUser?.id || 'system',
            status: status
          };
          
          processAttachmentLogic(taskId, newAttachment);
      }, 1500);
  };

  const processAttachmentLogic = async (taskId: string, newAttachment: Attachment) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStage = task.stage;
    if (task.stage === 'design' && newAttachment.category === 'deliverable') {
        newStage = 'review';
        addNotification('Submitted for Review', 'Deliverable attached and task sent for approval.', 'success');
    } else if (newAttachment.category === 'reference') {
         addNotification('Reference Added', 'Reference file added to task.', 'success');
    } else {
        addNotification('Attachment Added', 'File added to task.', 'success');
    }

    const updatedAttachments = [...task.attachments, newAttachment];

    const { error } = await supabase
        .from('tasks')
        .update({ 
            stage: newStage,
            attachments: updatedAttachments
        })
        .eq('id', taskId);
    
    if (error) console.error('Error updating task with attachment:', error);
    refetchData();
  };

  const handleAddComment = async (taskId: string, text: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !currentUser) return;

      const newComment = {
          id: Date.now().toString(),
          userId: currentUser.id,
          text,
          timestamp: Date.now()
      };
      
      const updatedComments = [...task.comments, newComment];

      const { error } = await supabase
          .from('tasks')
          .update({ comments: updatedComments })
          .eq('id', taskId);
      
      if (error) console.error('Error adding comment:', error);
      refetchData();
  };

  const handleApproveFile = async (taskId: string, attachmentId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedAttachments = task.attachments.map(a => a.id === attachmentId ? {...a, status: 'approved'} : a);

    const { error } = await supabase
        .from('tasks')
        .update({ 
            stage: 'approved',
            attachments: updatedAttachments
        })
        .eq('id', taskId);
    
    if (error) console.error('Error approving file:', error);
    addNotification('Asset Approved', 'Task moved to Approved stage.', 'success');
    refetchData();
  };

  const handleRejectFile = async (taskId: string, attachmentId: string, feedback?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedAttachments = task.attachments.map(a => a.id === attachmentId ? {...a, status: 'rejected', feedback: feedback || a.feedback} : a);

    const { error } = await supabase
        .from('tasks')
        .update({ 
            stage: 'design', // Move back to Design/Changes column
            attachments: updatedAttachments
        })
        .eq('id', taskId);
    
    if (error) console.error('Error rejecting file:', error);
    addNotification('Revisão Solicitada', 'A tarefa retornou para o estágio de Design.', 'warning');
    refetchData();
  };

  const handleOpenTask = (taskId: string) => {
      setSelectedTaskId(taskId);
      setIsTaskModalOpen(true);
  };

  const handleNewTask = async () => {
      if (!currentUser) return;
      
      const newTask = {
          title: 'New Task',
          description: '',
          stage: 'briefing',
          priority: TaskPriority.MEDIUM,
          assignee_id: currentUser.id,
          creator_id: currentUser.id,
          due_date: new Date(Date.now() + 86400000).toISOString(),
          client: 'New Client',
          tags: [],
          subtasks: [],
          attachments: [],
          comments: [],
          time_spent: 0,
          accepted: false
      };
      
      const { data, error } = await supabase
          .from('tasks')
          .insert(newTask)
          .select()
          .single();

      if (error) {
          console.error('Error creating task:', error);
          addNotification('Task Creation Failed', 'Could not create new task.', 'error');
      } else if (data) {
          setSelectedTaskId(data.id);
          setIsTaskModalOpen(true);
          addNotification('Task Created', 'New task added to Briefing.', 'success');
          refetchData();
      }
  };
  
  const handleQuickCreateTask = async (title: string, stageId: string) => {
      if (!currentUser) return;

      const newTask = {
          title: title,
          description: '',
          stage: stageId,
          priority: TaskPriority.MEDIUM,
          assignee_id: currentUser.id,
          creator_id: currentUser.id,
          due_date: new Date(Date.now() + 86400000).toISOString(),
          client: 'New Client',
          tags: [],
          subtasks: [],
          attachments: [],
          comments: [],
          time_spent: 0,
          accepted: false
      };
      
      const { error } = await supabase.from('tasks').insert(newTask);

      if (error) {
          console.error('Error quick creating task:', error);
          addNotification('Task Creation Failed', 'Could not create new task.', 'error');
      } else {
          addNotification('Task Created', `Added "${title}" to ${workflow.find(w => w.id === stageId)?.name}`, 'success');
          refetchData();
      }
  };

  const handleAddEvent = async (event: CalendarEvent) => {
      if (!currentUser) return;

      const newEvent = {
          creator_id: currentUser.id,
          title: event.title,
          description: event.description,
          start_time: new Date(event.start).toISOString(),
          end_time: new Date(event.end).toISOString(),
          type: event.type,
          platform: event.platform,
          meeting_link: event.meetingLink,
          task_id: event.taskId
      };

      const { error } = await supabase.from('calendar_events').insert(newEvent);
      if (error) console.error('Error adding event:', error);
      addNotification('Event Created', `Added "${event.title}" to calendar.`, 'success');
      refetchData();
  };

  const handleDeleteEvent = async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) console.error('Error deleting event:', error);
      addNotification('Event Deleted', 'Calendar event removed.', 'info');
      refetchData();
  };

  // Redirect to allowed view if role changes
  useEffect(() => {
     if (!isAuthenticated) return;

     if ((currentView === 'approvals' || currentView === 'reports') && currentUser?.role === UserRole.MEMBER) {
         setCurrentView('dashboard');
     }
     if (currentView === 'settings' && currentUser?.role !== UserRole.ADMIN) {
         setCurrentView('dashboard');
     }
  }, [currentUser?.role, currentView, isAuthenticated]);

  // Loading State Render
  if (isAuthLoading || dataLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
    );
  }

  // Main Render Logic
  if (!isAuthenticated || !currentUser) {
      return <Login settings={settings} />;
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
        onToggleTheme={() => {
            // Since we are enforcing light mode, this function does nothing or can be removed from props if possible.
            addNotification('Theme Locked', 'Dark mode is currently disabled.', 'info');
        }}
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
            // Note: Settings persistence logic needs to be implemented in useSupabaseData or passed down.
            onUpdateSettings={() => { /* Placeholder */ }}
            onUpdateUsers={() => { /* Placeholder */ }}
            onUpdateWorkflow={() => { /* Placeholder */ }}
            onResetApp={handleResetApp}
        />
      ) : currentView === 'profile' ? (
        <ProfilePage 
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            themeColor={settings.themeColor}
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