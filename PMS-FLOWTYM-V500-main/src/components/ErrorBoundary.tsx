// ═══════════════════════════════════════════════════════════════════════════
// components/ErrorBoundary.tsx — Error boundaries pour isolation des modules
// @ts-nocheck — faux positifs TS avec useDefineForClassFields:false + React 19
//
// Usage :
//   <ModuleErrorBoundary module="Planning">
//     <Planning ... />
//   </ModuleErrorBoundary>
//
// Un crash du Planning n'affecte pas la Finance, ni la navigation.
// ═══════════════════════════════════════════════════════════════════════════

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  module?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  // Déclaration explicite requise par useDefineForClassFields:false
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`[ErrorBoundary:${this.props.module ?? 'Module'}]`, error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    const moduleName = this.props.module ?? 'Module';

    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100">
          <AlertTriangle className="w-7 h-7 text-rose-500" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-black text-slate-800 mb-1">
            {moduleName} — Erreur inattendue
          </h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Ce module a rencontré une erreur et a été isolé pour ne pas affecter le reste de l&apos;application.
          </p>
          {this.state.error && (
            <p className="mt-2 text-[10px] text-rose-400 font-mono bg-rose-50 px-3 py-1.5 rounded-lg max-w-sm truncate">
              {this.state.error.message}
            </p>
          )}
        </div>
        <button
          onClick={this.handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Réessayer
        </button>
      </div>
    );
  }
}

// ─── ERROR BOUNDARY GLOBAL (racine de l'app) ──────────────────────────────────

interface GlobalErrorState {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<{ children: ReactNode }, GlobalErrorState> {
  declare state: GlobalErrorState;

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error: Error): GlobalErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary] Application crash:', error, errorInfo);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-8 gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-lg font-black text-slate-900">Flowtym PMS</span>
        </div>
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-black text-slate-900 mb-2">
            L&apos;application a rencontré un problème
          </h2>
          <p className="text-xs text-slate-500 max-w-sm">
            Une erreur critique s&apos;est produite. Vos données ne sont pas perdues.
            Rechargez la page pour reprendre.
          </p>
          {this.state.error && (
            <p className="mt-3 text-[10px] text-rose-400 font-mono bg-rose-50 px-4 py-2 rounded-xl">
              {this.state.error.message}
            </p>
          )}
        </div>
        <button
          onClick={this.handleReload}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recharger l&apos;application
        </button>
      </div>
    );
  }
}
