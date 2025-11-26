import React, { useState, useRef } from 'react';
import { Save, User as UserIcon, Building, Palette, Shield, Bell, Plus, Trash2, GripVertical, Check, Layout, AlertTriangle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { SystemSettings, User, UserRole, WorkflowStage } from '../types';
import { InviteMemberModal } from './InviteMemberModal';

interface SettingsProps {
  settings: SystemSettings;
  users: User[];
  workflow: WorkflowStage[];
  onSave: (settings: SystemSettings, workflow: WorkflowStage[]) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onResetApp: () => void;
  currentUser: User;
  onInviteNewMember: (email: string, password: string, name: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  users,
  workflow,
  onSave,
  onUpdateUserRole,
  onResetApp,
  currentUser,
  onInviteNewMember
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'workflow' | 'appearance' | 'security' | 'login'>('company');
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [localWorkflow, setLocalWorkflow] = useState(workflow);
  const [newStage, setNewStage] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const handleSave = () => {
    onSave(localSettings, localWorkflow);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    onUpdateUserRole(userId, newRole);
  };

  const handleAddStage = () => {
    if (newStage) {
      const stage: WorkflowStage = {
        id: newStage.toLowerCase().replace(/\s+/g, '_'),
        name: newStage,
        color: 'indigo'
      };
      setLocalWorkflow([...localWorkflow, stage]);
      setNewStage('');
    }
  };

  const handleRemoveStage = (id: string) => {
    if (localWorkflow.length <= 3) {
      alert('You must have at least 3 stages in the workflow.');
      return;
    }
    if (confirm('Deleting a stage will affect tasks currently in this stage. Continue?')) {
      setLocalWorkflow(localWorkflow.filter(s => s.id !== id));
    }
  };

  const colors = [
    { name: 'indigo', hex: 'bg-indigo-600' },
    { name: 'emerald', hex: 'bg-emerald-600' },
    { name: 'rose', hex: 'bg-rose-600' },
    { name: 'blue', hex: 'bg-blue-600' },
    { name: 'violet', hex: 'bg-violet-600' },
    { name: 'orange', hex: 'bg-orange-600' },
  ];

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id 
          ? `bg-${localSettings.themeColor}-50 text-${localSettings.themeColor}-700` 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Company Information</h3>
            <div className="grid grid-cols-1 gap-6 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={localSettings.companyName} onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo URL</label>
                 <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                        {localSettings.companyLogo ? <img src={localSettings.companyLogo} alt="Logo" className="w-full h-full object-contain" /> : <Building size={20} className="text-gray-400" />}
                    </div>
                    <input type="text" value={localSettings.companyLogo} onChange={(e) => setLocalSettings({...localSettings, companyLogo: e.target.value})} placeholder="https://..." className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
              </div>
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-6 gap-4">
               <h3 className="text-lg font-bold text-gray-900">Team Management</h3>
               {currentUser.role === UserRole.ADMIN && (
                   <button onClick={() => setIsInviteModalOpen(true)} className={`flex items-center gap-2 px-4 py-2 bg-${localSettings.themeColor}-600 text-white rounded-lg text-sm font-medium hover:bg-${localSettings.themeColor}-700 transition-colors shadow-sm`}>
                       <Plus size={16} /> Convidar Membro
                   </button>
               )}
            </div>
            <div className="space-y-3">
               {users.map(user => (
                   <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow gap-4">
                       <div className="flex items-center gap-3">
                           <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                           <div>
                               <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                               <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                           </div>
                       </div>
                       <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)} disabled={user.id === currentUser.id || currentUser.role !== UserRole.ADMIN} className="text-xs font-bold p-2 rounded-lg bg-gray-100 text-gray-600 border-transparent focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto">
                           {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                       </select>
                   </div>
               ))}
            </div>
          </div>
        );
      case 'workflow':
        return (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900">Kanban Workflow</h3>
              <p className="text-sm text-gray-500">Customize the stages of your production pipeline.</p>
            </div>
            <div className="space-y-3 max-w-2xl">
                {localWorkflow.map((stage, index) => (
                    <div key={stage.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg group">
                        <div className="text-gray-400 cursor-grab"><GripVertical size={16} /></div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500">{index + 1}</div>
                        <input type="text" value={stage.name} readOnly className="flex-1 font-medium text-gray-800 focus:outline-none bg-transparent" />
                        <button onClick={() => handleRemoveStage(stage.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                ))}
                <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-lg mt-4">
                    <div className="w-8 h-8"></div>
                    <input type="text" value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder="Enter new stage name..." className="flex-1 bg-transparent focus:outline-none text-sm" onKeyDown={(e) => e.key === 'Enter' && handleAddStage()} />
                    <button onClick={handleAddStage} className={`text-sm font-medium text-${localSettings.themeColor}-600 hover:text-${localSettings.themeColor}-800`}>Add Stage</button>
                </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">System Appearance</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Accent Color</label>
                <div className="flex flex-wrap gap-4">
                    {colors.map(color => (
                        <button key={color.name} onClick={() => setLocalSettings({...localSettings, themeColor: color.name as any})} className={`w-16 h-16 rounded-xl ${color.hex} flex items-center justify-center transition-transform hover:scale-105 ${localSettings.themeColor === color.name ? 'ring-4 ring-offset-2 ring-gray-200 scale-105' : ''}`}>
                            {localSettings.themeColor === color.name && <Check className="text-white" />}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        );
      case 'login':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Login Screen Customization</h3>
            <div className="grid grid-cols-1 gap-6 max-w-xl">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Title</label>
                    <input type="text" value={localSettings.loginScreen.title} onChange={(e) => setLocalSettings({...localSettings, loginScreen: { ...localSettings.loginScreen, title: e.target.value }})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input type="text" value={localSettings.loginScreen.subtitle} onChange={(e) => setLocalSettings({...localSettings, loginScreen: { ...localSettings.loginScreen, subtitle: e.target.value }})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                    <input type="text" value={localSettings.loginScreen.bannerUrl} onChange={(e) => setLocalSettings({...localSettings, loginScreen: { ...localSettings.loginScreen, bannerUrl: e.target.value }})} placeholder="https://..." className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Security & Data</h3>
            <div className="mt-8 pt-6 border-t border-red-100">
                 <h4 className="text-red-600 font-bold flex items-center gap-2 mb-4"><AlertTriangle size={18} /> Danger Zone</h4>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 gap-4">
                    <div>
                        <span className="font-bold text-gray-900 block">Reset Application Data</span>
                        <p className="text-sm text-gray-500">Clear all tasks, users, and events to initial state.</p>
                    </div>
                    <button onClick={() => { if(confirm('Are you sure? This will wipe all your changes.')) onResetApp(); }} className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 flex-shrink-0">
                        <RefreshCw size={14} /> Reset Data
                    </button>
                </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col lg:flex-row h-full">
      <div className="w-full lg:w-64 bg-gray-50 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Settings</h2>
        <nav className="space-y-1">
          <TabButton id="company" label="Company" icon={Building} />
          <TabButton id="team" label="Team" icon={UserIcon} />
          <TabButton id="workflow" label="Workflow" icon={Layout} />
          <TabButton id="appearance" label="Appearance" icon={Palette} />
          <TabButton id="login" label="Login Screen" icon={ImageIcon} />
          <TabButton id="security" label="Security" icon={Shield} />
        </nav>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {renderContent()}
        </div>
        <div className="p-6 bg-white border-t border-gray-200 flex justify-end z-10">
            <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-2 bg-${localSettings.themeColor}-600 text-white rounded-lg font-bold shadow-md hover:bg-${localSettings.themeColor}-700 transition-colors`}>
                <Save size={18} />
                Save Changes
            </button>
        </div>
      </div>

      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={onInviteNewMember}
        themeColor={localSettings.themeColor}
      />
    </div>
  );
};