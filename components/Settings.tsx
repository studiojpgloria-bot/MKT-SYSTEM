
import React, { useState, useRef } from 'react';
import { Save, User as UserIcon, Building, Palette, Shield, Plus, Trash2, GripVertical, Check, Layout, AlertTriangle, RefreshCw, Image as ImageIcon, ArrowRight, Upload, X, Key, Edit, Eye, EyeOff } from 'lucide-react';
import { SystemSettings, User, UserRole, WorkflowStage, Task } from '../types';

interface SettingsProps {
  settings: SystemSettings;
  users: User[];
  workflow: WorkflowStage[];
  tasks?: Task[];
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
  tasks = [],
  onUpdateSettings,
  onUpdateUsers,
  onUpdateWorkflow,
  onResetApp,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'workflow' | 'appearance' | 'security' | 'login'>('company');
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.MEMBER, password: '' });
  const [newStage, setNewStage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserPassword, setEditUserPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => onUpdateSettings(localSettings);

  const handleAddUser = () => {
    if (newUser.name && newUser.email && newUser.password) {
      const user: User = {
        id: `u${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password,
        avatar: `https://ui-avatars.com/api/?name=${newUser.name.replace(' ', '+')}&background=random`,
        status: 'offline',
        lastSeen: Date.now()
      };
      onUpdateUsers([...users, user]);
      setNewUser({ name: '', email: '', role: UserRole.MEMBER, password: '' });
      setShowNewPassword(false);
    }
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      const updatedUsers = users.map(u => 
        u.id === editingUser.id ? { ...editingUser, password: editUserPassword || u.password } : u
      );
      onUpdateUsers(updatedUsers);
      setEditingUser(null);
      setEditUserPassword('');
    }
  };

  const handleRemoveUser = (id: string) => {
    if (id === currentUser.id) {
        alert("Você não pode remover a si mesmo do sistema.");
        return;
    }
    if (confirm("Deseja realmente remover este membro da equipe?")) {
        onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleAddStage = () => {
    if (newStage) {
      const stage: WorkflowStage = { id: newStage.toLowerCase().replace(/\s+/g, '_'), name: newStage, color: 'indigo' };
      onUpdateWorkflow([...workflow, stage]);
      setNewStage('');
    }
  };

  const handleRemoveStage = (id: string) => {
    if (workflow.length <= 3) return alert('Mínimo de 3 etapas necessário.');
    onUpdateWorkflow(workflow.filter(s => s.id !== id));
  };

  const handleStageNameChange = (id: string, newName: string) => {
      onUpdateWorkflow(workflow.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setLocalSettings({ ...localSettings, companyLogo: url });
      };
      reader.readAsDataURL(file);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        activeTab === id ? `bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300` : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex h-[calc(100vh-8rem)] min-h-[600px]">
      <div className="w-64 bg-gray-50 dark:bg-slate-950 p-6 border-r border-gray-200 dark:border-slate-800 flex-shrink-0 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Configurações</h2>
        <nav className="space-y-1">
          <TabButton id="company" label="Empresa e Perfil" icon={Building} />
          <TabButton id="team" label="Gestão da Equipe" icon={UserIcon} />
          <TabButton id="workflow" label="Config. Workflow" icon={Layout} />
          <TabButton id="appearance" label="Aparência" icon={Palette} />
          <TabButton id="login" label="Tela de Login" icon={ImageIcon} />
          <TabButton id="security" label="Segurança e Dados" icon={Shield} />
        </nav>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-8">
          {activeTab === 'company' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">Informações da Empresa</h3>
              <div className="grid grid-cols-1 gap-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nome da Empresa</label>
                  <input type="text" value={localSettings.companyName} onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})} className="w-full p-2 border border-gray-300 bg-white text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Logotipo da Empresa</label>
                   <div className="flex gap-4 items-center mt-2">
                      <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          {localSettings.companyLogo ? (
                              <img src={localSettings.companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                          ) : (
                              <Building size={32} className="text-gray-400" />
                          )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input 
                          type="file" 
                          ref={logoInputRef}
                          className="hidden" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                        <button 
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Upload size={16} /> Fazer Upload
                        </button>
                        {localSettings.companyLogo && (
                          <button 
                            onClick={() => setLocalSettings({...localSettings, companyLogo: ''})}
                            className="w-full py-2 px-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:text-red-500 transition-all flex items-center justify-center gap-2"
                          >
                            <X size={16} /> Remover Logo
                          </button>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Etapas do Kanban</h3>
                   <div className="space-y-3 max-w-2xl">
                       {workflow.map((stage, index) => (
                           <div key={stage.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg group">
                               <GripVertical size={16} className="text-gray-400" />
                               <input type="text" value={stage.name} onChange={(e) => handleStageNameChange(stage.id, e.target.value)} className="flex-1 bg-transparent font-medium dark:text-white outline-none" />
                               <button onClick={() => handleRemoveStage(stage.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                           </div>
                       ))}
                       <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg mt-4">
                           <input type="text" value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder="Nova etapa..." className="flex-1 bg-transparent text-sm dark:text-white outline-none" />
                           <button onClick={handleAddStage} className="text-sm font-bold text-indigo-600">Adicionar</button>
                       </div>
                   </div>
                </div>

                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Regras de Automação</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                       {[
                         { label: 'Ao Aceitar Tarefa', key: 'onAccept' },
                         { label: 'Ao Enviar Entregável', key: 'onDeliverableUpload' },
                         { label: 'Ao Aprovar', key: 'onApprove' },
                         { label: 'Ao Rejeitar', key: 'onReject' }
                       ].map(rule => (
                        <div key={rule.key} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{rule.label}</label>
                            <select 
                                value={localSettings.workflowRules[rule.key as keyof typeof localSettings.workflowRules] || ''}
                                onChange={(e) => setLocalSettings({...localSettings, workflowRules: {...localSettings.workflowRules, [rule.key]: e.target.value}})}
                                className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                {workflow.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                       ))}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'team' && (
              <div className="space-y-6">
                  <h3 className="text-lg font-bold dark:text-white">Equipe</h3>
                  <div className="bg-[#151a21] p-6 rounded-2xl border border-[#2a303c] space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="p-3 bg-[#0b0e11] border border-[#2a303c] rounded-xl text-sm" />
                          <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="p-3 bg-[#0b0e11] border border-[#2a303c] rounded-xl text-sm" />
                          <input type="password" placeholder="Senha" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="p-3 bg-[#0b0e11] border border-[#2a303c] rounded-xl text-sm" />
                          <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="p-3 bg-[#0b0e11] border border-[#2a303c] rounded-xl text-sm">
                              {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                      </div>
                      <button onClick={handleAddUser} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Adicionar Membro</button>
                  </div>
                  <div className="space-y-2">
                      {users.map(u => (
                          <div key={u.id} className="flex items-center justify-between p-4 bg-[#151a21] rounded-xl border border-[#2a303c]">
                              <div className="flex items-center gap-3">
                                  <img src={u.avatar} className="w-10 h-10 rounded-full" />
                                  <div><p className="font-bold text-white text-sm">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                              </div>
                              <button onClick={() => handleRemoveUser(u.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">Segurança e Dados</h3>
                
                <div className="space-y-6 max-w-xl">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Shield size={18} className="text-gray-700 dark:text-slate-300" />
                                <span className="font-bold text-gray-900 dark:text-white">Autenticação de Dois Fatores</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Exigir verificação de código por email no login</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                              type="checkbox" 
                              checked={localSettings?.security?.twoFactor || false}
                              onChange={(e) => setLocalSettings({
                                  ...localSettings, 
                                  security: {...localSettings.security, twoFactor: e.target.checked}
                              })}
                              className="sr-only peer" 
                          />
                          <div className={`w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600`}></div>
                        </label>
                    </div>

                    <div className="mt-8 pt-6 border-t border-red-100 dark:border-red-900/30">
                        <h4 className="text-red-600 font-bold flex items-center gap-2 mb-4">
                           <AlertTriangle size={18} /> Zona de Perigo
                        </h4>
                        <div className="flex flex-col gap-4 p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                           <div>
                               <span className="font-bold text-gray-900 dark:text-white block">Resetar e Inicializar Banco (Admin)</span>
                               <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                   Esta ação apagará permanentemente todos os dados atuais do Supabase e restaurará as configurações e usuários padrão de fábrica. Use com extrema cautela.
                               </p>
                           </div>
                           <button 
                               onClick={() => {
                                   if(confirm('CUIDADO: Isso apagará TODOS os seus dados atuais no banco de dados e restaurará o estado inicial. Deseja prosseguir?')) {
                                       onResetApp();
                                   }
                               }}
                               className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                           >
                               <RefreshCw size={18} /> Resetar e Inicializar Banco (Admin)
                           </button>
                        </div>
                    </div>
                </div>
             </div>
          )}
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-end shrink-0">
          <button onClick={handleSaveSettings} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md"><Save size={18} /> Salvar Alterações</button>
      </div>
    </div>
  );
};
