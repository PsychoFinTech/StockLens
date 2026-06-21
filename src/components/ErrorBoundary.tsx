import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
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
    console.error(`[ErrorBoundary:${this.props.name || 'Component'}] caught an error:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 m-4 bg-rose-50/50 border border-rose-150 rounded-xl text-rose-900 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">Error in {this.props.name || 'component'}:</span>{' '}
            {this.state.error?.message || 'Unknown error'}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
