import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, password: string, name: string) => void;
  themeColor: string;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, onInvite, themeColor }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim() && name.trim()) {
      onInvite(email.trim(), password.trim(), name.trim());
      setEmail('');
      setPassword('');
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950">
          <h3 className="font-bold text-gray-900 dark:text-white">Convidar Novo Membro</h3>
          <button onClick={onClose}><X size={20} className="text-gray-500"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Nome do Membro" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="email@exemplo.com" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha Inicial</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">O membro poderá alterar esta senha após o primeiro login.</p>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={!email.trim() || !password.trim() || !name.trim()}
              className={`w-full bg-${themeColor}-600 text-white font-bold py-3 rounded-xl hover:bg-${themeColor}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Convidar Membro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};