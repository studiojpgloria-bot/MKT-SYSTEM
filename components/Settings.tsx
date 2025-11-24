
import React, { useState, useRef } from 'react';
import { Save, User as UserIcon, Building, Palette, Shield, Bell, Plus, Trash2, GripVertical, Check, Layout, AlertTriangle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { SystemSettings, User, UserRole, WorkflowStage } from '../types';

interface SettingsProps {
  settings: SystemSettings;
  users: User[];
  workflow: WorkflowStage[];
  onUpdateSettings: (settings: SystemSettings) => void;
  onUpdateUsers: (users: User[]) => void;
  onUpdateWorkflow: (workflow: WorkflowStage[]) => void;
  onResetApp: () => void;
  currentUser: User;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  users,
  workflow,
  onUpdateSettings,
  onUpdateUsers,
  onUpdateWorkflow,
  onResetApp,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'workflow' | 'appearance' | 'security' | 'login'>('company');
  
  // Local state for forms
  const [localSettings, setLocalSettings] = useState(settings);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.MEMBER });
  const [newStage, setNewStage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    // Simulate toast notification here in parent
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const user: User = {
        id: `u${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: `https://ui-avatars.com/api/?name=${newUser.name.replace(' ', '+')}&background=random`,
        status: 'offline',
        lastSeen: Date.now()
      };
      onUpdateUsers([...users, user]);
      setNewUser({ name: '', email: '', role: UserRole.MEMBER });
    }
  };

  const handleRemoveUser = (id: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const mockUrl = URL.createObjectURL(e.target.files[0]);
      const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, avatar: mockUrl } : u);
      onUpdateUsers(updatedUsers);
    }
  };

  const handleAddStage = () => {
    if (newStage) {
      const stage: WorkflowStage = {
        id: newStage.toLowerCase().replace(/\s+/g, '_'),
        name: newStage,
        color: 'indigo'
      };
      onUpdateWorkflow([...workflow, stage]);
      setNewStage('');
    }
  };

  const handleRemoveStage = (id: string) => {
    if (workflow.length <= 3) {
      alert('You must have at least 3 stages in the workflow.');
      return;
    }
    if (confirm('Deleting a stage will affect tasks currently in this stage. Continue?')) {
      onUpdateWorkflow(workflow.filter(s => s.id !== id));
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
          ? `bg-${localSettings.themeColor}-50 dark:bg-${localSettings.themeColor}-900/30 text-${localSettings.themeColor}-700 dark:text-${localSettings.themeColor}-300` 
          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex h-[calc(100vh-8rem)] min-h-[600px]">
      
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-slate-950 p-6 border-r border-gray-200 dark:border-slate-800 flex-shrink-0 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Settings</h2>
        <nav className="space-y-1">
          <TabButton id="company" label="Company & Profile" icon={Building} />
          <TabButton id="team" label="Team Management" icon={UserIcon} />
          <TabButton id="workflow" label="Workflow Setup" icon={Layout} />
          <TabButton id="appearance" label="Appearance" icon={Palette} />
          <TabButton id="login" label="Login Screen" icon={ImageIcon} />
          <TabButton id="security" label="Security & Data" icon={Shield} />
        </nav>
      </div>

      {/* Right Content Wrapper (Flex Column) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          
          {/* COMPANY TAB */}
          {activeTab === 'company' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">Company Information</h3>
              
              <div className="grid grid-cols-1 gap-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Company Name</label>
                  <input 
                    type="text" 
                    value={localSettings.companyName}
                    onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Company Logo URL</label>
                   <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                          {localSettings.companyLogo ? (
                              <img src={localSettings.companyLogo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                              <Building size={20} className="text-gray-400" />
                          )}
                      </div>
                      <input 
                        type="text" 
                        value={localSettings.companyLogo}
                        onChange={(e) => setLocalSettings({...localSettings, companyLogo: e.target.value})}
                        placeholder="https://..."
                        className="flex-1 p-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                   </div>
                </div>

                <div className="pt-4">
                   <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Admin Profile</label>
                   <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                      <img src={currentUser.avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                      <div>
                          <p className="font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{currentUser.email}</p>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
                          >
                            Change Photo
                          </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Management</h3>
                  <span className="text-sm text-gray-500 dark:text-slate-400">{users.length} active members</span>
               </div>

               {/* Add User */}
               <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700 mb-6">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Add New Member</h4>
                  <div className="flex gap-3 items-end">
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Full Name</label>
                          <input 
                              type="text" 
                              value={newUser.name}
                              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                              className="w-full p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                              placeholder="e.g. John Doe"
                          />
                      </div>
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Email Address</label>
                          <input 
                              type="email" 
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              className="w-full p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                              placeholder="john@company.com"
                          />
                      </div>
                      <div className="w-40">
                          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Role</label>
                          <select 
                               value={newUser.role}
                               onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                               className="w-full p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                          >
                              {Object.values(UserRole).map(role => (
                                  <option key={role} value={role}>{role}</option>
                              ))}
                          </select>
                      </div>
                      <button 
                          onClick={handleAddUser}
                          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors bg-${localSettings.themeColor}-600 hover:bg-${localSettings.themeColor}-700`}
                      >
                          <Plus size={18} />
                      </button>
                  </div>
               </div>

               {/* User List */}
               <div className="space-y-3">
                  {users.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3">
                              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white text-sm">{user.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">{user.email}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300`}>
                                  {user.role}
                              </span>
                              {user.id !== currentUser.id && (
                                  <button 
                                      onClick={() => handleRemoveUser(user.id)}
                                      className="text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
               </div>
             </div>
          )}

          {/* WORKFLOW TAB */}
          {activeTab === 'workflow' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kanban Workflow</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Customize the stages of your production pipeline.</p>
               </div>

               <div className="space-y-3 max-w-2xl">
                   {workflow.map((stage, index) => (
                       <div key={stage.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg group">
                           <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                               <GripVertical size={16} />
                           </div>
                           <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-300">
                               {index + 1}
                           </div>
                           <div className="flex-1">
                               <input 
                                  type="text" 
                                  value={stage.name}
                                  readOnly
                                  className="w-full font-medium text-gray-800 dark:text-white focus:outline-none bg-transparent"
                               />
                           </div>
                           <button 
                              onClick={() => handleRemoveStage(stage.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
                           >
                               <Trash2 size={16} />
                           </button>
                       </div>
                   ))}

                   {/* Add Stage */}
                   <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg mt-4">
                       <div className="w-8 h-8"></div>
                       <input 
                          type="text"
                          value={newStage}
                          onChange={(e) => setNewStage(e.target.value)}
                          placeholder="Enter new stage name..."
                          className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                       />
                       <button 
                          onClick={handleAddStage}
                          className={`text-sm font-medium text-${localSettings.themeColor}-600 hover:text-${localSettings.themeColor}-800`}
                       >
                           Add Stage
                       </button>
                   </div>
               </div>
             </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">System Appearance</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">Accent Color</label>
                    <div className="flex flex-wrap gap-4">
                        {colors.map(color => (
                            <button
                               key={color.name}
                               onClick={() => setLocalSettings({...localSettings, themeColor: color.name as any})}
                               className={`w-16 h-16 rounded-xl ${color.hex} flex items-center justify-center transition-transform hover:scale-105 ${
                                   localSettings.themeColor === color.name ? 'ring-4 ring-offset-2 ring-gray-200 dark:ring-slate-700 scale-105' : ''
                               }`}
                            >
                                {localSettings.themeColor === color.name && <Check className="text-white" />}
                            </button>
                        ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">This color will be applied to buttons, active states, charts, and highlights throughout the system.</p>
                </div>
             </div>
          )}

          {/* LOGIN SCREEN TAB */}
          {activeTab === 'login' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">Login Screen Customization</h3>
                
                <div className="grid grid-cols-1 gap-6 max-w-xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Welcome Title</label>
                        <input 
                            type="text" 
                            value={localSettings.loginScreen.title}
                            onChange={(e) => setLocalSettings({
                                ...localSettings, 
                                loginScreen: { ...localSettings.loginScreen, title: e.target.value }
                            })}
                            className="w-full p-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subtitle / Message</label>
                        <input 
                            type="text" 
                            value={localSettings.loginScreen.subtitle}
                            onChange={(e) => setLocalSettings({
                                ...localSettings, 
                                loginScreen: { ...localSettings.loginScreen, subtitle: e.target.value }
                            })}
                            className="w-full p-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Side Banner Image URL</label>
                        <input 
                            type="text" 
                            value={localSettings.loginScreen.bannerUrl}
                            onChange={(e) => setLocalSettings({
                                ...localSettings, 
                                loginScreen: { ...localSettings.loginScreen, bannerUrl: e.target.value }
                            })}
                            placeholder="https://..."
                            className="w-full p-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Leave empty to use default theme color background.</p>
                    </div>
                    
                    {/* Preview */}
                    {localSettings.loginScreen.bannerUrl && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Banner Preview</label>
                            <div className="h-32 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100">
                                <img src={localSettings.loginScreen.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                </div>
             </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">Security & Data</h3>
                
                <div className="space-y-6 max-w-xl">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Shield size={18} className="text-gray-700 dark:text-slate-300" />
                                <span className="font-bold text-gray-900 dark:text-white">Two-Factor Authentication</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Require email code verification on login</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                              type="checkbox" 
                              checked={localSettings.security.twoFactor}
                              onChange={(e) => setLocalSettings({
                                  ...localSettings, 
                                  security: {...localSettings.security, twoFactor: e.target.checked}
                              })}
                              className="sr-only peer" 
                          />
                          <div className={`w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${localSettings.themeColor}-600`}></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Bell size={18} className="text-gray-700 dark:text-slate-300" />
                                <span className="font-bold text-gray-900 dark:text-white">Email Notifications</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Receive updates on tasks and approvals</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                              type="checkbox" 
                              checked={localSettings.notifications.email}
                              onChange={(e) => setLocalSettings({
                                  ...localSettings, 
                                  notifications: {...localSettings.notifications, email: e.target.checked}
                              })}
                              className="sr-only peer" 
                          />
                          <div className={`w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${localSettings.themeColor}-600`}></div>
                        </label>
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-8 pt-6 border-t border-red-100 dark:border-red-900/30">
                         <h4 className="text-red-600 font-bold flex items-center gap-2 mb-4">
                            <AlertTriangle size={18} /> Danger Zone
                         </h4>
                         <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white block">Reset Application Data</span>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Clear all tasks, users, and events to initial state.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    if(confirm('Are you sure? This will wipe all your changes and restore default demo data.')) {
                                        onResetApp();
                                    }
                                }}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={14} /> Reset Data
                            </button>
                        </div>
                    </div>
                </div>
             </div>
          )}
        </div>

        {/* Footer Actions (Sticky to bottom of container) */}
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-end z-10">
            <button 
              onClick={handleSaveSettings}
              className={`flex items-center gap-2 px-6 py-2 bg-${localSettings.themeColor}-600 text-white rounded-lg font-bold shadow-md hover:bg-${localSettings.themeColor}-700 transition-colors`}
            >
                <Save size={18} />
                Save Changes
            </button>
        </div>

      </div>
    </div>
  );
};