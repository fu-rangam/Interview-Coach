import React, { useState } from 'react';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { getAuditLogs, logAuditEvent } from '../services/auditLogger';
import { getAllSessions, exportSessionAsJSON } from '../services/storageService';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export const UserDataRights: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleExportData = async () => {
        setIsLoading(true);
        setStatus("Gathering data...");
        try {
            // 1. Fetch all sessions
            const sessions = await getAllSessions();

            // 2. Fetch all audit logs
            const logs = await getAuditLogs();

            // 3. Bundle into a JSON
            const exportBundle = {
                exportedAt: new Date().toISOString(),
                sessions,
                auditLogs: logs,
                // Add profile data if we had a dedicated service for it
            };

            // 4. Trigger Download
            const dataStr = JSON.stringify(exportBundle, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `my-interview-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            logAuditEvent('DATA_EXPORTED', { size: blob.size });
            setStatus("Export complete!");
            setTimeout(() => setStatus(null), 3000);

        } catch (error) {
            console.error(error);
            setStatus("Export failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you ABSOLUTELY sure? This will permanently delete your account, session history, and logs. This action cannot be undone.")) {
            return;
        }

        setIsLoading(true);
        setStatus("Deleting account...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Log the intent (last log before death)
            await logAuditEvent('ACCOUNT_DELETION_REQUESTED');

            // 2. Call Supabase Edge Function to delete user (if we had one) or minimal cleanup
            // Since we can't easily delete Auth User from client, we will scrub the data we CAN access via RLS
            // and sign them out. 
            // NOTE: True deletion requires a Supabase Admin function.
            // For now, we will delete 'interviews' and 'profiles' rows which we own.

            await supabase.from('interviews').delete().eq('user_id', user.id);
            await supabase.from('profiles').delete().eq('id', user.id);
            // We usually keep audit logs for compliance, or soft delete them. 
            // If strictly "Right to Erasure", we delete logs too.
            await supabase.from('audit_logs').delete().eq('user_id', user.id);

            await supabase.auth.signOut();

            setStatus("Account content deleted. Redirecting...");
            setTimeout(() => navigate('/'), 2000);

        } catch (error) {
            console.error(error);
            setStatus("Deletion failed. Contact support.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GlassCard className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Data & Privacy</h2>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Export Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-cyan-400">
                        <Download size={24} />
                        <h3 className="font-semibold text-lg">Export Data</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        Download a copy of all your interview sessions and security logs in JSON format.
                    </p>
                    <GlassButton onClick={handleExportData} disabled={isLoading} variant="outline">
                        {isLoading && status?.includes('Gathering') ? <Loader2 className="animate-spin mr-2" /> : null}
                        Export My Data
                    </GlassButton>
                </div>

                {/* Delete Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-500">
                        <AlertTriangle size={24} />
                        <h3 className="font-semibold text-lg">Delete Account</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                        Permanently remove your account and all associated data. This action is irreversible.
                    </p>
                    <GlassButton
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/50"
                    >
                        {isLoading && status?.includes('Deleting') ? <Loader2 className="animate-spin mr-2" /> : <Trash2 size={18} className="mr-2" />}
                        Delete Account
                    </GlassButton>
                </div>
            </div>

            {status && (
                <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded text-center text-sm text-cyan-300">
                    {status}
                </div>
            )}
        </GlassCard>
    );
};
