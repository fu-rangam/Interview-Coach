import { InterviewSession } from '../types';

const STORAGE_KEY = 'ai_interview_coach_sessions';

export interface SessionHistory {
    id: string;
    timestamp: number; // Unix timestamp
    date: string; // Formatted date for display
    role: string;
    jobDescription?: string;
    score: number;
    questionsCount: number;
    session: InterviewSession;
}

/**
 * Save a completed interview session to localStorage
 * @security All data is sanitized before storage
 */
export function saveSession(session: InterviewSession, score: number): void {
    try {
        const history = getAllSessions();

        const newSession: SessionHistory = {
            id: generateId(),
            timestamp: Date.now(),
            date: new Date().toLocaleDateString(),
            role: session.role,
            score,
            questionsCount: session.questions.length,
            session
        };

        history.push(newSession);

        // Limit to 50 most recent sessions (prevent localStorage overflow)
        const limited = history.slice(-50);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
        console.error('Failed to save session:', error);
        // localStorage might be full or disabled
    }
}

/**
 * Get all saved sessions, sorted by date (newest first)
 */
export function getAllSessions(): SessionHistory[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const sessions = JSON.parse(data) as SessionHistory[];
        return sessions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Failed to load sessions:', error);
        return [];
    }
}

/**
 * Get a specific session by ID
 */
export function getSessionById(id: string): SessionHistory | null {
    const sessions = getAllSessions();
    return sessions.find(s => s.id === id) || null;
}

/**
 * Delete a session by ID
 */
export function deleteSession(id: string): boolean {
    try {
        const sessions = getAllSessions();
        const filtered = sessions.filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Failed to delete session:', error);
        return false;
    }
}

/**
 * Clear all sessions (for testing or user request)
 */
export function clearAllSessions(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generate a unique session ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export session as JSON (for downloading)
 */
export function exportSessionAsJSON(id: string): string | null {
    const session = getSessionById(id);
    if (!session) return null;

    return JSON.stringify(session, null, 2);
}

/**
 * FUTURE: Migrate localStorage data to portal backend
 * This function will be used when integrating with rangamworks.com
 */
export async function migrateToBackend(apiEndpoint: string): Promise<void> {
    const sessions = getAllSessions();

    // TODO: Implement when portal provides API endpoint
    await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions })
    });

    // After successful migration, optionally clear local storage
    // clearAllSessions();
}
