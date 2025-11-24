import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '../integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, UserRole } from '../types';

interface AuthContextType {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  fetchProfile: (userId: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<User | null> => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, name, role, avatar_url, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (profileData) {
      // Combine profile data with auth user data (email is available via session.user)
      const authUser = session?.user;
      if (!authUser) return null;

      const user: User = {
        id: profileData.id,
        name: profileData.name || authUser.email?.split('@')[0] || 'User',
        role: profileData.role as UserRole || UserRole.MEMBER,
        avatar: profileData.avatar_url || 'https://ui-avatars.com/api/?name=' + profileData.name?.replace(' ', '+') + '&background=random',
        email: authUser.email || '',
        status: 'online', // Default status on login
        lastSeen: Date.now(),
      };
      return user;
    }
    return null;
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setSupabaseUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        const profile = await fetchProfile(currentSession.user.id);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setSupabaseUser(initialSession?.user ?? null);
        if (initialSession?.user) {
            const profile = await fetchProfile(initialSession.user.id);
            setCurrentUser(profile);
        }
        setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!session && !!currentUser;

  return (
    <AuthContext.Provider value={{ session, supabaseUser, currentUser, isAuthenticated, isLoading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};