import { Task, TaskPriority, TaskStage, User, UserRole, CalendarEvent, SystemSettings } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alice Admin',
    role: UserRole.ADMIN,
    email: 'alice@nexus.com',
    avatar: 'https://picsum.photos/id/64/100/100',
    status: 'online',
    lastSeen: Date.now()
  },
  {
    id: 'u2',
    name: 'Bob Manager',
    role: UserRole.MANAGER,
    email: 'bob@nexus.com',
    avatar: 'https://picsum.photos/id/65/100/100',
    status: 'paused',
    lastSeen: Date.now() - 1000 * 60 * 10
  },
  {
    id: 'u3',
    name: 'Charlie Creative',
    role: UserRole.MEMBER,
    email: 'charlie@nexus.com',
    avatar: 'https://picsum.photos/id/91/100/100',
    status: 'online',
    lastSeen: Date.now()
  },
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