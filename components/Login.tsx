import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { SystemSettings } from '../types';
import { ShieldCheck } from 'lucide-react';

interface LoginProps {
  settings: SystemSettings;
}

export const Login: React.FC<LoginProps> = ({ settings }) => {
  
  // Note: The actual authentication state and redirection are now handled by SupabaseProvider in App.tsx

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

           <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                    default: {
                        colors: {
                            brand: '#4f46e5', // Default indigo
                            brandAccent: '#6366f1',
                        },
                    },
                },
              }}
              theme={settings.darkMode ? "dark" : "light"}
              localization={{
                variables: {
                    sign_in: {
                        email_label: 'Email Address',
                        password_label: 'Password',
                        email_input_placeholder: 'Enter your email',
                        password_input_placeholder: '••••••••',
                        button_label: 'Sign In',
                        loading_button_label: 'Signing In...',
                        link_text: 'Already have an account? Sign In',
                    },
                    sign_up: {
                        email_label: 'Email Address',
                        password_label: 'Create Password',
                        email_input_placeholder: 'Enter your email',
                        password_input_placeholder: '••••••••',
                        button_label: 'Sign Up',
                        loading_button_label: 'Signing Up...',
                        link_text: 'Don\'t have an account? Sign Up',
                    },
                    forgotten_password: {
                        link_text: 'Forgot your password?',
                    },
                },
              }}
            />
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