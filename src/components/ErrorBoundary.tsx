import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlassCard } from './ui/glass/GlassCard';
import { GlassButton } from './ui/glass/GlassButton';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center text-white p-4 relative overflow-hidden font-sans">
          {/* Background Atmosphere */}
          <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-900/10 rounded-full blur-[100px]" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
          </div>
          <GlassCard className="max-w-md w-full p-8 text-center relative z-10 border-red-500/20 bg-zinc-900/60">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-400 w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. The application has been paused to prevent data
              loss.
            </p>

            {this.state.error && (
              <div className="bg-black/30 rounded-lg p-3 text-left mb-6 overflow-hidden">
                <code className="text-xs text-red-300 block whitespace-pre-wrap font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <GlassButton
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} /> Reload
              </GlassButton>
              <GlassButton onClick={this.handleReset} className="flex items-center gap-2">
                <Home size={16} /> Dashboard
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
