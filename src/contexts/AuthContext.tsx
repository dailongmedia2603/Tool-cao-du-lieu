import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  first_name: string | null;
  last_name: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRoles = async (userId: string) => {
    const profilePromise = supabase.from('profiles').select('first_name, last_name').eq('id', userId).single();
    const rolesPromise = supabase.rpc('get_user_roles');
    
    const [profileResult, rolesResult] = await Promise.all([profilePromise, rolesPromise]);

    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      console.error("Error fetching profile:", profileResult.error);
      setProfile(null);
    } else {
      setProfile(profileResult.data);
    }

    if (rolesResult.error) {
      console.error("Error fetching user roles:", rolesResult.error);
      setRoles([]);
    } else {
      setRoles(rolesResult.data.map((r: { role_name: string }) => r.role_name));
    }
  };

  useEffect(() => {
    const setData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfileAndRoles(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileAndRoles(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
      // Ensure loading is false after auth state change
      if (loading) setLoading(false);
    });

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    roles,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};