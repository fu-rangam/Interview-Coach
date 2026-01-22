import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GraduationCap, FileText, Mic, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // If this fails, check context provider wrapping

    React.useEffect(() => {
        document.title = "Ready2Work";
    }, []);

    const handlePlaceholder = (module: string) => {
        // Simple alert for now, could be a toast in production
        alert(`${module} module is coming soon!`);
    };

    const handlePracticeClick = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/auth');
        }
    };

    return (
        <div className="h-screen w-full flex flex-col items-center justify-start md:justify-center relative overflow-y-auto overflow-x-hidden font-sans selection:bg-cyan-500/30 pt-20 md:pt-0 pb-10 custom-scrollbar">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[100px] delay-1000 animate-pulse-slow" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 w-full max-w-5xl px-4 md:px-6">

                {/* Hero Section */}
                <div className="text-center mb-16 animate-fade-in-up">


                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight font-display">
                        Ready<span className="text-cyan-400">2</span>Work
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Your all-in-one platform for career success. Build skills, craft the perfect resume, and master your interview technique.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Training Module */}
                    <GlassCard
                        className="p-8 flex flex-col items-center text-center group hover:bg-white/5 transition-all duration-300 border-white/5 hover:border-white/10"
                    >
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                            <GraduationCap size={32} className="text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Training</h3>
                        <p className="text-gray-400 text-sm mb-8 flex-1">
                            Access our extensive e-learning library to upskill and certifications to boost your profile.
                        </p>
                        <GlassButton
                            variant="default"
                            onClick={() => user ? navigate('/training') : navigate('/auth')}
                            className="w-full"
                        >
                            Start Learning
                        </GlassButton>
                    </GlassCard>

                    {/* Resume Builder Module */}
                    <GlassCard
                        className="p-8 flex flex-col items-center text-center group hover:bg-white/5 transition-all duration-300 border-white/5 hover:border-white/10"
                    >
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                            <FileText size={32} className="text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Resume Builder</h3>
                        <p className="text-gray-400 text-sm mb-8 flex-1">
                            Create professional, ATS-friendly resumes in minutes with our AI-powered builder.
                        </p>
                        <GlassButton
                            variant="default"
                            onClick={() => user ? navigate('/resume-builder') : navigate('/auth')}
                            className="w-full"
                        >
                            Start Building
                        </GlassButton>
                    </GlassCard>

                    {/* Interview Prep Module (Active) */}
                    <GlassCard
                        className="p-8 flex flex-col items-center text-center group hover:bg-white/5 transition-all duration-300 border-cyan-500/30 hover:border-cyan-400/50 shadow-glow-cyan"
                    >
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Mic size={32} className="text-cyan-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Interview Coach</h3>
                        <p className="text-gray-400 text-sm mb-8 flex-1">
                            Practice with an AI coach that provides real-time feedback on your delivery and answers.
                        </p>
                        <GlassButton
                            onClick={() => navigate('/dashboard')}
                            className="w-full group/btn"
                        >
                            Start Practicing <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </GlassButton>
                    </GlassCard>

                </div>
            </div>
        </div>
    );
};

export default Home;
