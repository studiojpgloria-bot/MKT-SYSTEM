
import { Task, TaskPriority, TaskStage, User, UserRole, CalendarEvent, SystemSettings, Document, MindMapDocument } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'admin-01',
    name: 'JP Gloria (Admin)',
    role: UserRole.ADMIN,
    email: 'studiojpgloria@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=JP+Gloria&background=6366f1&color=fff',
    status: 'online',
    lastSeen: Date.now()
  }
];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_EVENTS: CalendarEvent[] = [];

export const INITIAL_SETTINGS: SystemSettings = {
    companyName: 'Nexus Marketing',
    companyLogo: '',
    themeColor: 'indigo',
    darkMode: true,
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
        title: 'Nexus Gestão',
        subtitle: 'Acesse o painel administrativo.',
        bannerUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1567&q=80'
    },
    workflowRules: {
        onAccept: 'design',
        onDeliverableUpload: 'review',
        onApprove: 'approved',
        onReject: 'changes'
    }
};

export const INITIAL_DOCUMENTS: Document[] = [];
