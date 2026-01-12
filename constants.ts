
import { Task, TaskPriority, TaskStage, User, UserRole, CalendarEvent, SystemSettings, Document, MindMapDocument } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'admin-01',
    name: 'JP Gloria (Admin)',
    role: UserRole.ADMIN,
    email: 'studiojpgloria@gmail.com',
    password: 'password',
    avatar: 'https://ui-avatars.com/api/?name=JP+Gloria&background=7c3aed&color=fff',
    status: 'online',
    lastSeen: Date.now()
  }
];

export const INITIAL_TASKS: Task[] = [];
export const INITIAL_EVENTS: CalendarEvent[] = [];
export const INITIAL_DOCUMENTS: Document[] = [];

export const INITIAL_SETTINGS: SystemSettings = {
    id: 'global-config',
    companyName: 'MZ MARKETING',
    companyLogo: '', // Agora definido via upload nas configurações
    themeColor: 'violet',
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
        title: 'MZ MARKETING',
        subtitle: 'Acesse o painel',
        bannerUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    },
    workflowRules: {
        onAccept: 'design',
        onDeliverableUpload: 'review',
        onApprove: 'approved',
        onReject: 'changes'
    },
    deliveryTypes: [
      { id: 'social-media', name: 'Social Media' },
      { id: 'video', name: 'Edição de Vídeo' },
      { id: 'design', name: 'Design Gráfico' },
      { id: 'ads', name: 'Tráfego Pago' },
      { id: 'copy', name: 'Copywriting' }
    ]
};
