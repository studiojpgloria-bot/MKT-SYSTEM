
import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  settings: SystemSettings;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, settings }) => {
  const [email, setEmail] = useState('alice@nexus.com'); // Default for demo convenience
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay and authentication
    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        // In a real app, we would validate the password hash here.
        // For this demo, we just check if the user exists.
        onLogin(user);
      } else {
        setError('Invalid credentials. Please check your email.');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleDemoClick = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
           <div className="mb-10">
              <div className={`w-12 h-12 bg-${settings.themeColor}-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-${settings.themeColor}-200 dark:shadow-none`}>
                 <ShieldCheck className="text-white" size={28} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{settings.loginScreen.title}</h1>
              <p className="text-gray-500 dark:text-slate-400">{settings.loginScreen.subtitle}</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email Address</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-${settings.themeColor}-500 focus:border-${settings.themeColor}-500 transition-all`}
                      placeholder="Enter your email"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-${settings.themeColor}-500 focus:border-${settings.themeColor}-500 transition-all`}
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
                className={`w-full bg-${settings.themeColor}-600 hover:bg-${settings.themeColor}-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    Sign In <ArrowRight size={20} />
                  </>
                )}
              </button>
           </form>

           <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Quick Demo Login</p>
              <div className="flex gap-3">
                 <button onClick={() => handleDemoClick('alice@nexus.com')} className="flex-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 py-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium transition-colors">
                    Admin
                 </button>
                 <button onClick={() => handleDemoClick('bob@nexus.com')} className="flex-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 py-2 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50 font-medium transition-colors">
                    Manager
                 </button>
                 <button onClick={() => handleDemoClick('charlie@nexus.com')} className="flex-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 py-2 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-medium transition-colors">
                    Member
                 </button>
              </div>
           </div>
        </div>

        {/* Right Side - Banner */}
        <div className={`hidden md:flex w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden ${!settings.loginScreen.bannerUrl ? `bg-${settings.themeColor}-600` : ''}`}>
           
           {settings.loginScreen.bannerUrl && (
               <>
                   <img src={settings.loginScreen.bannerUrl} className="absolute inset-0 w-full h-full object-cover" alt="Login Banner" />
                   <div className={`absolute inset-0 bg-${settings.themeColor}-900/60 mix-blend-multiply`}></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
               </>
           )}

           {!settings.loginScreen.bannerUrl && (
               <>
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
               </>
           )}
           
           <div className="relative z-10 mt-10">
               <h2 className="text-4xl font-bold mb-6 leading-tight">{settings.companyName}</h2>
               <p className="text-white/90 text-lg leading-relaxed font-light">
                  Manage campaigns, approve assets, and track team performance all in one place.
               </p>
           </div>

           <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
               <div className="flex items-center gap-4 mb-4">
                  <div className="flex -space-x-2">
                     <img className="w-8 h-8 rounded-full border-2 border-white/20" src="https://picsum.photos/id/64/100/100" alt=""/>
                     <img className="w-8 h-8 rounded-full border-2 border-white/20" src="https://picsum.photos/id/65/100/100" alt=""/>
                     <img className="w-8 h-8 rounded-full border-2 border-white/20" src="https://picsum.photos/id/91/100/100" alt=""/>
                  </div>
                  <p className="text-sm font-medium">Trusted by creative teams</p>
               </div>
               <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-3/4 rounded-full"></div>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};