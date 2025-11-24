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
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-10 text-center">
            <div className={`w-12 h-12 bg-${settings.themeColor}-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-${settings.themeColor}-200 dark:shadow-none mx-auto`}>
              <ShieldCheck className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{settings.loginScreen.title}</h1>
            <p className="text-gray-500 dark:text-slate-400">{settings.loginScreen.subtitle}</p>
          </div>
          
          <Auth
            supabaseClient={supabase}
            appearance={{ 
                theme: ThemeSupa,
                variables: {
                    default: {
                        colors: {
                            brand: '#4f46e5', // indigo-600
                            brandAccent: '#4338ca', // indigo-700
                        },
                        radii: {
                            borderRadius: '8px',
                            buttonBorderRadius: '8px',
                        }
                    }
                }
            }}
            providers={[]}
            theme={settings.darkMode ? "dark" : "light"}
            localization={{
                variables: {
                    sign_in: {
                        email_label: 'Endereço de Email',
                        password_label: 'Senha',
                    },
                },
            }}
          />
        </div>
      </div>
    </div>
  );
};