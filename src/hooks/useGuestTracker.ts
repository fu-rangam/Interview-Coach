import { useState, useEffect } from 'react';

const GUEST_COMPLETED_SESSION_KEY = 'ai_coach_guest_completed';

export const useGuestTracker = () => {
    const [hasCompletedSession, setHasCompletedSession] = useState<boolean>(false);

    useEffect(() => {
        const stored = localStorage.getItem(GUEST_COMPLETED_SESSION_KEY);
        setHasCompletedSession(!!stored);
    }, []);

    const markSessionComplete = () => {
        localStorage.setItem(GUEST_COMPLETED_SESSION_KEY, 'true');
        setHasCompletedSession(true);
    };

    const clearGuestHistory = () => {
        localStorage.removeItem(GUEST_COMPLETED_SESSION_KEY);
        setHasCompletedSession(false);
    };

    return {
        hasCompletedSession,
        markSessionComplete,
        clearGuestHistory
    };
};
