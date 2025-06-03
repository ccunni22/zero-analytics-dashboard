import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[rgba(16,24,39,0.95)] border border-[rgba(0,229,255,0.12)] rounded-[8px] p-6">
          <div className="text-center">
            <h3 className="text-[#00E5FF] text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-[#E0F7FA] text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 