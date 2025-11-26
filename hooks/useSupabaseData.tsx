import { useState, useEffect, useRef } from 'react';
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
  const isInitialLoad = useRef(true);

  const refetchData = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setTasks([]);
      setEvents([]);
      setAllUsers([]);
      setClients([]);
      setNotifications([]);
      setDataLoading(false);
      return;
    }

    const fetchAllData = async () => {
      // Only show the full-page loader on the very first data fetch.
      // Subsequent refetches will happen in the background.
      if (isInitialLoad.current) {
        setDataLoading(true);
      }

      // Fetch App Settings & Workflow
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('workflow, system_settings')
        .eq('id', 1)
        .single();

      if (settingsData && !settingsError) {
        if (settingsData.system_settings) {
          setSettings(settingsData.system_settings as SystemSettings);
        }
        if (settingsData.workflow) {
          setWorkflow(settingsData.workflow as WorkflowStage[]);
        }
      } else {
        console.warn('Could not fetch app_settings. Using initial defaults.');
      }

      // Fetch All Users (Profiles)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url');
      
      let fetchedUsers: User[] = [];
      if (usersData && !usersError) {
        fetchedUsers = usersData.map(p => ({
            id: p.id,
            name: p.name || 'Unknown User',
            role: p.role as UserRole,
            avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.name?.replace(' ', '+') || 'User'}&background=random`,
            email: '', 
            status: 'offline', // Default status for fetched users, as real-time status is not in DB
            lastSeen: Date.now(),
        }));
      } else {
        console.error('Error fetching users from profiles table:', usersError);
      }

      // Ensure currentUser is always in the list and has its actual status
      const finalUsers = fetchedUsers.map(u => u.id === currentUser.id ? currentUser : u);
      // If currentUser was not in fetchedUsers (e.g., profiles table was empty), add them.
      if (!finalUsers.some(u => u.id === currentUser.id)) {
        finalUsers.push(currentUser);
      }
      setAllUsers(finalUsers);

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
      isInitialLoad.current = false;
    };

    fetchAllData();
  }, [isAuthenticated, currentUser?.id, refreshKey]);

  return {
    tasks,
    events,
    allUsers,
    clients,
    notifications,
    workflow,
    settings,
    dataLoading,
    refetchData,
  };
};