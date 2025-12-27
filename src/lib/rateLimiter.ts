// Simple rate limiter: max 10 API calls per 60 seconds
const callLog: number[] = [];

export function checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old entries
    while (callLog.length > 0 && callLog[0] < oneMinuteAgo) {
        callLog.shift();
    }

    if (callLog.length >= 10) {
        return false; // Rate limit exceeded
    }

    callLog.push(now);
    return true;
}
