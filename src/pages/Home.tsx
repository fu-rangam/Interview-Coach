import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from '../components/Icons';
import { useGuestTracker } from '../hooks/useGuestTracker';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { hasCompletedSession } = useGuestTracker();
    const { user } = useAuth();

    const handleStart = () => {
        // If user is guest AND has already done a session -> force auth
        if (!user && hasCompletedSession) {
            navigate('/auth?mode=signup'); // Direct new hook to signup
        } else {
            navigate('/select-role');
        }
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            <div className="max-w-3xl text-center z-10">
                <div className="inline-flex items-center justify-center p-5 bg-white rounded-2xl mb-8 shadow-lg shadow-indigo-100 ring-1 ring-indigo-50">
                    <Briefcase className="w-12 h-12 text-indigo-600" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
                    AI Interview Coach
                </h1>
                <p className="text-xl text-slate-600 mb-12 max-w-xl mx-auto leading-relaxed">
                    Master your interview skills with real-time AI feedback. Practice key questions, refine your answers, and build confidence.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleStart}
                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-medium rounded-xl transition-all transform hover:scale-105 shadow-xl shadow-indigo-200 ring-4 ring-indigo-50"
                    >
                        {(!user && hasCompletedSession) ? "Create Account to Continue" : "Start Practicing"}
                    </button>
                    {user && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-10 py-4 bg-white hover:bg-slate-50 text-slate-700 text-xl font-medium rounded-xl transition-all transform hover:scale-105 shadow-md border border-slate-200"
                        >
                            View History
                        </button>
                    )}
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-fuchsia-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
    );
};

export default Home;
