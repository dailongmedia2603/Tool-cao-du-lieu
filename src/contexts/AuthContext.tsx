import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  plan_id: string | null;
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Chạy song song việc lấy vai trò và hồ sơ để tối ưu tốc độ
        const [rolesResult, profileResult] = await Promise.all([
          supabase.rpc('get_user_roles'),
          supabase.from('profiles').select('*').eq('id', session.user.id).single()
        ]);

        const { data: userRoles, error: rolesError } = rolesResult;
        if (rolesError) {
          console.error("Error fetching user roles:", rolesError);
          setRoles([]);
        } else {
          setRoles(userRoles.map((r: { role_name: string }) => r.role_name));
        }

        const { data: userProfile, error: profileError } = profileResult;
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
          setProfile(null);
        } else {
          setProfile(userProfile);
        }
      } else {
        // Nếu không có phiên, xóa dữ liệu người dùng
        setRoles([]);
        setProfile(null);
      }
      
      // Đặt trạng thái loading thành false sau khi tất cả các hoạt động bất đồng bộ hoàn tất
      setLoading(false);
    });

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