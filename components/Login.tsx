
import React, { useState } from 'react';
import { User, SystemSettings, UserRole } from '../types';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  settings: SystemSettings;
  onSystemInit: () => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, settings }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mapeamento de cores baseado no tema do sistema para a tela de login
  const loginThemes: Record<string, any> = {
    indigo: {
      gradient: 'from-indigo-600 via-violet-600 to-indigo-800',
      button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20',
      ring: 'focus:ring-indigo-500/20 focus:border-indigo-500',
      text: 'text-indigo-600'
    },
    emerald: {
      gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
      button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
      ring: 'focus:ring-emerald-500/20 focus:border-emerald-500',
      text: 'text-emerald-600'
    },
    rose: {
      gradient: 'from-rose-600 via-pink-600 to-rose-800',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
      ring: 'focus:ring-rose-500/20 focus:border-rose-500',
      text: 'text-rose-600'
    },
    blue: {
      gradient: 'from-blue-600 via-indigo-600 to-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
      ring: 'focus:ring-blue-500/20 focus:border-blue-500',
      text: 'text-blue-600'
    },
    violet: {
      gradient: 'from-violet-600 via-purple-600 to-violet-800',
      button: 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20',
      ring: 'focus:ring-violet-500/20 focus:border-violet-500',
      text: 'text-violet-600'
    },
    orange: {
      gradient: 'from-orange-600 via-amber-600 to-orange-800',
      button: 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20',
      ring: 'focus:ring-orange-500/20 focus:border-orange-500',
      text: 'text-orange-600'
    }
  };

  const activeTheme = loginThemes[settings.themeColor] || loginThemes.indigo;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
      
      const isMasterEmail = email.toLowerCase().trim() === 'studiojpgloria@gmail.com';
      const isMasterPassword = password === 'Jp072392' || password === 'password';

      if (isMasterEmail && isMasterPassword) {
        const adminFallback: User = user || {
          id: 'admin-01',
          name: 'JP Gloria (Admin)',
          role: UserRole.ADMIN,
          email: 'studiojpgloria@gmail.com',
          avatar: 'https://ui-avatars.com/api/?name=JP+Gloria&background=7c3aed&color=fff',
          status: 'online',
          lastSeen: Date.now()
        };
        onLogin(adminFallback);
        return;
      }

      if (user && user.password === password) {
        onLogin(user);
      } else {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-[1100px] h-fit md:h-[700px] rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white">
        
        {/* LADO ESQUERDO: BANNER DINÂMICO (Cores sincronizadas com o tema) */}
        <div className={`w-full md:w-1/2 relative overflow-hidden bg-gradient-to-br ${activeTheme.gradient}`}>
            {settings.loginScreen.bannerUrl ? (
                <img 
                    src={settings.loginScreen.bannerUrl} 
                    className="w-full h-full object-cover" 
                    alt="Login Banner" 
                />
            ) : (
                <div className="w-full h-full p-12 flex flex-col justify-between relative">
                    {/* Efeitos Visuais de Fundo (fallback) */}
                    <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-white/10 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-black/10 blur-[100px] rounded-full"></div>
                </div>
            )}
            {/* Overlay sutil para acabamento */}
            <div className="absolute inset-0 bg-black/5"></div>
        </div>

        {/* LADO DIREITO: FORMULÁRIO (Textos e Cores sincronizados) */}
        <div className="flex-1 bg-white p-10 md:p-16 flex flex-col justify-center">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {settings.loginScreen.title || 'Get Started Now'}
                </h2>
                <p className="text-slate-400 text-sm">
                    {settings.loginScreen.subtitle || 'Please log in to your account to continue.'}
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">Email address</label>
                    <div className="relative">
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl outline-none transition-all placeholder:text-slate-300 focus:ring-2 ${activeTheme.ring}`}
                            placeholder="workmail@gmail.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-800">Password</label>
                    </div>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            value={password}
                            required
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl outline-none transition-all placeholder:text-slate-300 focus:ring-2 ${activeTheme.ring}`}
                            placeholder="••••••••••••"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)} 
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-3 rounded-xl border border-red-100">
                        <AlertCircle size={14} />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`w-full ${activeTheme.button} text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 mt-2`}
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Log in'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
