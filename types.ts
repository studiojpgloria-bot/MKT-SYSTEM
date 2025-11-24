
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Legacy enum kept for initial state, but app will use dynamic stages
export enum TaskStage {
  BRIEFING = 'briefing',
  DESIGN = 'design',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
}

export interface WorkflowStage {
  id: string;
  name: string;
  color: string; // hex or tailwind color name
}

export interface SystemSettings {
  companyName: string;
  companyLogo: string; // URL
  themeColor: 'indigo' | 'emerald' | 'rose' | 'blue' | 'violet' | 'orange';
  darkMode: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: number; // minutes
  };
  loginScreen: {
    title: string;
    subtitle: string;
    bannerUrl: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  status: 'online' | 'paused' | 'offline';
  lastSeen: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  timestamp: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'video';
  source: 'local' | 'google_drive' | 'dropbox' | 'onedrive';
  category: 'reference' | 'deliverable';
  uploadedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string; // Reason for rejection or video timestamp notes
}

export interface Task {
  id: string;
  title: string;
  description: string;
  stage: string; // Changed from Enum to string to support dynamic stages
  priority: TaskPriority;
  assigneeId: string;
  dueDate: number;
  client: string;
  tags: string[];
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  timeSpent: number; // in minutes
  accepted: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: number;
  end: number;
  type: 'meeting' | 'deadline' | 'campaign';
  platform?: 'Google Meet' | 'Zoom' | 'Teams';
  meetingLink?: string;
  taskId?: string;
}

export interface DashboardMetrics {
  activeCampaigns: number;
  pendingTasks: number;
  approvalRate: number;
  completedThisMonth: number;
  avgProductionTime: number; // in minutes
}