import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { exportUserData, deleteUserAccount } from '../services/userDataService';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export const UserDataRights: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleExportData = async () => {
    setIsLoading(true);
    setStatus('Gathering data...');
    try {
      const exportBundle = await exportUserData();

      // 4. Trigger Download
      const dataStr = JSON.stringify(exportBundle, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `my-interview-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus('Export complete!');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setStatus('Export failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you ABSOLUTELY sure? This will permanently delete your account, session history, and logs. This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setStatus('Deleting account...');

    try {
      await deleteUserAccount();
      await authService.signOut();

      setStatus('Account content deleted. Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error(error);
      setStatus('Deletion failed. Contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-rangam-navy mb-4 font-display">Data & Privacy</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rangam-blue">
            <Download size={24} />
            <h3 className="font-semibold text-lg">Export Data</h3>
          </div>
          <p className="text-sm text-slate-600">
            Download a copy of all your interview sessions and security logs in JSON format.
          </p>
          <Button
            onClick={handleExportData}
            disabled={isLoading}
            variant="ghost"
            className="w-full justify-start pl-0 hover:bg-transparent hover:text-rangam-blue/80 text-rangam-blue"
            aria-label="Export my data"
          >
            {isLoading && status?.includes('Gathering') ? (
              <Loader2 className="animate-spin mr-2" />
            ) : null}
            <span className="underline underline-offset-4">Export My Data</span>
          </Button>
        </div>

        {/* Delete Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle size={24} />
            <h3 className="font-semibold text-lg">Delete Account</h3>
          </div>
          <p className="text-sm text-slate-600">
            Permanently remove your account and all associated data. This action is irreversible.
          </p>
          <Button
            onClick={handleDeleteAccount}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
            aria-label="Delete my account"
          >
            {isLoading && status?.includes('Deleting') ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Trash2 size={18} className="mr-2" />
            )}
            Delete Account
          </Button>
        </div>
      </div>

      {status && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-center text-sm text-rangam-navy">
          {status}
        </div>
      )}
    </Card>
  );
};
