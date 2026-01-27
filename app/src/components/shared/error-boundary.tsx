'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Aqui poderíamos integrar com Sentry no futuro:
    // Sentry.captureException(error, { extra: errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado.</h2>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Ocorreu um erro ao carregar esta seção. Isso pode ser uma falha temporária ou um problema de conexão.
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={this.handleReset}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Recarregar Página
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 text-left p-4 bg-black/40 rounded border border-white/5 overflow-auto max-h-40">
              <p className="text-xs font-mono text-red-400 whitespace-pre-wrap">
                {this.state.error?.stack}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
