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
  fetchProfile: (authUser: SupabaseUser) => Promise<User | null>;
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

  const fetchProfile = async (authUser: SupabaseUser): Promise<User | null> => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('id, name, role, avatar_url')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      // Fallback to a basic user object. This is a safeguard.
      return {
        id: authUser.id,
        name: authUser.email?.split('@')[0] || 'User',
        role: UserRole.MEMBER,
        avatar: `https://ui-avatars.com/api/?name=${authUser.email?.split('@')[0] || 'User'}`,
        email: authUser.email || '',
        status: 'online',
        lastSeen: Date.now(),
      };
    }

    if (profileData) {
      const userName = profileData.name || authUser.email?.split('@')[0] || 'User';
      const user: User = {
        id: profileData.id,
        name: userName,
        role: profileData.role as UserRole || UserRole.MEMBER,
        avatar: profileData.avatar_url || `https://ui-avatars.com/api/?name=${userName.replace(' ', '+')}&background=random`,
        email: authUser.email || '',
        status: 'online',
        lastSeen: Date.now(),
      };
      return user;
    }
    return null;
  };

  useEffect(() => {
    // onAuthStateChange handles the initial session check and any subsequent changes.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      const user = currentSession?.user ?? null;
      setSupabaseUser(user);
      
      if (user) {
        const profile = await fetchProfile(user);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  const isAuthenticated = !!session && !!currentUser;

  return (
    <AuthContext.Provider value={{ session, supabaseUser, currentUser, isAuthenticated, isLoading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};