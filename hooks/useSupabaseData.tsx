import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Task, CalendarEvent, Notification, User, WorkflowStage, SystemSettings, UserRole, Client } from '../types';
import { useSupabaseAuth } from './useSupabaseAuth';
import { INITIAL_WORKFLOW, INITIAL_SETTINGS } from '../constants';

type DataType = 'tasks' | 'events' | 'users' | 'clients' | 'notifications' | 'settings' | 'all';

interface SupabaseData {
  tasks: Task[];
  events: CalendarEvent[];
  allUsers: User[];
  clients: Client[];
  notifications: Notification[];
  workflow: WorkflowStage[];
  settings: SystemSettings;
  dataLoading: boolean;
  refetchData: (type?: DataType) => void;
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

  const fetchData = useCallback(async (type: DataType = 'all') => {
    if (!isAuthenticated || !currentUser) {
      setDataLoading(false);
      return;
    }

    const fetchTasks = async () => {
      const { data, error } = await supabase.from('tasks').select('*, clients(id, name, logo_url)').order('created_at', { ascending: false });
      if (data && !error) setTasks(data as Task[]);
      else console.error('Error fetching tasks:', error);
    };

    const fetchEvents = async () => {
      const { data, error } = await supabase.from('calendar_events').select('*');
      if (data && !error) setEvents(data as CalendarEvent[]);
      else console.error('Error fetching events:', error);
    };

    const fetchUsers = async () => {
      const { data: usersData, error: usersError } = await supabase.from('profiles').select('id, name, role, avatar_url');
      if (usersData && !usersError) {
        const fetchedUsers = usersData.map(p => ({
          id: p.id, name: p.name || 'Unknown User', role: p.role as UserRole,
          avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.name?.replace(' ', '+') || 'User'}&background=random`,
          email: '', status: 'offline', lastSeen: Date.now(),
        }));
        const finalUsers = fetchedUsers.map(u => u.id === currentUser.id ? currentUser : u);
        if (!finalUsers.some(u => u.id === currentUser.id)) finalUsers.push(currentUser);
        setAllUsers(finalUsers);
      } else console.error('Error fetching users:', usersError);
    };

    const fetchClients = async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (data && !error) setClients(data as Client[]);
      else console.error('Error fetching clients:', error);
    };

    const fetchNotifications = async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (data && !error) setNotifications(data as Notification[]);
      else console.error('Error fetching notifications:', error);
    };

    const fetchSettings = async () => {
      const { data, error } = await supabase.from('app_settings').select('workflow, system_settings').eq('id', 1).single();
      if (data && !error) {
        if (data.system_settings) setSettings(data.system_settings as SystemSettings);
        if (data.workflow) setWorkflow(data.workflow as WorkflowStage[]);
      } else console.warn('Could not fetch app_settings. Using initial defaults.');
    };

    if (type === 'all') {
      setDataLoading(true);
      await Promise.all([fetchTasks(), fetchEvents(), fetchUsers(), fetchClients(), fetchNotifications(), fetchSettings()]);
      setDataLoading(false);
    } else {
      switch (type) {
        case 'tasks': await fetchTasks(); break;
        case 'events': await fetchEvents(); break;
        case 'users': await fetchUsers(); break;
        case 'clients': await fetchClients(); break;
        case 'notifications': await fetchNotifications(); break;
        case 'settings': await fetchSettings(); break;
      }
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchData('all');
    } else {
      // Clear data on logout
      setTasks([]);
      setEvents([]);
      setAllUsers([]);
      setClients([]);
      setNotifications([]);
      setDataLoading(false);
    }
  }, [isAuthenticated, currentUser, fetchData]);

  const refetchData = (type: DataType = 'all') => {
    fetchData(type);
  };

  return {
    tasks, events, allUsers, clients, notifications, workflow, settings, dataLoading, refetchData,
  };
};