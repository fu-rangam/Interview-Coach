import { InterviewSession } from '../types';
import { supabase } from './supabase';

const STORAGE_KEY = 'ai_interview_coach_sessions';

export interface SessionHistory {
    id: string;
    timestamp: number;
    date: string;
    role: string;
    jobDescription?: string;
    score: number;
    questionsCount: number;
    session: InterviewSession;
}

/**
 * Save a completed interview session to Supabase (or localStorage fallback)
 * Returns the ID of the saved session (Supabase ID or LocalStorage timestamp ID)
 */
export async function saveSession(session: InterviewSession, score: number): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Save to Supabase
            const { data, error } = await supabase
                .from('interviews')
                .insert({
                    user_id: user.id,
                    role: session.role,
                    job_description: session.jobDescription,
                    score: score,
                    feedback: JSON.stringify(session), // Store full session as JSON
                    completed_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (error) throw error;
            return data.id;
        } else {
            // Fallback to localStorage for guest users
            return saveToLocalStorage(session, score);
        }
    } catch (error) {
        console.error('Failed to save session:', error);
        // Fallback if Supabase fails (e.g. offline)
        return saveToLocalStorage(session, score);
    }
}

/**
 * Update an existing history/interview session with new data
 */
export async function updateHistorySession(id: string, session: InterviewSession, score: number): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user && id.length > 20) { // Supabase UUID check
            const { error } = await supabase
                .from('interviews')
                .update({
                    score: score,
                    feedback: JSON.stringify(session)
                })
                .eq('id', id);

            if (error) throw error;
        } else {
            // LocalStorage update
            const history = getLocalStorageSessions();
            const index = history.findIndex(s => s.id === id);
            if (index !== -1) {
                history[index].score = score;
                history[index].session = session;
                history[index].questionsCount = session.questions.length;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            }
        }
    } catch (error) {
        console.error('Failed to update session:', error);
    }
}

function saveToLocalStorage(session: InterviewSession, score: number): string {
    const history = getLocalStorageSessions();
    const id = Date.now().toString();
    const newSession: SessionHistory = {
        id,
        timestamp: parseInt(id),
        date: new Date().toLocaleDateString(),
        role: session.role,
        score,
        questionsCount: session.questions.length,
        session
    };
    history.push(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-50)));
    return id;
}

/**
 * Get all saved sessions from Supabase + LocalStorage
 */
export async function getAllSessions(): Promise<SessionHistory[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        let sessions: SessionHistory[] = [];

        if (user) {
            const { data, error } = await supabase
                .from('interviews')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            sessions = data.map((item: any) => {
                const sessionContent = typeof item.feedback === 'string'
                    ? JSON.parse(item.feedback)
                    : item.feedback;

                return {
                    id: item.id,
                    timestamp: new Date(item.created_at).getTime(),
                    date: new Date(item.created_at).toLocaleDateString(),
                    role: item.role,
                    jobDescription: item.job_description,
                    score: item.score || 0,
                    questionsCount: sessionContent?.questions?.length || 0,
                    session: sessionContent
                };
            });

            // If logged in, ONLY return cloud sessions.
            return sessions.sort((a, b) => b.timestamp - a.timestamp);
        }

        // If NOT logged in, return local sessions.
        const localSessions = getLocalStorageSessions();
        return localSessions.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
        console.error('Failed to load sessions:', error);
        return getLocalStorageSessions();
    }
}

function getLocalStorageSessions(): SessionHistory[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Delete a session
 */
export async function deleteSession(id: string): Promise<boolean> {
    try {
        // 1. Determine source based on ID format (UUID vs Timestamp)
        if (id.length > 20) {
            // It's likely a Supabase UUID
            const { error } = await supabase.from('interviews').delete().eq('id', id);
            if (error) {
                console.error('Supabase delete error:', error);
                return false;
            }
            return true;
        } else {
            // It's a local storage ID
            const sessions = getLocalStorageSessions();
            const filtered = sessions.filter(s => s.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return true;
        }
    } catch (error) {
        console.error('Failed to delete session:', error);
        return false;
    }
}


/**
 * Export session as JSON
 */
export async function exportSessionAsJSON(id: string): Promise<string | null> {
    const session = await fetchSessionById(id);
    return session ? JSON.stringify(session, null, 2) : null;
}

/**
 * Fetch a specific session by ID
 */
export async function fetchSessionById(id: string): Promise<SessionHistory | null> {
    // 1. Try Supabase (if it looks like a UUID)
    if (id.length > 20) {
        const { data, error } = await supabase
            .from('interviews')
            .select('*')
            .eq('id', id)
            .single();

        if (!error && data) {
            const sessionContent = typeof data.feedback === 'string'
                ? JSON.parse(data.feedback)
                : data.feedback;

            return {
                id: data.id,
                timestamp: new Date(data.created_at).getTime(),
                date: new Date(data.created_at).toLocaleDateString(),
                role: data.role,
                jobDescription: data.job_description,
                score: data.score || 0,
                questionsCount: sessionContent?.questions?.length || 0,
                session: sessionContent
            };
        }
    }

    // 2. Fallback to LocalStorage
    const sessions = getLocalStorageSessions();
    return sessions.find(s => s.id === id) || null;
}
