
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Home, Loader2, Mail, Lock } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const Auth: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [error, setError] = useState<string | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                // if (!captchaToken) {
                //     throw new Error('Please complete the captcha verification.');
                // }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    // options: { captchaToken }
                });
                if (error) throw error;
                alert('Success! Check your email for the confirmation link.');
            } else {
                // Determine if we need to pass captcha for sign in (based on user settings)
                // If the widget is displayed and verifyed, use it.
                // For safety, if captchaToken is present, pass it.
                const options = captchaToken ? { captchaToken } : undefined;

                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                    options
                });
                if (error) throw error;
                navigate('/');
            }
        } catch (error: any) {
            setError(error.message);
            // Reset captcha on error so user can try again
            if (window.hcaptcha) window.hcaptcha.reset();
            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <button onClick={() => navigate('/')} className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 flex items-center gap-2 transition-colors">
                <Home size={20} /> Back Home
            </button>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-slate-500">
                        {mode === 'signin' ? 'Sign in to access your interview dashboard' : 'Start your journey to interview mastery'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    {/* <div className="flex justify-center my-4">
                        <HCaptcha
                            // Reset key when mode changes to ensure clean slate
                            key={mode}
                            sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
                            onVerify={(token) => setCaptchaToken(token)}
                        />
                    </div> */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => {
                            setMode(mode === 'signin' ? 'signup' : 'signin');
                            setError(null);
                            setCaptchaToken(null);
                        }}
                        className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                    >
                        {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
