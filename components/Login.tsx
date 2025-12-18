
import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  settings: SystemSettings;
  onSystemInit: () => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, settings, onSystemInit }) => {
  const [email, setEmail] = useState('studiojpgloria@gmail.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      // Valida contra a senha do usuário ou a senha mestre JP
      const isMasterPassword = password === 'Jp072392';
      const isUserPassword = user && user.password === password;

      if (user && (isMasterPassword || isUserPassword)) {
        onLogin(user);
      } else {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        setIsLoading(false);
      }
    }, 800);
  };

  // Garante valores seguros mesmo se o objeto loginScreen estiver ausente
  const loginTitle = settings?.loginScreen?.title || 'Nexus Gestão';
  const loginSubtitle = settings?.loginScreen?.subtitle || 'Acesse o painel administrativo.';
  const themeColor = settings?.themeColor || 'indigo';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl flex overflow-hidden">
        
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
           <div className="mb-10">
              <div className="mb-4">
                {settings.companyLogo ? (
                  <img src={settings.companyLogo} alt="Logo" className="h-12 w-auto object-contain" />
                ) : (
                  <div className={`w-12 h-12 bg-${themeColor}-600 rounded-xl flex items-center justify-center shadow-lg shadow-${themeColor}-200 dark:shadow-none`}>
                     <ShieldCheck className="text-white" size={28} />
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{loginTitle}</h1>
              <p className="text-gray-500 dark:text-slate-400">{loginSubtitle}</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">E-mail</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 transition-all`}
                      placeholder="seu@email.com"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Senha</label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 transition-all`}
                      placeholder="••••••••"
                    />
                 </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900">
                   <AlertCircle size={16} />
                   {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    Entrar <ArrowRight size={20} />
                  </>
                )}
              </button>
           </form>
        </div>

        <div className={`hidden md:flex w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden ${!settings?.loginScreen?.bannerUrl ? `bg-${themeColor}-600` : ''}`}>
           {settings?.loginScreen?.bannerUrl && (
               <>
                   <img src={settings.loginScreen.bannerUrl} className="absolute inset-0 w-full h-full object-cover" alt="Login Banner" />
                   <div className={`absolute inset-0 bg-${themeColor}-900/60 mix-blend-multiply`}></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
               </>
           )}
           <div className="relative z-10 mt-10">
               <h2 className="text-4xl font-bold mb-6 leading-tight">{settings?.companyName || 'Nexus Marketing'}</h2>
               <p className="text-white/90 text-lg leading-relaxed font-light">
                  Sistema sincronizado com Supabase.
               </p>
           </div>
        </div>
      </div>
    </div>
  );
};
