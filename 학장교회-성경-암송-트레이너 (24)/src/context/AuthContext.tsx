import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, AppUser, AppRole } from '../lib/supabase';
import { authService } from '../services/authService';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  userRole: AppRole | null;
  currentUserId: string;
  currentUserName: string;
  currentUserPhone: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any; errorMessage?: string }>;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ data: any; error: any; errorMessage?: string }>;
  signUpAnonymously: (name: string, phone: string) => Promise<{ data: any; error: any; errorMessage?: string }>;
  signOut: () => Promise<{ error: any }>;
  setGuestSession: (guestUser: AppUser) => void;
  clearGuestSession: () => void;
  updateProfile: (name: string, phone: string, password?: string, role?: AppRole) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Computed properties
  const isAuthenticated = !!user && user.id !== 'guest';
  const userRole = user ? user.role : null;
  const currentUserId = user ? user.id : 'guest';
  const currentUserName = user ? user.name : '성도';
  const currentUserPhone = user ? user.phone || '' : '';

  // Synchronously initialize state from sessionStorage to avoid flickering
  useEffect(() => {
    const cachedAuth = sessionStorage.getItem('hagah_user_authenticated') === 'true';
    const cachedId = sessionStorage.getItem('hagah_user_id');
    const cachedRole = sessionStorage.getItem('hagah_user_role') as AppRole | null;
    const cachedName = sessionStorage.getItem('hagah_user_name');
    const cachedPhone = sessionStorage.getItem('hagah_user_phone');

    if (cachedId && cachedRole && cachedName && (cachedAuth || cachedRole === 'guest')) {
      setUser({
        id: cachedId,
        email: cachedRole === 'guest' ? 'guest@church.com' : (cachedId.includes('easy_') ? `easy_${cachedId.slice(0, 8)}@church.local` : ''),
        name: cachedName,
        role: cachedRole,
        phone: cachedPhone || ''
      });
    }
  }, []);

  useEffect(() => {
    // 1. Single central listener for session changes
    const unsubscribe = authService.onAuthStateChange((appUser) => {
      setLoading(true);
      if (appUser) {
        setUser(appUser);
        // Sync to cache
        sessionStorage.setItem('hagah_user_authenticated', 'true');
        sessionStorage.setItem('hagah_user_id', appUser.id);
        sessionStorage.setItem('hagah_user_role', appUser.role);
        sessionStorage.setItem('hagah_user_name', appUser.name);
        sessionStorage.setItem('hagah_user_phone', appUser.phone || '');
      } else {
        // If not logged in and there's no guest session, clear caches
        const isCurrentlyGuest = sessionStorage.getItem('hagah_user_role') === 'guest';
        if (!isCurrentlyGuest) {
          setUser(null);
          sessionStorage.removeItem('hagah_user_authenticated');
          sessionStorage.removeItem('hagah_user_role');
          sessionStorage.removeItem('hagah_user_id');
          sessionStorage.removeItem('hagah_user_name');
          sessionStorage.removeItem('hagah_user_phone');
          sessionStorage.removeItem('hagah_admin_auth');
        }
      }
      setLoading(false);
    });

    // Check actual session from Supabase client on mount
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          let { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileErr) {
            console.warn("Profiles fetch error during init session:", profileErr);
          }

          // Fallback profile creation to ensure "회원정보 누락 방지"
          if (!profile) {
            console.log("Profile missing, creating fallback profile for user:", session.user.id);
            const defaultName = session.user.user_metadata?.name || '성도';
            const defaultPhone = session.user.user_metadata?.phone || '';
            const newProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name: defaultName,
              role: 'member',
              phone: defaultPhone
            };
            const { data: upsertedProfile, error: upsertError } = await supabase
              .from('profiles')
              .upsert(newProfile)
              .select()
              .maybeSingle();

            if (!upsertError && upsertedProfile) {
              profile = upsertedProfile;
            } else {
              profile = newProfile;
            }
          }

          const resolvedRole = (profile?.role || 'member') as AppRole;
          const resolvedUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.name || session.user.user_metadata?.name || '성도',
            role: resolvedRole,
            phone: profile?.phone || session.user.user_metadata?.phone || ''
          };

          setUser(resolvedUser);
          sessionStorage.setItem('hagah_user_authenticated', 'true');
          sessionStorage.setItem('hagah_user_id', resolvedUser.id);
          sessionStorage.setItem('hagah_user_role', resolvedUser.role);
          sessionStorage.setItem('hagah_user_name', resolvedUser.name);
          sessionStorage.setItem('hagah_user_phone', resolvedUser.phone || '');
        }
      } catch (err) {
        console.error("Error verifying initial auth session:", err);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await authService.signIn(email, password);
    setLoading(false);
    return result;
  };

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    setLoading(true);
    const result = await authService.signUp(email, password, name, phone);
    setLoading(false);
    return result;
  };

  const signUpAnonymously = async (name: string, phone: string) => {
    setLoading(true);
    const result = await authService.signUpAnonymously(name, phone);
    setLoading(false);
    return result;
  };

  const signOut = async () => {
    setLoading(true);
    const result = await authService.signOut();
    setUser(null);
    sessionStorage.removeItem('hagah_user_authenticated');
    sessionStorage.removeItem('hagah_user_role');
    sessionStorage.removeItem('hagah_user_id');
    sessionStorage.removeItem('hagah_user_name');
    sessionStorage.removeItem('hagah_user_phone');
    sessionStorage.removeItem('hagah_admin_auth');
    setLoading(false);
    return result;
  };

  const setGuestSession = (guestUser: AppUser) => {
    setUser(guestUser);
    sessionStorage.setItem('hagah_user_authenticated', 'false');
    sessionStorage.setItem('hagah_user_id', guestUser.id);
    sessionStorage.setItem('hagah_user_role', guestUser.role);
    sessionStorage.setItem('hagah_user_name', guestUser.name);
    sessionStorage.setItem('hagah_user_phone', guestUser.phone || '');
  };

  const clearGuestSession = () => {
    setUser(null);
    sessionStorage.removeItem('hagah_user_authenticated');
    sessionStorage.removeItem('hagah_user_role');
    sessionStorage.removeItem('hagah_user_id');
    sessionStorage.removeItem('hagah_user_name');
    sessionStorage.removeItem('hagah_user_phone');
    sessionStorage.removeItem('hagah_admin_auth');
  };

  const updateProfile = async (name: string, phone: string, password?: string, role?: AppRole) => {
    try {
      if (!user || user.id === 'guest') {
        return { success: false, message: '로그인 정보가 유효하지 않습니다.' };
      }

      const updateData: any = { name: name.trim(), phone: phone.trim() };
      if (role) {
        updateData.role = role;
      }

      // 1. Update the profiles table in Supabase
      const { error: dbError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (dbError) {
        throw dbError;
      }

      // 2. If password is provided, update password via Supabase Auth
      if (password && password.trim()) {
        const { error: authError } = await supabase.auth.updateUser({
          password: password.trim()
        });
        if (authError) {
          throw authError;
        }
      }

      // 3. Update the local React state and sessionStorage cache
      const updatedUser: AppUser = {
        ...user,
        name: name.trim(),
        phone: phone.trim()
      };
      if (role) {
        updatedUser.role = role;
        sessionStorage.setItem('hagah_user_role', role);
      }

      setUser(updatedUser);
      sessionStorage.setItem('hagah_user_name', name.trim());
      sessionStorage.setItem('hagah_user_phone', phone.trim());

      return { success: true, message: '성공적으로 프로필이 수정되었습니다!' };
    } catch (err: any) {
      console.error("Error updating profile:", err);
      return { success: false, message: err.message || '프로필 수정 도중 오류가 발생했습니다.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      userRole,
      currentUserId,
      currentUserName,
      currentUserPhone,
      loading,
      signIn,
      signUp,
      signUpAnonymously,
      signOut,
      setGuestSession,
      clearGuestSession,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
