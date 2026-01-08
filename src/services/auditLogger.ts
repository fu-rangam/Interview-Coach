import { supabase } from './supabase';
import { encrypt, decrypt } from '../utils/encryption';

const AUDIT_STORAGE_KEY = 'ai_audit_logs_local';

export interface AuditEvent {
    id?: string;
    action: string;
    details?: any;
    timestamp: number;
    userId?: string; // If authenticated
}

/**
 * Log a security or compliance event.
 * - Authenticated: Persists to Supabase `audit_logs` table (immutable).
 * - Guest: Persists to encrypted LocalStorage (best effort).
 */
export async function logAuditEvent(action: string, details?: any) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Cloud Logging (Supabase)
            const { error } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: user.id,
                    action: action,
                    details: details ? JSON.stringify(details) : null,
                });

            if (error) {
                console.error("[Audit] Cloud log failed:", error);
            }
        } else {
            // Guest Logging (Local Encrypted)
            logToLocalStorage(action, details);
        }
    } catch (error) {
        console.error("[Audit] Logging failed:", error);
    }
}

function logToLocalStorage(action: string, details?: any) {
    try {
        const existingData = localStorage.getItem(AUDIT_STORAGE_KEY);
        let logs: AuditEvent[] = [];

        if (existingData) {
            const decrypted = decrypt(existingData);
            if (Array.isArray(decrypted)) {
                logs = decrypted;
            }
        }

        const newEvent: AuditEvent = {
            id: Date.now().toString(),
            action,
            details,
            timestamp: Date.now()
        };

        logs.push(newEvent);

        // Limit local logs to prevent overflow (e.g., last 100 events)
        if (logs.length > 100) {
            logs = logs.slice(logs.length - 100);
        }

        const ciphertext = encrypt(logs);
        localStorage.setItem(AUDIT_STORAGE_KEY, ciphertext);

    } catch (e) {
        console.error("[Audit] Local save failed", e);
    }
}

/**
 * Retrieve audit logs (Admin/User export purpose)
 */
export async function getAuditLogs(): Promise<AuditEvent[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map((item: any) => ({
                id: item.id,
                action: item.action,
                details: item.details,
                timestamp: new Date(item.created_at).getTime(),
                userId: item.user_id
            }));
        }

        // Guest:
        const existingData = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (existingData) {
            const result = decrypt(existingData);
            return Array.isArray(result) ? result : [];
        }
        return [];

    } catch (error) {
        console.error("Failed to fetch audit logs", error);
        return [];
    }
}
