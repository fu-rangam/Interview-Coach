import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase, LogOut, User, Code, Hammer, Sparkles, Building2, ShoppingBag } from '../components/Icons';
import Loader from '../components/Loader';
import { TECH_ROLES, SERVICE_ROLES } from '../types';
import { useSession } from '../hooks/useSession';
import { useAuth } from '../context/AuthContext';
import { useGuestTracker } from '../hooks/useGuestTracker';
import { ROLE_IMAGES } from '../constants';

const RoleSelection: React.FC = () => {
    const navigate = useNavigate();
    const { startSession } = useSession();
    const { user, signOut } = useAuth();
    const { hasCompletedSession } = useGuestTracker();
    const [processingState, setProcessingState] = useState<{ isActive: boolean; text: string }>({ isActive: false, text: '' });

    // Redirect hooked guests to signup
    React.useEffect(() => {
        if (!user && hasCompletedSession) {
            navigate('/auth?mode=signup');
        }
    }, [user, hasCompletedSession, navigate]);

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

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    const RoleGrid = ({ roles, icon: Icon, title }: { roles: string[], icon: any, title: string }) => (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Icon size={24} />
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-800">{title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                    <button
                        key={role}
                        onClick={() => selectRole(role)}
                        className="group relative bg-indigo-50 p-6 rounded-xl shadow-sm hover:shadow-lg border border-slate-100 hover:border-indigo-500/30 transition-all duration-300 text-left overflow-hidden hover:-translate-y-1 h-32 flex flex-col justify-between"
                    >
                        {ROLE_IMAGES[role] && (
                            <div className="absolute bottom-[-70%] right-[-10%] w-64 h-64 opacity-60 group-hover:opacity-100 transition-opacity">
                                <img src={ROLE_IMAGES[role]} alt={role} className="w-full h-full object-contain" />
                            </div>
                        )}
                        <div className="relative z-10">
                            <h4 className="font-semibold text-neutral-950 group-hover:text-indigo-700 transition-colors leading-tight">{role}</h4>
                        </div>
                        <div className="relative z-10 text-xs font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Start <span className="w-4 h-px bg-slate-200 group-hover:bg-indigo-300 transition-colors"></span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
            {/* Header */}
            <header className="flex-none flex justify-between items-center py-4 px-8 bg-white border-b border-slate-200 z-20">
                <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-xl text-slate-900 tracking-tight">Interview<span className="text-indigo-600">Coach</span></span>
                </div>
                {user ? (
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-600 hidden sm:block">{user.email}</span>
                        </div>
                        <button onClick={handleSignOut} className="text-slate-500 hover:text-rose-600 font-medium text-sm">
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-900 font-medium text-sm">
                        Back Home
                    </button>
                )}
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area - Scrollable */}
                {/* Main Content Area - Scrollable */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 relative">
                    {processingState.isActive && (
                        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all">
                            <Loader />
                            <p className="mt-8 text-slate-800 font-display font-medium text-xl animate-pulse">{processingState.text}</p>
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto">
                        <div className="mb-10">
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">Choose your path.</h1>
                            <p className="text-lg text-slate-500 max-w-2xl">Select a standardized role below to start an industry-calibrated interview session immediately.</p>
                        </div>

                        {/* Custom Role Banner - Staging Layout */}
                        <div className="bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-xl shadow-xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-12 h-12 bg-linear-to-br from-white to-indigo-200 rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                                        <Sparkles size={24} />
                                    </div>
                                    <h2 className="text-2xl font-display font-bold text-slate-100">Have a specific job description?</h2>
                                </div>
                                <p className="text-slate-100 max-w-xl text-lg leading-relaxed ml-16">
                                    Paste a job description to generate a 100% tailored interview session specifically for that role.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/job-description')}
                                className="w-full md:w-auto bg-white hover:bg-blue-50 font-bold py-3 px-8 rounded-lg shadow-sm transition-all transform hover:scale-105 whitespace-nowrap text-slate-900"
                            >
                                Use Custom Job Description
                            </button>
                        </div>

                        <RoleGrid roles={TECH_ROLES} icon={Code} title="Tech & Corporate" />
                        <RoleGrid roles={SERVICE_ROLES} icon={ShoppingBag} title="Service & Operations" />
                    </div>
                </main>
            </div>

            {/* Mobile Fab for Custom Role (Visible only on small screens) */}
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => navigate('/job-description')}
                    className="p-4 bg-white text-slate-900 rounded-full shadow-xl shadow-indigo-300 hover:bg-indigo-700 transition-colors"
                >
                    <Sparkles size={24} />
                </button>
            </div>
        </div>
    );
};

export default RoleSelection;
