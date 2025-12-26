
import React, { useState, useRef, useEffect } from 'react';
import { Save, User as UserIcon, Building, Palette, Shield, Plus, Trash2, GripVertical, Check, Layout, AlertTriangle, RefreshCw, Image as ImageIcon, Upload, Moon, Sun, ShieldCheck, Monitor, Lock, ChevronDown, Key, UserCircle, Globe, Briefcase } from 'lucide-react';
import { SystemSettings, User, UserRole, WorkflowStage, Task, DeliveryType } from '../types';

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
  const [activeTab, setActiveTab] = useState<'company' | 'team' | 'workflow' | 'delivery' | 'appearance' | 'security' | 'login'>('company');
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [localWorkflow, setLocalWorkflow] = useState<WorkflowStage[]>(workflow);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.MEMBER, password: '' });
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalWorkflow(workflow);
  }, [workflow]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSaveSettings = () => {
      // Garante que o ID único de persistência seja mantido
      onUpdateSettings({ ...localSettings, id: 'global-config' });
  };
  
  const handleSaveWorkflow = () => onUpdateWorkflow(localWorkflow);

  const themeColors = {
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-600', border: 'border-indigo-600', ring: 'focus:ring-indigo-500', shadow: 'shadow-indigo-600/20', light: 'bg-indigo-50', hover: 'hover:bg-indigo-700' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', border: 'border-emerald-600', ring: 'focus:ring-emerald-500', shadow: 'shadow-emerald-600/20', light: 'bg-emerald-50', hover: 'hover:bg-emerald-700' },
    rose: { text: 'text-rose-600', bg: 'bg-rose-600', border: 'border-rose-600', ring: 'focus:ring-rose-500', shadow: 'shadow-rose-600/20', light: 'bg-rose-50', hover: 'hover:bg-rose-700' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-600', ring: 'focus:ring-blue-500', shadow: 'shadow-blue-600/20', light: 'bg-blue-50', hover: 'hover:bg-blue-700' },
    violet: { text: 'text-violet-600', bg: 'bg-violet-600', border: 'border-violet-600', ring: 'focus:ring-violet-500', shadow: 'shadow-violet-600/20', light: 'bg-violet-50', hover: 'hover:bg-violet-700' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-600', ring: 'focus:ring-orange-500', shadow: 'shadow-orange-600/20', light: 'bg-orange-50', hover: 'hover:bg-orange-700' },
  };

  const activeTheme = themeColors[localSettings.themeColor] || themeColors.indigo;

  const handleAddUser = () => {
    if (newUser.name && newUser.email && newUser.password) {
      const user: User = {
        id: `u${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password,
        avatar: `https://ui-avatars.com/api/?name=${newUser.name.replace(' ', '+')}&background=6366f1&color=fff`,
        status: 'offline',
        lastSeen: Date.now()
      };
      onUpdateUsers([...users, user]);
      setNewUser({ name: '', email: '', role: UserRole.MEMBER, password: '' });
    }
  };

  const handleUpdateUserRole = (id: string, newRole: UserRole) => {
    onUpdateUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleRemoveUser = (id: string) => {
    if (id === currentUser.id) return alert("Você não pode remover a si mesmo.");
    if (confirm("Deseja realmente remover este membro? Isso afetará o banco de dados.")) {
        onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleUpdateWorkflowStage = (id: string, name: string) => {
    setLocalWorkflow(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleDeleteWorkflowStage = (id: string) => {
    if (localWorkflow.length <= 1) return alert("O sistema precisa de pelo menos uma etapa.");
    const isUsedInAutomation = Object.values(localSettings.workflowRules).includes(id);
    if (isUsedInAutomation) {
      return alert("Esta etapa está sendo usada em uma Regra de Automação e não pode ser excluída.");
    }
    setLocalWorkflow(prev => prev.filter(s => s.id !== id));
  };

  const handleAddWorkflowStage = () => {
    const newStage: WorkflowStage = {
      id: `stage-${Date.now()}`,
      name: 'Nova Etapa',
      color: 'gray'
    };
    setLocalWorkflow(prev => [...prev, newStage]);
  };

  const handleUpdateDeliveryType = (id: string, name: string) => {
    setLocalSettings(prev => ({
      ...prev,
      deliveryTypes: prev.deliveryTypes.map(d => d.id === id ? { ...d, name } : d)
    }));
  };

  const handleDeleteDeliveryType = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      deliveryTypes: prev.deliveryTypes.filter(d => d.id !== id)
    }));
  };

  const handleAddDeliveryType = () => {
    const newType: DeliveryType = {
      id: `type-${Date.now()}`,
      name: 'Novo Tipo de Entrega'
    };
    setLocalSettings(prev => ({
      ...prev,
      deliveryTypes: [...(prev.deliveryTypes || []), newType]
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 1000;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/png');
          setLocalSettings(prev => ({ ...prev, companyLogo: dataUrl }));
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-bold transition-all ${
        activeTab === id ? `${activeTheme.light} ${activeTheme.text} dark:bg-white/10 dark:text-white` : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  const AutomationCard = ({ label, value, field }: { label: string, value: string, field: keyof typeof localSettings.workflowRules }) => (
    <div className="bg-white dark:bg-[#151a21] p-6 rounded-2xl border border-slate-200 dark:border-[#2a303c] space-y-4 shadow-sm transition-colors">
        <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">{label}</label>
        <div className="relative group">
            <select 
                value={value}
                onChange={(e) => setLocalSettings({...localSettings, workflowRules: {...localSettings.workflowRules, [field]: e.target.value}})}
                className={`w-full p-4 bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none appearance-none focus:ring-1 ${activeTheme.ring}`}
            >
                {localWorkflow.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600" />
        </div>
    </div>
  );

  const SaveButton = ({ onClick }: { onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-10 py-5 ${activeTheme.bg} text-white rounded-[24px] font-black shadow-lg ${activeTheme.shadow} text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 mt-10 self-end`}
    >
      <Save size={18} /> SALVAR ALTERAÇÕES NO BANCO
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto bg-white dark:bg-[#151a21] rounded-[40px] shadow-2xl border border-slate-200 dark:border-[#2a303c] overflow-hidden flex flex-col h-[85vh] transition-colors duration-300">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-slate-50 dark:bg-[#0b0e11] p-8 border-r border-slate-200 dark:border-[#2a303c] flex-shrink-0 overflow-y-auto custom-scrollbar transition-colors">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-10 tracking-tight">Configurações</h2>
          <nav className="space-y-2">
            <TabButton id="company" label="Empresa e Perfil" icon={Building} />
            <TabButton id="team" label="Gestão da Equipe" icon={UserIcon} />
            <TabButton id="workflow" label="Config. Workflow" icon={Layout} />
            <TabButton id="delivery" label="Tipos de Entrega" icon={Briefcase} />
            <TabButton id="appearance" label="Aparência" icon={Palette} />
            <TabButton id="login" label="Tela de Login" icon={ImageIcon} />
            <TabButton id="security" label="Segurança e Dados" icon={Shield} />
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-white dark:bg-[#151a21] custom-scrollbar flex flex-col transition-colors">
            {activeTab === 'company' && (
              <div className="space-y-8 animate-in fade-in duration-300 flex flex-col">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Empresa e Perfil</h3>
                <div className="grid grid-cols-1 gap-8 max-w-2xl">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Nome da Empresa</label>
                    <input type="text" value={localSettings.companyName} onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})} className={`w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] text-slate-900 dark:text-white rounded-2xl outline-none font-bold focus:ring-2 ${activeTheme.ring}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Logotipo</label>
                    <div className="flex gap-6 items-center">
                        <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] flex items-center justify-center overflow-hidden shadow-inner">
                            {localSettings.companyLogo ? <img src={localSettings.companyLogo} className="w-full h-full object-contain p-3" alt="Company Logo" /> : <ShieldCheck size={40} className="text-indigo-600/20" />}
                        </div>
                        <button onClick={() => logoInputRef.current?.click()} className={`py-4 px-8 ${activeTheme.bg} text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg ${activeTheme.shadow} transition-all hover:scale-105 active:scale-95`}>Fazer Upload</button>
                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                  </div>
                </div>
                <SaveButton onClick={handleSaveSettings} />
              </div>
            )}

            {activeTab === 'team' && (
                <div className="space-y-12 animate-in fade-in duration-300 flex flex-col">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão da Equipe</h3>
                    <div className="bg-slate-50 dark:bg-[#0b0e11] p-10 rounded-[40px] border border-slate-200 dark:border-[#2a303c] space-y-8 relative overflow-hidden group">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 block">Nome</label>
                                <input type="text" placeholder="Ex: João Paulo" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className={`w-full p-5 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-slate-900 dark:text-white outline-none font-bold focus:ring-1 ${activeTheme.ring}`} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 block">Email</label>
                                <input type="email" placeholder="Ex: joao@nexus.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={`w-full p-5 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-slate-900 dark:text-white outline-none font-bold focus:ring-1 ${activeTheme.ring}`} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 block">Senha Inicial</label>
                                <input type="password" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className={`w-full p-5 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-slate-900 dark:text-white outline-none font-bold focus:ring-1 ${activeTheme.ring}`} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 block">Função</label>
                                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className={`w-full p-5 bg-white dark:bg-[#151a21] border border-slate-200 dark:border-[#2a303c] rounded-2xl text-slate-900 dark:text-white outline-none font-bold appearance-none focus:ring-1 ${activeTheme.ring}`}>
                                    <option value={UserRole.MEMBER}>Membro</option>
                                    <option value={UserRole.MANAGER}>Gestor</option>
                                    <option value={UserRole.ADMIN}>Administrador</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleAddUser} className={`w-full py-5 ${activeTheme.bg} text-white font-black rounded-2xl shadow-xl ${activeTheme.shadow} text-xs uppercase tracking-widest transition-all`}>
                            ADICIONAR MEMBRO
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map(u => (
                            <div key={u.id} className={`p-6 bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] flex items-center gap-5 group relative hover:border-indigo-500/50 transition-all shadow-sm rounded-[32px]`}>
                                <img src={u.avatar} className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-[#151a21] shadow-sm" alt={u.name} />
                                <div className="flex-1 truncate">
                                    <p className="font-black text-lg text-slate-900 dark:text-white truncate leading-tight">{u.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <select 
                                            value={u.role}
                                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value as UserRole)}
                                            className={`text-[10px] font-black ${activeTheme.text} bg-transparent border-none p-0 focus:ring-0 uppercase tracking-widest cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors`}
                                        >
                                            <option value={UserRole.ADMIN}>ADMIN</option>
                                            <option value={UserRole.MANAGER}>MANAGER</option>
                                            <option value={UserRole.MEMBER}>MEMBER</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveUser(u.id)} className="p-3 text-slate-400 dark:text-gray-600 opacity-100 hover:text-red-500 transition-all absolute top-2 right-2"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'workflow' && (
               <div className="space-y-12 animate-in fade-in duration-300 flex flex-col">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Regras de Automação</h3>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Defina o comportamento automático das tarefas no sistema.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AutomationCard label="Ao Aceitar Tarefa" value={localSettings.workflowRules.onAccept} field="onAccept" />
                      <AutomationCard label="Ao Enviar Entregável" value={localSettings.workflowRules.onDeliverableUpload} field="onDeliverableUpload" />
                      <AutomationCard label="Ao Aprovar" value={localSettings.workflowRules.onApprove} field="onApprove" />
                      <AutomationCard label="Ao Rejeitar" value={localSettings.workflowRules.onReject} field="onReject" />
                  </div>

                  <div className="pt-10 border-t border-slate-200 dark:border-[#2a303c]">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">Etapas do Workflow</h3>
                    <div className="space-y-3 max-w-2xl">
                       {localWorkflow.map((stage) => (
                           <div key={stage.id} className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] rounded-[24px] group hover:border-indigo-500/30 transition-all shadow-sm">
                               <GripVertical size={18} className="text-slate-400 dark:text-gray-600 shrink-0" />
                               <input 
                                  value={stage.name} 
                                  onChange={(e) => handleUpdateWorkflowStage(stage.id, e.target.value)}
                                  className="flex-1 font-black text-slate-700 dark:text-white text-sm bg-transparent border-none focus:ring-0 outline-none"
                               />
                               <button 
                                  onClick={() => handleDeleteWorkflowStage(stage.id)} 
                                  className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                  title="Excluir Etapa"
                                >
                                  <Trash2 size={18} />
                                </button>
                           </div>
                       ))}
                       <button onClick={handleAddWorkflowStage} className={`w-full p-6 border-2 border-dashed border-slate-300 dark:border-[#2a303c] rounded-[24px] text-slate-500 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:${activeTheme.text} hover:${activeTheme.border} transition-all bg-slate-50/50 dark:bg-white/5`}>
                            + Adicionar nova etapa
                       </button>
                    </div>
                  </div>
                  <SaveButton onClick={handleSaveWorkflow} />
               </div>
            )}

            {activeTab === 'delivery' && (
              <div className="space-y-12 animate-in fade-in duration-300 flex flex-col">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Tipos de Entrega</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Gerencie as categorias de projetos disponíveis para seleção.</p>
                </div>
                
                <div className="space-y-3 max-w-2xl">
                  {localSettings.deliveryTypes?.map((type) => (
                    <div key={type.id} className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] rounded-[24px] group hover:border-indigo-500/30 transition-all shadow-sm">
                      <GripVertical size={18} className="text-slate-400 dark:text-gray-600 shrink-0" />
                      <input 
                        value={type.name} 
                        onChange={(e) => handleUpdateDeliveryType(type.id, e.target.value)}
                        className="flex-1 font-black text-slate-700 dark:text-white text-sm bg-transparent border-none focus:ring-0 outline-none"
                      />
                      <button 
                        onClick={() => handleDeleteDeliveryType(type.id)} 
                        className="text-slate-400 hover:text-red-500 transition-colors p-2"
                        title="Excluir Tipo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button onClick={handleAddDeliveryType} className={`w-full p-6 border-2 border-dashed border-slate-300 dark:border-[#2a303c] rounded-[24px] text-slate-500 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:${activeTheme.text} hover:${activeTheme.border} transition-all bg-slate-50/50 dark:bg-white/5`}>
                    + Adicionar novo tipo de entrega
                  </button>
                </div>
                <SaveButton onClick={handleSaveSettings} />
              </div>
            )}

            {activeTab === 'appearance' && (
                <div className="space-y-12 animate-in fade-in duration-300 flex flex-col">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Aparência do Sistema</h3>
                    <div className="grid grid-cols-1 gap-10 max-w-2xl">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-6 block">Cor Temática</label>
                            <div className="flex flex-wrap gap-4">
                                {(['indigo', 'emerald', 'rose', 'blue', 'violet', 'orange'] as const).map(color => (
                                    <button 
                                        key={color} 
                                        onClick={() => {
                                          const newSettings = {...localSettings, themeColor: color};
                                          setLocalSettings(newSettings);
                                          onUpdateSettings(newSettings);
                                        }}
                                        className={`w-14 h-14 rounded-2xl transition-all border-4 ${localSettings.themeColor === color ? 'border-slate-900 dark:border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'} bg-${color === 'emerald' ? 'emerald' : color === 'rose' ? 'rose' : color === 'violet' ? 'violet' : color === 'indigo' ? 'indigo' : color}-600`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0b0e11] p-8 rounded-[32px] border border-slate-200 dark:border-[#2a303c] flex items-center justify-between shadow-sm transition-colors">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Tema Visual</h4>
                                <p className="text-xs text-slate-500 dark:text-gray-400">Alternar entre modo claro e escuro em todo o sistema.</p>
                            </div>
                            <button 
                                onClick={() => {
                                  const newSettings = {...localSettings, darkMode: !localSettings.darkMode};
                                  setLocalSettings(newSettings);
                                  onUpdateSettings(newSettings);
                                }}
                                className={`w-14 h-8 rounded-full transition-all relative ${localSettings.darkMode ? activeTheme.bg : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${localSettings.darkMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                    <SaveButton onClick={handleSaveSettings} />
                </div>
            )}

            {activeTab === 'login' && (
                <div className="space-y-12 animate-in fade-in duration-300 flex flex-col">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Customização da Tela de Login</h3>
                    <div className="grid grid-cols-1 gap-8 max-w-2xl">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 block">Título da Tela</label>
                            <input type="text" value={localSettings.loginScreen.title} onChange={(e) => setLocalSettings({...localSettings, loginScreen: {...localSettings.loginScreen, title: e.target.value}})} className={`w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] text-slate-900 dark:text-white rounded-2xl outline-none font-bold focus:ring-1 ${activeTheme.ring}`} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 block">Subtítulo</label>
                            <input type="text" value={localSettings.loginScreen.subtitle} onChange={(e) => setLocalSettings({...localSettings, loginScreen: {...localSettings.loginScreen, subtitle: e.target.value}})} className={`w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] text-slate-900 dark:text-white rounded-2xl outline-none font-bold focus:ring-1 ${activeTheme.ring}`} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 block">URL do Banner Lateral</label>
                            <input type="text" value={localSettings.loginScreen.bannerUrl} onChange={(e) => setLocalSettings({...localSettings, loginScreen: {...localSettings.loginScreen, bannerUrl: e.target.value}})} className={`w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-slate-200 dark:border-[#2a303c] text-slate-900 dark:text-white rounded-2xl outline-none font-bold placeholder:text-slate-300 dark:placeholder:text-gray-600 focus:ring-1 ${activeTheme.ring}`} placeholder="https://images.unsplash.com/..." />
                        </div>
                    </div>
                    <SaveButton onClick={handleSaveSettings} />
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-12 animate-in fade-in duration-300 flex flex-col">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Segurança e Dados</h3>
                    <div className="max-w-2xl space-y-6">
                        <div className="bg-red-50 dark:bg-red-900/5 p-10 rounded-[40px] border border-red-100 dark:border-red-900/20 space-y-6 shadow-sm">
                            <div>
                                <h4 className="text-xl font-black text-red-600 uppercase tracking-tight">Zona de Perigo</h4>
                                <p className="text-sm text-red-800 dark:text-red-400 font-medium opacity-70">Ações irreversíveis para gerenciamento do sistema.</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <button onClick={onResetApp} className="w-full py-4 bg-white dark:bg-[#0b0e11] text-red-600 border border-red-200 dark:border-red-900/30 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Limpar Banco de Dados</button>
                                <button className="w-full py-4 bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest cursor-not-allowed">Exportar Todos os Dados (Em breve)</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
