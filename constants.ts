
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

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Q3 Social Media Strategy',
    description: 'Define key pillars and content buckets for Q3 campaigns.',
    stage: TaskStage.BRIEFING,
    priority: TaskPriority.HIGH,
    assigneeId: 'u2',
    dueDate: Date.now() + 86400000 * 2,
    client: 'TechCorp',
    tags: ['Strategy', 'Social'],
    subtasks: [
      { id: 'st1', title: 'Research competitors', completed: true },
      { id: 'st2', title: 'Draft content pillars', completed: false },
      { id: 'st3', title: 'Review with client', completed: false }
    ],
    attachments: [],
    comments: [],
    timeSpent: 120, // 2 hours
    accepted: false,
  },
  {
    id: 't2',
    title: 'Instagram Reels - Product Launch',
    description: 'Create 3 reels showcasing the new features.',
    stage: TaskStage.DESIGN,
    priority: TaskPriority.URGENT,
    assigneeId: 'u3',
    dueDate: Date.now() + 86400000 * 5,
    client: 'FashionNova',
    tags: ['Video', 'Instagram'],
    subtasks: [
      { id: 'st4', title: 'Write scripts', completed: true },
      { id: 'st5', title: 'Film raw footage', completed: true },
      { id: 'st6', title: 'Edit v1', completed: false }
    ],
    attachments: [
      {
        id: 'a1',
        name: 'draft_v1.mp4',
        type: 'video',
        url: '#',
        uploadedBy: 'u3',
        status: 'pending',
        source: 'local',
        category: 'deliverable'
      }
    ],
    comments: [],
    timeSpent: 240, // 4 hours
    accepted: true,
  },
  {
    id: 't3',
    title: 'Website Banner Update',
    description: 'Refresh homepage banners for summer sale.',
    stage: TaskStage.REVIEW,
    priority: TaskPriority.MEDIUM,
    assigneeId: 'u3',
    dueDate: Date.now() - 86400000,
    client: 'EcoStore',
    tags: ['Web', 'Design'],
    subtasks: [],
    attachments: [
      {
        id: 'a2',
        name: 'banner_hero.jpg',
        type: 'image',
        url: 'https://picsum.photos/800/400',
        uploadedBy: 'u3',
        status: 'pending',
        source: 'local',
        category: 'deliverable'
      }
    ],
    comments: [],
    timeSpent: 90, // 1.5 hours
    accepted: true,
  },
  {
    id: 't4',
    title: 'Email Newsletter Aug',
    description: 'Draft and design August newsletter.',
    stage: TaskStage.APPROVED,
    priority: TaskPriority.LOW,
    assigneeId: 'u2',
    dueDate: Date.now() + 86400000 * 10,
    client: 'TechCorp',
    tags: ['Email', 'Copy'],
    subtasks: [
      { id: 'st7', title: 'Write copy', completed: true },
      { id: 'st8', title: 'Design graphics', completed: true },
      { id: 'st9', title: 'Setup in Mailchimp', completed: true }
    ],
    attachments: [],
    comments: [],
    timeSpent: 60, // 1 hour
    accepted: true,
  },
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Client Kickoff',
    description: 'Initial requirements gathering with the TechCorp stakeholders.',
    start: new Date().setHours(10, 0, 0, 0),
    end: new Date().setHours(11, 30, 0, 0),
    type: 'meeting',
    platform: 'Google Meet',
    meetingLink: 'https://meet.google.com/abc-defg-hij'
  },
  {
    id: 'e2',
    title: 'Q3 Campaign Launch',
    description: 'Global launch event for the Q3 initiatives.',
    start: new Date().setHours(14, 0, 0, 0) + 86400000 * 2,
    end: new Date().setHours(15, 0, 0, 0) + 86400000 * 2,
    type: 'campaign',
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