
import React, { useState } from 'react';
import { User, SystemSettings, UserRole } from '../types';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  settings: SystemSettings;
  onSystemInit: () => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, settings, onSystemInit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Busca usuário na lista sincronizada
      const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
      
      // Credenciais Mestre para emergência/primeiro acesso
      const isMasterEmail = email.toLowerCase().trim() === 'studiojpgloria@gmail.com';
      const isMasterPassword = password === 'Jp072392';

      if (isMasterEmail && isMasterPassword) {
        // Se o usuário não existir no banco ainda, cria um objeto temporário baseado no mock admin
        const adminFallback: User = user || {
          id: 'admin-01',
          name: 'JP Gloria (Admin)',
          role: UserRole.ADMIN,
          email: 'studiojpgloria@gmail.com',
          avatar: 'https://ui-avatars.com/api/?name=JP+Gloria&background=6366f1&color=fff',
          status: 'online',
          lastSeen: Date.now()
        };
        onLogin(adminFallback);
        return;
      }

      // Validação normal via banco
      if (user && user.password === password) {
        onLogin(user);
      } else {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        setIsLoading(false);
      }
    }, 800);
  };

  const loginTitle = settings?.loginScreen?.title || 'Nexus Gestão';
  const loginSubtitle = settings?.loginScreen?.subtitle || 'Acesse o painel administrativo.';
  const themeColor = settings?.themeColor || 'indigo';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0e11] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-[#151a21] w-full max-w-5xl rounded-[32px] shadow-2xl flex overflow-hidden border border-gray-200 dark:border-[#2a303c]">
        
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-[#151a21]">
           <div className="mb-10">
              <div className="mb-6 flex justify-between items-center">
                {settings.companyLogo ? (
                  <img src={settings.companyLogo} alt="Logo" className="h-12 w-auto object-contain" />
                ) : (
                  <div className={`w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
                     <ShieldCheck className="text-white" size={32} />
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{loginTitle}</h1>
              <p className="text-gray-500 font-medium">{loginSubtitle}</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div>
                 <label className="block text-sm font-bold text-gray-400 mb-2 ml-1">E-mail</label>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                        <Mail size={20} />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#0b0e11] border border-[#2a303c] text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-700"
                      placeholder="seu@email.com"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-bold text-gray-400 mb-2 ml-1">Senha</label>
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                        <Lock size={20} />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-[#0b0e11] border border-[#2a303c] text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-700"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                 </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 p-4 rounded-2xl border border-red-400/20 animate-in fade-in slide-in-from-top-2">
                   <AlertCircle size={20} />
                   <span className="font-bold">{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Entrar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
           </form>
        </div>

        <div className="hidden md:flex w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden">
           {settings?.loginScreen?.bannerUrl && (
               <>
                   <img src={settings.loginScreen.bannerUrl} className="absolute inset-0 w-full h-full object-cover" alt="Login Banner" />
                   <div className="absolute inset-0 bg-indigo-950/60 mix-blend-multiply"></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e11] to-transparent"></div>
               </>
           )}
           <div className="relative z-10 mt-10">
               <h2 className="text-5xl font-black mb-6 leading-tight tracking-tighter">Nexus Marketing</h2>
               <p className="text-white/80 text-xl leading-relaxed font-medium">
                  Sistema sincronizado com Supabase.
               </p>
           </div>
           
           <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Servidor Online
           </div>
        </div>
      </div>
    </div>
  );
};
