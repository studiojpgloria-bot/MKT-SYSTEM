import { Task, TaskPriority, TaskStage, User, UserRole, CalendarEvent, SystemSettings, WorkflowStage } from './types';

// Initial Workflow
export const INITIAL_WORKFLOW: WorkflowStage[] = [
  { id: 'briefing', name: 'Briefing', color: 'indigo' },
  { id: 'design', name: 'Design', color: 'indigo' },
  { id: 'review', name: 'Review', color: 'indigo' },
  { id: 'approved', name: 'Approved', color: 'indigo' },
  { id: 'published', name: 'Published', color: 'indigo' }
];

export const INITIAL_SETTINGS: SystemSettings = {
    companyName: 'Nexus Marketing',
    companyLogo: '',
    themeColor: 'indigo',
    darkMode: false,
    notifications: {
        email: true,
        push: true,
        desktop: true
    },
    security: {
        twoFactor: false,
        sessionTimeout: 60
    },
    loginScreen: {
        title: 'Welcome back',
        subtitle: 'Please enter your details to sign in to Nexus CRM.',
        bannerUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1567&q=80'
    }
};

// Empty arrays for data now managed by Supabase
export const MOCK_USERS: User[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_EVENTS: CalendarEvent[] = [];