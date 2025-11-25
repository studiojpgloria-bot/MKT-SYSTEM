import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Save, Camera } from 'lucide-react';

interface ProfilePageProps {
  currentUser: User;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onUpdateAvatar: (userId: string, file: File) => void;
  themeColor: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUpdateUser, onUpdateAvatar, themeColor }) => {
  const [name, setName] = useState(currentUser.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (name.trim() !== currentUser.name) {
      onUpdateUser(currentUser.id, { name });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpdateAvatar(currentUser.id, e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className={`h-32 bg-${themeColor}-600`}></div>
        <div className="p-6">
          <div className="flex items-end -mt-20">
            <div className="relative group">
              <img 
                src={currentUser.avatar} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-900"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <Camera size={24} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 capitalize">{currentUser.role.toLowerCase()}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Informações do Perfil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço de Email</label>
                <input 
                  type="email"
                  value={currentUser.email}
                  readOnly
                  className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-400 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end max-w-lg">
              <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2 bg-${themeColor}-600 text-white rounded-lg font-bold shadow-md hover:bg-${themeColor}-700 transition-colors`}
              >
                <Save size={16} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};