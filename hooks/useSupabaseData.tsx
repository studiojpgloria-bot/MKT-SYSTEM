import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Task, CalendarEvent, Notification, User, WorkflowStage, SystemSettings, UserRole } from '../types';
import { useSupabaseAuth } from './useSupabaseAuth';
import { INITIAL_WORKFLOW, INITIAL_SETTINGS } from '../constants';

interface SupabaseData {
  tasks: Task[];
  events: CalendarEvent[];
  allUsers: User[];
  notifications: Notification[];
  workflow: WorkflowStage[];
  settings: SystemSettings;
  dataLoading: boolean;
  refetchData: () => void;
}

export const useSupabaseData = (): SupabaseData => {
  const { currentUser, isAuthenticated } = useSupabaseAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStage[]>(INITIAL_WORKFLOW);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetchData = () => setRefreshKey(prev => prev + 1);

  // 1. Load local settings/workflow (runs once)
  useEffect(() => {
    const savedSettings = localStorage.getItem('nexus_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    const savedWorkflow = localStorage.getItem('nexus_workflow');
    if (savedWorkflow) setWorkflow(JSON.parse(savedWorkflow));
    
    // If not authenticated, we still finish the initial local loading
    if (!isAuthenticated) {
        setDataLoading(false);
    }
  }, [isAuthenticated]);

  // 2. Persist local settings/workflow (runs on change)
  useEffect(() => {
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('nexus_workflow', JSON.stringify(workflow));
  }, [workflow]);


  // 3. Fetch remote data (runs on auth change or refresh)
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      // If not authenticated, ensure data is cleared and loading is false
      setTasks([]);
      setEvents([]);
      setAllUsers([]);
      setNotifications([]);
      setDataLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setDataLoading(true);

      // 1. Fetch All Users (Profiles)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url');
      
      let fetchedUsers: User[] = [];
      if (usersData && !usersError) {
        fetchedUsers = usersData.map(p => ({
            id: p.id,
            name: p.name || 'Unknown User',
            role: p.role as UserRole,
            avatar: p.avatar_url || 'https://ui-avatars.com/api/?name=' + p.name?.replace(' ', '+') + '&background=random',
            email: '', 
            status: 'offline', 
            lastSeen: Date.now(),
        }));
        
        // Ensure the current user's full object is prioritized
        const updatedUsers = fetchedUsers.map(u => u.id === currentUser.id ? currentUser : u);
        setAllUsers(updatedUsers);
      } else {
        console.error('Error fetching users:', usersError);
        setAllUsers([currentUser]);
      }

      // 2. Fetch Tasks (RLS handles filtering by user/creator/assignee)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksData && !tasksError) {
        setTasks(tasksData as Task[]);
      } else {
        console.error('Error fetching tasks:', tasksError);
        setTasks([]);
      }

      // 3. Fetch Calendar Events (RLS handles filtering)
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*');
      
      if (eventsData && !eventsError) {
        setEvents(eventsData as CalendarEvent[]);
      } else {
        console.error('Error fetching events:', eventsError);
        setEvents([]);
      }

      // 4. Fetch Notifications (RLS handles filtering by user_id)
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (notifData && !notifError) {
        setNotifications(notifData as Notification[]);
      } else {
        console.error('Error fetching notifications:', notifError);
        setNotifications([]);
      }

      setDataLoading(false);
    };

    fetchAllData();
  }, [isAuthenticated, currentUser?.id, refreshKey]); // Depend only on isAuthenticated, currentUser.id, and refreshKey

  return {
    tasks,
    events,
    allUsers,
    notifications,
    workflow,
    settings,
    dataLoading,
    refetchData,
  };
};