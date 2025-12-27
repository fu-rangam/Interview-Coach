import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuestTracker } from '../hooks/useGuestTracker';
import { useAuth } from '../context/AuthContext';

import { ROLE_IMAGES } from '../lib/constants';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { hasCompletedSession } = useGuestTracker();
    const { user } = useAuth();

    // Preload images for RoleSelection page
    useEffect(() => {
        Object.values(ROLE_IMAGES).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }, []);

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
            <div className="max-w-3xl text-center z-10 flex flex-col items-center">
                <div className="mb-8 p-6">
                    <img
                        src="/ready2work.svg"
                        alt="Ready2Work"
                        className="h-24 w-auto object-contain"
                    />
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
                    Interview Coach
                </h1>
                <p className="text-xl text-slate-600 mb-12 max-w-xl mx-auto leading-relaxed">
                    Master your interview skills with real-time AI feedback. Practice key questions, refine your answers, and build confidence.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleStart}
                        className="px-10 py-4 bg-[#376497] border-2 border-transparent hover:bg-transparent hover:text-[#0B8039] hover:border-[#0B8039] text-white font-semibold rounded-lg shadow-lg shadow-blue-900/10 transition-all hover:-translate-y-1"
                    >
                        {(!user && hasCompletedSession) ? "Sign Up or Login" : "Start Practicing"}
                    </button>
                    {user && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-10 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-lg shadow-slate-200 transition-all hover:-translate-y-1"
                        >
                            View History
                        </button>
                    )}
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rangam-blue/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-rangam-green/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
    );
};

export default Home;
