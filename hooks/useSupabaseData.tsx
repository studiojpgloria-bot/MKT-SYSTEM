import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Task, CalendarEvent, Notification, User, WorkflowStage, SystemSettings, UserRole, Client } from '../types';
import { useSupabaseAuth } from './useSupabaseAuth';
import { INITIAL_WORKFLOW, INITIAL_SETTINGS } from '../constants';

interface SupabaseData {
  tasks: Task[];
  events: CalendarEvent[];
  allUsers: User[];
  clients: Client[];
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
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStage[]>(INITIAL_WORKFLOW);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // New state for initial local load

  const refetchData = () => setRefreshKey(prev => prev + 1);

  // 1. Load local settings/workflow (runs once, synchronously)
  useEffect(() => {
    const savedSettings = localStorage.getItem('nexus_settings');
    if (savedSettings) {
        try {
            setSettings(JSON.parse(savedSettings));
        } catch (e) {
            console.error("Error parsing saved settings:", e);
        }
    }
    
    const savedWorkflow = localStorage.getItem('nexus_workflow');
    if (savedWorkflow) {
        try {
            setWorkflow(JSON.parse(savedWorkflow));
        } catch (e) {
            console.error("Error parsing saved workflow:", e);
        }
    }
    
    setInitialLoadComplete(true);
  }, []);

  // 2. Persist local settings/workflow (runs on change)
  useEffect(() => {
    if (initialLoadComplete) {
        localStorage.setItem('nexus_settings', JSON.stringify(settings));
    }
  }, [settings, initialLoadComplete]);

  useEffect(() => {
    if (initialLoadComplete) {
        localStorage.setItem('nexus_workflow', JSON.stringify(workflow));
    }
  }, [workflow, initialLoadComplete]);


  // 3. Fetch remote data (runs on auth change or refresh, only after local load)
  useEffect(() => {
    if (!initialLoadComplete) return;

    if (!isAuthenticated || !currentUser) {
      // If not authenticated, ensure data is cleared and loading is false
      setTasks([]);
      setEvents([]);
      setAllUsers([]);
      setClients([]);
      setNotifications([]);
      setDataLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setDataLoading(true);

      // Fetch All Users (Profiles)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url');
      
      if (usersData && !usersError) {
        const fetchedUsers: User[] = usersData.map(p => ({
            id: p.id,
            name: p.name || 'Unknown User',
            role: p.role as UserRole,
            avatar: p.avatar_url || 'https://ui-avatars.com/api/?name=' + p.name?.replace(' ', '+') + '&background=random',
            email: '', 
            status: 'offline', 
            lastSeen: Date.now(),
        }));
        const updatedUsers = fetchedUsers.map(u => u.id === currentUser.id ? currentUser : u);
        setAllUsers(updatedUsers);
      } else {
        console.error('Error fetching users:', usersError);
        setAllUsers([currentUser]);
      }

      // Fetch Clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');
      
      if (clientsData && !clientsError) {
        setClients(clientsData as Client[]);
      } else {
        console.error('Error fetching clients:', clientsError);
        setClients([]);
      }

      // Fetch Tasks with Client data joined
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, clients(id, name, logo_url)')
        .order('created_at', { ascending: false });

      if (tasksData && !tasksError) {
        setTasks(tasksData as Task[]);
      } else {
        console.error('Error fetching tasks:', tasksError);
        setTasks([]);
      }

      // Fetch Calendar Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*');
      
      if (eventsData && !eventsError) {
        setEvents(eventsData as CalendarEvent[]);
      } else {
        console.error('Error fetching events:', eventsError);
        setEvents([]);
      }

      // Fetch Notifications
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
  }, [isAuthenticated, currentUser?.id, refreshKey, initialLoadComplete]);

  return {
    tasks,
    events,
    allUsers,
    clients,
    notifications,
    workflow,
    settings,
    dataLoading: dataLoading || !initialLoadComplete,
    refetchData,
  };
};