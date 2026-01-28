import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
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
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans">
          <Card className="max-w-md w-full p-8 text-center border-red-200 shadow-xl bg-white">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6">
              We encountered an unexpected error. The application has been paused to prevent data
              loss.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 rounded-lg p-3 text-left mb-6 overflow-hidden border border-slate-200">
                <code className="text-xs text-red-600 block whitespace-pre-wrap font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              >
                <RotateCcw size={16} /> Reload
              </Button>
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Home size={16} /> Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
