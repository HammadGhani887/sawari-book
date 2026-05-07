"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg gap-6 px-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-status-redDim flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xs">
              {this.state.message || "An unexpected error occurred. Please refresh and try again."}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent-green text-white font-semibold rounded-xl active:scale-95 transition-transform"
          >
            Refresh App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
