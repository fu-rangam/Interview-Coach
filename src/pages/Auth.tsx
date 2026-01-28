import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Home, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans bg-slate-50 selection:bg-blue-100">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-100/50 rounded-full blur-[120px] delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 text-center flex justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-rangam-navy transition-colors text-sm group"
          >
            <Home size={16} />
            <span className="group-hover:underline">Back to Home</span>
          </button>
        </div>

        <Card className="p-8 border-slate-200 shadow-xl bg-white">
          <div className="text-center mb-8">
            <div className="mb-6">
              <h1 className="text-4xl font-bold tracking-tight font-display">
                <span className="bg-clip-text text-transparent bg-linear-to-r from-[#2a7ee3] to-[#1c5497]">
                  Ready
                </span>
                <span className="text-rangam-orange">2</span>
                <span className="bg-clip-text text-transparent bg-linear-to-r from-[#1c5497] to-[#0e2a4b]">
                  Work
                </span>
              </h1>
            </div>
            <h1 className="text-2xl font-bold text-rangam-navy mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500 text-sm">
              {mode === 'signin'
                ? 'Enter your credentials to access your dashboard.'
                : 'Start your journey to interview mastery today.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex mb-8 border border-slate-200">
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-rangam-navy shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
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
                  ? 'bg-white text-rangam-navy shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-start gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-lg flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 ml-1">Email</label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rangam-blue transition-colors"
                  size={18}
                />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-slate-900 border-slate-200 focus:border-rangam-blue focus:ring-rangam-blue/20"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors"
                  size={18}
                />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-slate-900 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-rangam-navy hover:bg-rangam-navy/90 text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">Processing...</span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
