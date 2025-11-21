import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase } from '../components/Icons';
import Loader from '../components/Loader';
import { JOB_ROLES } from '../types';
import { useSession } from '../hooks/useSession';

const RoleSelection: React.FC = () => {
    const navigate = useNavigate();
    const { startSession } = useSession();
    const [processingState, setProcessingState] = useState<{ isActive: boolean; text: string }>({ isActive: false, text: '' });

    const selectRole = async (role: string) => {
        setProcessingState({ isActive: true, text: 'Preparing your interview...' });
        try {
            await startSession(role);
            navigate('/interview');
        } catch (e) {
            alert("Failed to generate questions. Please try again.");
        } finally {
            setProcessingState({ isActive: false, text: '' });
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full max-w-5xl mx-auto pb-12">
                    <header className="flex justify-between items-center py-8 mb-8">
                        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/50">
                            <Home size={20} /> Back Home
                        </button>
                    </header>

                    <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center text-slate-800">Select your target role</h2>
                    <p className="text-center text-slate-500 mb-8 max-w-lg mx-auto">Choose a field to generate specific interview questions tailored to industry standards.</p>

                    <div className="flex justify-center mb-12">
                        <button
                            onClick={() => navigate('/job-description')}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm"
                        >
                            <Briefcase size={18} />
                            Paste Job Description Instead
                        </button>
                    </div>

                    {processingState.isActive ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader />
                            <p className="mt-8 text-slate-600 font-medium text-lg animate-pulse">{processingState.text}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {JOB_ROLES.map((role) => (
                                <button
                                    key={role}
                                    onClick={() => selectRole(role)}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-indigo-100 hover:shadow-md transition-all text-left group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-700 mb-1 transition-colors">{role}</h3>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">5 Questions</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
