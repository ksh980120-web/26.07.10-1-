import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../utils/authErrorMessages';
import { AppUser, AppRole } from '../types';

/**
 * Authentication & User Profile Service - Highly Structured Edition
 * Organized into dedicated responsibilities: Session, SignIn, SignUp, Profile, Role, and Password.
 */
export const authService = {
  // =========================================================================
  // BACKWARDS-COMPATIBILITY WRAPPER METHODS
  // =========================================================================
  onAuthStateChange(callback: (user: AppUser | null) => void) {
    return authService.session.onAuthStateChange(callback);
  },

  async signIn(email: string, password: string): Promise<{ data: any; error: any; errorMessage?: string }> {
    return authService.signInService.emailPassword(email, password);
  },

  async signUp(email: string, password: string, name: string, phone: string): Promise<{ data: any; error: any; errorMessage?: string }> {
    return authService.signUpService.emailPassword(email, password, name, phone);
  },

  async signUpAnonymously(name: string, phone: string): Promise<{ data: any; error: any; errorMessage?: string }> {
    return authService.signUpService.anonymous(name, phone);
  },

  async signOut(): Promise<{ error: any }> {
    return authService.session.signOut();
  },

  async resetPassword(email: string): Promise<{ success: boolean; error: any; errorMessage?: string }> {
    return authService.passwordService.reset(email);
  },

  // =========================================================================
  // MODULE 1: SESSION & LISTENER MANAGEMENT (세션 관리)
  // =========================================================================
  session: {
    /**
     * Listen to auth state changes and fetch profile data from DB on transition
     */
    onAuthStateChange(callback: (user: AppUser | null) => void) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          try {
            const profile = await authService.profile.getProfile(session.user.id);
            const role = await authService.role.getRole(session.user.id);

            callback({
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.user_metadata?.name || '성도',
              role: role,
              phone: profile?.phone || session.user.user_metadata?.phone || ''
            });
          } catch (err: any) {
            console.error("=== Error resolving auth state change ===", err.message);
            callback(null);
          }
        } else {
          callback(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    },

    /**
     * Get active Supabase session
     */
    async getSession() {
      return supabase.auth.getSession();
    },

    /**
     * Log out current session
     */
    async signOut(): Promise<{ error: any }> {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("=== Sign Out Error ===", error.message);
        }
        return { error };
      } catch (err: any) {
        console.error("=== Sign Out Unexpected Exception ===", err.message);
        return { error: err };
      }
    }
  },

  // =========================================================================
  // MODULE 2: SIGN IN SERVICES (로그인 서비스)
  // =========================================================================
  signInService: {
    /**
     * Log in via email and password
     */
    async emailPassword(email: string, password: string): Promise<{ data: any; error: any; errorMessage?: string }> {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          console.error("=== Supabase Auth Sign In Error ===", error.message);
          return { data: null, error, errorMessage: getAuthErrorMessage(error) };
        }

        return { data, error: null };
      } catch (err: any) {
        console.error("=== Unexpected Exception during Sign In ===", err.message);
        return { data: null, error: err, errorMessage: getAuthErrorMessage(err) };
      }
    }
  },

  // =========================================================================
  // MODULE 3: SIGN UP SERVICES (회원가입 서비스)
  // =========================================================================
  signUpService: {
    /**
     * Sign up a new user via email and password.
     * Note: Client-side profile insertion has been COMPLETELY removed.
     * Profile creation is handled exclusively by the PostgreSQL database trigger "handle_new_user"
     * upon insert into auth.users. This avoids race conditions and RLS authentication bottlenecks.
     */
    async emailPassword(email: string, password: string, name: string, phone: string): Promise<{ data: any; error: any; errorMessage?: string }> {
      const trimmedEmail = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return { data: null, error: new Error('invalid format'), errorMessage: '올바른 이메일 주소를 입력해주세요.' };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { name: name.trim(), phone: phone.trim() }
          }
        });

        if (error) {
          console.error("=== Supabase Auth Sign Up Error ===", error.message);
          return { data: null, error, errorMessage: `[Error ${error.code || 'NoCode'}] ${error.message}` };
        }

        return { data, error: null };
      } catch (err: any) {
        console.error("=== Unexpected Exception during Sign Up ===", err.message);
        return { data: null, error: err, errorMessage: `[Error Exception] ${err.message}` };
      }
    },

    /**
     * Sign up anonymously (Easy Instant Signup).
     * No client-side profiles insertion here either; database trigger manages profiles automatically.
     */
    async anonymous(name: string, phone: string): Promise<{ data: any; error: any; errorMessage?: string }> {
      try {
        const { data, error } = await supabase.auth.signInAnonymously({
          options: {
            data: {
              name: name.trim(),
              phone: phone.trim(),
              is_easy_account: true
            }
          }
        });

        if (error) {
          console.error("=== Supabase Auth Anonymous Sign In Error ===", error.message);
          return { data: null, error, errorMessage: getAuthErrorMessage(error) };
        }

        return { data, error: null };
      } catch (err: any) {
        console.error("=== Unexpected Exception during Anonymous Sign In ===", err.message);
        return { data: null, error: err, errorMessage: `[Exception] ${err.message}` };
      }
    }
  },

  // =========================================================================
  // MODULE 4: PROFILE MANAGEMENT (프로필 조회 & 관리)
  // =========================================================================
  profile: {
    /**
     * Retrieve a user's profile from the public.profiles table
     */
    async getProfile(userId: string) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error("=== Profile Query Error ===", error.message);
          return null;
        }
        return profile;
      } catch (err: any) {
        console.error("=== Exception in getProfile ===", err.message);
        return null;
      }
    },

    /**
     * Update an existing user's profile
     */
    async updateProfile(userId: string, updates: { name?: string; phone?: string }) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .maybeSingle();

        if (error) {
          console.error("=== Profile Update Error ===", error.message);
          return { data: null, error };
        }
        return { data, error: null };
      } catch (err: any) {
        console.error("=== Exception in updateProfile ===", err.message);
        return { data: null, error: err };
      }
    },

    /**
     * Retrieve all user profiles from public.profiles
     */
    async fetchUsers(): Promise<AppUser[]> {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error("=== Error fetching profiles ===", error.message);
          return [];
        }
        return (data || []).map(p => ({
          id: p.id,
          name: p.name || '성도',
          email: p.email || '',
          role: p.role || 'member',
          phone: p.phone || ''
        }));
      } catch (err: any) {
        console.error("=== Exception in fetchUsers ===", err.message);
        return [];
      }
    }
  },

  // =========================================================================
  // MODULE 5: ROLES & PERMISSIONS (권한 및 권한 검사)
  // =========================================================================
  role: {
    /**
     * Retrieve a user's role from the database
     */
    async getRole(userId: string): Promise<AppRole> {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (error || !data) {
          return 'member' as AppRole;
        }
        return data.role as AppRole;
      } catch (err) {
        return 'member' as AppRole;
      }
    },

    /**
     * Check if a role meets a minimum role level requirement
     * Hierarchy: master > pastor > admin > member > guest
     */
    checkPermission(userRole: AppRole, requiredRole: AppRole): boolean {
      const hierarchy: { [key in AppRole]: number } = {
        master: 4,
        pastor: 3,
        admin: 2,
        member: 1,
        guest: 0
      };

      const userScore = hierarchy[userRole] || 0;
      const requiredScore = hierarchy[requiredRole] || 0;

      return userScore >= requiredScore;
    }
  },

  // =========================================================================
  // MODULE 6: PASSWORD SERVICE (비밀번호 관련 서비스)
  // =========================================================================
  passwordService: {
    /**
     * Request a password reset email
     */
    async reset(email: string): Promise<{ success: boolean; error: any; errorMessage?: string }> {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin
        });

        if (error) {
          console.error("=== Password Reset Request Error ===", error.message);
          return { success: false, error, errorMessage: getAuthErrorMessage(error) };
        }

        return { success: true, error: null };
      } catch (err: any) {
        console.error("=== Password Reset Request Unexpected Exception ===", err.message);
        return { success: false, error: err, errorMessage: getAuthErrorMessage(err) };
      }
    }
  }
};
