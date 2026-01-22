import { supabase } from './supabase';
import { InterviewSession } from '../types';

export interface DbSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  data: InterviewSession;
}

export const sessionService = {
  /**
   * Creates a new session in Supabase
   */
  async createSession(sessionData: InterviewSession): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          data: sessionData,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  },

  /**
   * Updates an existing session
   */
  async updateSession(id: string, sessionData: InterviewSession): Promise<void> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          data: sessionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating session:', error);
    }
  },

  /**
   * Fetches a session by ID
   */
  async getSession(id: string): Promise<InterviewSession | null> {
    try {
      const { data, error } = await supabase.from('sessions').select('data').eq('id', id).single();

      if (error) throw error;
      return data?.data || null;
    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  },
};
