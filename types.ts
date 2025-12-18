
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

export interface WorkflowRules {
  onAccept: string;         // Stage to move to when task is accepted
  onDeliverableUpload: string; // Stage to move to when deliverable is uploaded (Review/Lock state)
  onApprove: string;        // Stage to move to when approved
  onReject: string;         // Stage to move to when rejected
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
  workflowRules: WorkflowRules;
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
  userId: string; // Recipient ID
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  read: boolean;
  timestamp: number;
  resourceId?: string; // ID of the task or document
  resourceType?: 'task' | 'document'; // Type of resource to open
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

export interface Document {
  id: string;
  title: string;
  content: string; // HTML Content
  type: 'meeting' | 'project' | 'briefing' | 'general';
  tags: string[];
  createdAt: number;
  updatedAt: number;
  authorId: string;
  coverImage?: string;
  emoji?: string;
  linkedTaskId?: string;
  sharedWith?: string[]; // Array of User IDs allowed to view/edit
}

export interface MindMapNode {
  id: string;
  type: 'node' | 'root' | 'note' | 'text' | 'shape' | 'sticker' | 'comment';
  label: string; // Text content or emoji char
  x: number;
  y: number;
  parentId: string | null;
  color: string;
  image?: string;
  width?: number;
  height?: number;
  shapeType?: 'rectangle' | 'circle' | 'diamond' | 'triangle'; // For type: 'shape'
}

export interface MindMapDocument {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  nodes: MindMapNode[];
  thumbnailColor: string; // For the card UI
}
