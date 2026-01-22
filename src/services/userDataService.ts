import { supabase } from './supabase';
import { getAllSessions } from './storageService';
import { getAuditLogs, logAuditEvent } from './auditLogger';

export interface ExportBundle {
    exportedAt: string;
    sessions: any[];
    auditLogs: any[];
}

export const exportUserData = async (): Promise<ExportBundle> => {
    // 1. Fetch all sessions
    const sessions = await getAllSessions();

    // 2. Fetch all audit logs
    const logs = await getAuditLogs();

    // 3. Bundle into a JSON
    const exportBundle: ExportBundle = {
        exportedAt: new Date().toISOString(),
        sessions,
        auditLogs: logs,
    };

    await logAuditEvent('DATA_EXPORTED', { size: JSON.stringify(exportBundle).length });

    return exportBundle;
};

export const deleteUserAccount = async (): Promise<void> => {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Log the intent (last log before death)
    await logAuditEvent('ACCOUNT_DELETION_REQUESTED');

    // 2. Delete data
    await supabase.from('interviews').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.from('audit_logs').delete().eq('user_id', user.id);
};
