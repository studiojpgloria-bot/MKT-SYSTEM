import React, { useState, useRef } from 'react';
import { Save, User as UserIcon, Building, Palette, Shield, Bell, Plus, Trash2, GripVertical, Check, Layout, AlertTriangle, RefreshCw, Image as ImageIcon, ArrowRight, Upload, X } from 'lucide-react';
import { SystemSettings, User, UserRole, WorkflowStage, WorkflowRules, Task } from '../types';

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
  
  // Local state for forms
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.MEMBER });
  const [newStage, setNewStage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
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
    if (confirm('Tem certeza de que deseja remover este usuário?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, avatar: url } : u);
        onUpdateUsers(updatedUsers);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        alert('Por favor, envie apenas arquivos PNG ou JPG.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setLocalSettings({ ...localSettings, companyLogo: url });
      };
      reader.readAsDataURL(file);
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
      alert('Você deve ter pelo menos 3 etapas no fluxo de trabalho.');
      return;
    }
    const rules = localSettings.workflowRules;
    if (rules && Object.values(rules).includes(id)) {
        alert('Não é possível remover uma etapa que está sendo usada em Regras de Automação. Por favor, altere a regra primeiro.');
        return;
    }

    const hasTasks = tasks.some(t => t.stage === id);
    if (hasTasks) {
       if (window.confirm('Esta etapa contém tarefas ativas. Excluí-la pode afetar a visibilidade dessas tarefas. Deseja continuar?')) {
          onUpdateWorkflow(workflow.filter(s => s.id !== id));
       }
    } else {
       onUpdateWorkflow(workflow.filter(s => s.id !== id));
    }
  };

  const handleStageNameChange = (id: string, newName: string) => {
      const updated = workflow.map(s => s.id === id ? { ...s, name: newName } : s);
      onUpdateWorkflow(updated);
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
          ? `bg-${localSettings.themeColor || 'indigo'}-50 dark:bg-${localSettings.themeColor || 'indigo'}-900/30 text-${localSettings.themeColor || 'indigo'}-700 dark:text-${localSettings.themeColor || 'indigo'}-300` 
          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} />
      {label}
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

      <div className="flex-1 flex flex-col min-w-0">
        
        <div className="flex-1 p-8 overflow-y-auto">
          
          {activeTab === 'company' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">Informações da Empresa</h3>
              
              <div className="grid grid-cols-1 gap-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nome da Empresa</label>
                  <input 
                    type="text" 
                    value={localSettings.companyName}
                    onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})}
                    className="w-full p-2 border border-gray-300 bg-white text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Logo da Empresa (PNG/JPG 1000x1000)</label>
                   <div className="flex gap-4 items-center">
                      <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          {localSettings.companyLogo ? (
                              <img src={localSettings.companyLogo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                              <Building size={32} className="text-gray-400" />
                          )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input 
                          type="file" 
                          ref={logoInputRef}
                          className="hidden" 
                          accept="image/png, image/jpeg, image/jpg"
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

                <div className="pt-4">
                   <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Perfil do Administrador</label>
                   <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                      <img src={currentUser?.avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover shrink-0" />
                      <div>
                          <p className="font-bold text-gray-900 dark:text-white">{currentUser?.name}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{currentUser?.email}</p>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
                          >
                            Alterar Foto
                          </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gestão da Equipe</h3>
                  <span className="text-sm text-gray-500 dark:text-slate-400">{users.length} membros ativos</span>
               </div>

               <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700 mb-6">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">Adicionar Novo Membro</h4>
                  <div className="flex gap-3 items-end">
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Nome Completo</label>
                          <input 
                              type="text" 
                              value={newUser.name}
                              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                              className="w-full p-2 border border-gray-300 bg-white text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                              placeholder="ex: João Silva"
                          />
                      </div>
                      <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Endereço de Email</label>
                          <input 
                              type="email" 
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              className="w-full p-2 border border-gray-300 bg-white text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                              placeholder="joao@empresa.com"
                          />
                      </div>
                      <div className="w-40">
                          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">Função</label>
                          <select 
                               value={newUser.role}
                               onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                               className="w-full p-2 border border-gray-300 bg-white text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                          >
                              {Object.values(UserRole).map(role => (
                                  <option key={role} value={role}>{role}</option>
                              ))}
                          </select>
                      </div>
                      <button 
                          onClick={handleAddUser}
                          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors bg-${localSettings.themeColor || 'indigo'}-600 hover:bg-${localSettings.themeColor || 'indigo'}-700`}
                      >
                          <Plus size={18} />
                      </button>
                  </div>
               </div>

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

          {activeTab === 'workflow' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                   <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fluxo de Trabalho Kanban</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Renomeie, adicione ou remova etapas do seu pipeline de produção.</p>
                   </div>

                   <div className="space-y-3 max-w-2xl">
                       {workflow.map((stage, index) => (
                           <div key={stage.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg group hover:border-indigo-500/30 transition-colors">
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
                                      onChange={(e) => handleStageNameChange(stage.id, e.target.value)}
                                      className="w-full font-medium text-gray-800 dark:text-white focus:outline-none bg-transparent border-b border-transparent focus:border-indigo-500 py-1"
                                      placeholder="Nome da Etapa"
                                   />
                               </div>
                               <button 
                                  type="button"
                                  onClick={() => handleRemoveStage(stage.id)}
                                  className="text-gray-400 hover:text-red-600 transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                                  title="Excluir Etapa"
                               >
                                   <Trash2 size={16} />
                               </button>
                           </div>
                       ))}

                       <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg mt-4 hover:border-indigo-500/50 transition-colors">
                           <div className="w-8 h-8"></div>
                           <input 
                              type="text"
                              value={newStage}
                              onChange={(e) => setNewStage(e.target.value)}
                              placeholder="Digite o nome da nova etapa..."
                              className="flex-1 bg-transparent focus:outline-none text-sm dark:text-white"
                              onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                           />
                           <button 
                              onClick={handleAddStage}
                              className={`text-sm font-medium text-${localSettings.themeColor || 'indigo'}-600 hover:text-${localSettings.themeColor || 'indigo'}-800`}
                           >
                               Adicionar Etapa
                           </button>
                       </div>
                   </div>
                </div>

                <div>
                   <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Regras de Automação</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Configure para onde as tarefas se movem automaticamente quando ações específicas ocorrem.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                       <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                           <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Ao Aceitar Tarefa</label>
                           <div className="flex items-center gap-2">
                               <ArrowRight size={16} className="text-gray-400"/>
                               <select 
                                  value={localSettings?.workflowRules?.onAccept || ''}
                                  onChange={(e) => setLocalSettings({
                                      ...localSettings,
                                      workflowRules: { ...localSettings.workflowRules, onAccept: e.target.value }
                                  })}
                                  className="flex-1 p-2 bg-white text-gray-900 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                               >
                                  <option value="">Selecione a etapa</option>
                                  {workflow.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </select>
                           </div>
                       </div>
                       {/* Repetir para as outras regras conforme necessário com encadeamento opcional */}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'appearance' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">Aparência do Sistema</h3>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">Cor de Destaque</label>
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
                </div>
             </div>
          )}

          {activeTab === 'login' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">Personalização da Tela de Login</h3>
                
                <div className="grid grid-cols-1 gap-6 max-w-xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Título de Boas-vindas</label>
                        <input 
                            type="text" 
                            value={localSettings?.loginScreen?.title || ''}
                            onChange={(e) => setLocalSettings({
                                ...localSettings, 
                                loginScreen: { ...(localSettings.loginScreen || {}), title: e.target.value } as any
                            })}
                            className="w-full p-2 border border-gray-300 bg-white text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subtítulo / Mensagem</label>
                        <input 
                            type="text" 
                            value={localSettings?.loginScreen?.subtitle || ''}
                            onChange={(e) => setLocalSettings({
                                ...localSettings, 
                                loginScreen: { ...(localSettings.loginScreen || {}), subtitle: e.target.value } as any
                            })}
                            className="w-full p-2 border border-gray-300 bg-white text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">URL da Imagem do Banner</label>
                        <input 
                            type="text" 
                            value={localSettings?.loginScreen?.bannerUrl || ''}
                            onChange={(e) => setLocalSettings({
                                ...localSettings, 
                                loginScreen: { ...(localSettings.loginScreen || {}), bannerUrl: e.target.value } as any
                            })}
                            placeholder="https://..."
                            className="w-full p-2 border border-gray-300 bg-white text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    
                    {localSettings?.loginScreen?.bannerUrl && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Pré-visualização do Banner</label>
                            <div className="h-32 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100">
                                <img src={localSettings.loginScreen.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                </div>
             </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-6 animate-in fade-in duration-300">
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
                          <div className={`w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${localSettings.themeColor || 'indigo'}-600`}></div>
                        </label>
                    </div>

                    <div className="mt-8 pt-6 border-t border-red-100 dark:border-red-900/30">
                         <h4 className="text-red-600 font-bold flex items-center gap-2 mb-4">
                            <AlertTriangle size={18} /> Zona de Perigo
                         </h4>
                         <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white block">Resetar Dados do Aplicativo</span>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Limpar todas as tarefas, usuários e eventos para o estado inicial.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    if(confirm('Tem certeza? Isso apagará todas as suas alterações e restaurará os dados de demonstração padrão.')) {
                                        onResetApp();
                                    }
                                }}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={14} /> Resetar Dados
                            </button>
                        </div>
                    </div>
                </div>
             </div>
          )}
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-end z-10">
            <button 
              onClick={handleSaveSettings}
              className={`flex items-center gap-2 px-6 py-2 bg-${localSettings.themeColor || 'indigo'}-600 text-white rounded-lg font-bold shadow-md hover:bg-${localSettings.themeColor || 'indigo'}-700 transition-colors`}
            >
                <Save size={18} />
                Salvar Alterações
            </button>
        </div>

      </div>
    </div>
  );
};