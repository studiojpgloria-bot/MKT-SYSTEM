
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
  color: string;
}

export interface DeliveryType {
  id: string;
  name: string;
}

export interface WorkflowRules {
  onAccept: string;
  onDeliverableUpload: string;
  onApprove: string;
  onReject: string;
}

export interface SystemSettings {
  id?: string;
  companyName: string;
  companyLogo: string;
  themeColor: 'indigo' | 'emerald' | 'rose' | 'blue' | 'violet' | 'orange';
  darkMode: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: number;
  };
  loginScreen: {
    title: string;
    subtitle: string;
    bannerUrl: string;
  };
  workflowRules: WorkflowRules;
  deliveryTypes: DeliveryType[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  password?: string;
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
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  timestamp: number;
  resourceId?: string;
  resourceType?: 'task' | 'document';
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
  feedback?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  stage: string;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: number;
  client: string;
  projectType: string;
  estimatedHours: number;
  tags: string[];
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  timeSpent: number;
  accepted: boolean;
  finalLink?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: number;
  end: number;
  allDay?: boolean;
  recurring?: boolean;
  type: 'meeting' | 'deadline' | 'campaign';
  platform?: 'Google Meet' | 'Zoom' | 'Teams';
  meetingLink?: string;
  taskId?: string;
  attendeeIds?: string[];
  completed?: boolean;
  completedAt?: number;
}

export interface DashboardMetrics {
  activeCampaigns: number;
  pendingTasks: number;
  approvalRate: number;
  completedThisMonth: number;
  avgProductionTime: number;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'meeting' | 'project' | 'briefing' | 'general';
  tags: string[];
  createdAt: number;
  updatedAt: number;
  authorId: string;
  coverImage?: string;
  emoji?: string;
  linkedTaskId?: string;
  sharedWith?: string[];
}

export interface MindMapNode {
  id: string;
  type: 'node' | 'root' | 'note' | 'text' | 'shape' | 'sticker' | 'comment';
  label: string;
  x: number;
  y: number;
  parentId: string | null;
  color: string;
  image?: string;
  width?: number;
  height?: number;
  shapeType?: 'rectangle' | 'circle' | 'diamond' | 'triangle';
}

export interface MindMapDocument {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  nodes: MindMapNode[];
  thumbnailColor: string;
}
