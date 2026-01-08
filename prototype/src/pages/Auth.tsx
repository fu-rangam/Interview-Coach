import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { Mail, Lock, User, ArrowRight, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const toggleMode = () => setIsLogin(!isLogin);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate auth
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-gray-900 to-black z-0" />
            <div className="absolute w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] top-[-200px] left-[-200px] animate-pulse z-0" />
            <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] bottom-[-100px] right-[-100px] animate-pulse z-0" style={{ animationDelay: '2s' }} />

            <GlassCard className="w-full max-w-md relative z-10 backdrop-blur-xl border-white/5">
                <div className="text-center mb-8">
                    <motion.h2
                        key={isLogin ? 'login' : 'signup'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold mb-2 bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
                    >
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </motion.h2>
                    <p className="text-gray-400 text-sm">
                        {isLogin ? 'Enter your credentials to access your dashboard' : 'Join thousands of professionals mastering their craft'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <GlassInput
                                    icon={<User className="w-4 h-4" />}
                                    placeholder="Full Name"
                                    type="text"
                                    className="mb-4"
                                    required={!isLogin}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <GlassInput
                        icon={<Mail className="w-4 h-4" />}
                        placeholder="Email Address"
                        type="email"
                        required
                    />

                    <GlassInput
                        icon={<Lock className="w-4 h-4" />}
                        placeholder="Password"
                        type="password"
                        required
                    />

                    <GlassButton className="w-full mt-6 group" type="submit">
                        {isLogin ? 'Sign In' : 'Get Started'}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </GlassButton>
                </form>

                <div className="mt-8 flex items-center gap-4">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-xs text-gray-500 uppercase">Or continue with</span>
                    <div className="h-px bg-white/10 flex-1" />
                </div>

                <div className="mt-6">
                    <GlassButton variant="outline" className="w-full" type="button">
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                    </GlassButton>
                </div>

                <div className="mt-8 text-center text-sm text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={toggleMode}
                        className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-all"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};
