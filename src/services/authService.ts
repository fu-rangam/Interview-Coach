import { supabase } from './supabase';
import { AuthError, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  data:
    | {
        user: any;
        session: Session | null;
      }
    | {
        user: null;
        session: null;
      };
  error: AuthError | null;
}

export const authService = {
  async signUp(email: string, password: string): Promise<AuthResponse> {
    return await supabase.auth.signUp({
      email,
      password,
    });
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    return await supabase.auth.signOut();
  },

  async getSession(): Promise<{ data: { session: Session | null }; error: AuthError | null }> {
    return await supabase.auth.getSession();
  },

  // Add listener for auth state changes if needed later
};
