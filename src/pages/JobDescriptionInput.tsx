import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase } from '../components/Icons';
import { sanitizeInput, truncateInput } from '../lib/sanitize';
import { useSession } from '../hooks/useSession';
import Loader from '../components/Loader';

import { useGuestTracker } from '../hooks/useGuestTracker';
import { useAuth } from '../context/AuthContext';

const MAX_JD_LENGTH = 3000;

const JobDescriptionInput: React.FC = () => {
    const navigate = useNavigate();
    const { startSession } = useSession();
    const { hasCompletedSession } = useGuestTracker();
    const { user } = useAuth();
    const [jobDescription, setJobDescription] = useState('');
    const [role, setRole] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect hooked guests to signup
    React.useEffect(() => {
        if (!user && hasCompletedSession) {
            navigate('/auth?mode=signup');
        }
    }, [user, hasCompletedSession, navigate]);

    const handleSubmit = async () => {
        if (!role.trim() || jobDescription.length < 50) return;

        setIsProcessing(true);
        const sanitizedJD = sanitizeInput(truncateInput(jobDescription, MAX_JD_LENGTH));
        const sanitizedRole = sanitizeInput(truncateInput(role, 100));

        try {
            await startSession(sanitizedRole, sanitizedJD);
            navigate('/interview');
        } catch (error) {
            setError("Failed to generate questions. Please try again.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full max-w-3xl mx-auto pb-12">
                    <header className="flex justify-between items-center py-8 mb-8">
                        <button onClick={() => navigate('/select-role')} className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/50">
                            <Briefcase size={20} /> Back to Roles
                        </button>
                        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/50">
                            <Home size={20} /> Home
                        </button>
                    </header>

                    <div className="bg-blue-50/50 rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
                        <h2 className="text-3xl font-bold mb-2 text-slate-800">Custom Job Interview</h2>
                        <p className="text-slate-500 mb-8">Paste a job description to generate tailored interview questions.</p>

                        {error && (
                            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center justify-center">
                                {error}
                            </div>
                        )}

                        {isProcessing ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <Loader />
                                <p className="mt-8 text-slate-600 font-medium text-lg animate-pulse">Analyzing job description...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Job Title / Role</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Senior Product Manager"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="bg-white w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#376497] focus:border-[#376497] outline-none transition-all"
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Job Description</label>
                                    <textarea
                                        placeholder="Paste the full job description here..."
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        maxLength={MAX_JD_LENGTH}
                                        className="bg-white w-full h-64 p-4 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-[#376497] focus:border-[#376497] outline-none transition-all"
                                    />
                                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                                        <span>Min 50 characters</span>
                                        <span className={jobDescription.length >= MAX_JD_LENGTH ? "text-red-500" : ""}>
                                            {jobDescription.length} / {MAX_JD_LENGTH}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!role.trim() || jobDescription.length < 50}
                                    className="w-full py-4 bg-[#376497] hover:bg-[#25466c] text-white font-medium rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-blue-200"
                                >
                                    Generate Custom Questions
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDescriptionInput;
