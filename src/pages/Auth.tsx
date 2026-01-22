import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Home, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GlassTooltip } from '../components/ui/glass/GlassTooltip';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = 'Ready2Work - Login';
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await authService.signUp(email, password);
        if (error) throw error;
        setSuccessMessage('Success! Check your email for the confirmation link.');
      } else {
        const { error } = await authService.signIn(email, password);
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] delay-1000 animate-pulse-slow" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm group"
          >
            <Home size={16} />
            <span className="group-hover:underline">Back to Home</span>
          </button>
        </div>

        <GlassCard className="p-8 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white tracking-tight font-display">
                Ready<span className="text-cyan-400">2</span>Work
              </h1>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400 text-sm">
              {mode === 'signin'
                ? 'Enter your credentials to access your dashboard.'
                : 'Start your journey to interview mastery today.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-black/20 p-1 rounded-xl flex mb-8 border border-white/5">
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white/10 text-white shadow-lg shadow-black/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white/10 text-white shadow-lg shadow-black/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg flex items-start gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm rounded-lg flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 ml-1">Password</label>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <GlassButton type="submit" disabled={loading} className="w-full mt-6">
              {loading ? (
                <span className="flex items-center gap-2">Processing...</span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </span>
              )}
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default Auth;
