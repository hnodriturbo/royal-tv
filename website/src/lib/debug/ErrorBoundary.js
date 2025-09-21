/**
 * =========================== /src/lib/debug/ErrorBoundary.js ===========================
 * 🧯 ErrorBoundary (client) – visible fallback so we don't get a blank page
 * =======================================================================================
 */
'use client';
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', {
      error,
      componentStack: info?.componentStack
    });
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 rounded-xl border border-red-500 bg-red-950/40 text-red-200">
          {/* 🚨 show the error so we know the offender */}
          <div className="font-bold mb-2">Something exploded while rendering.</div>
          <pre className="text-xs whitespace-pre-wrap">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          {this.state.info?.componentStack && (
            <pre className="text-[10px] opacity-80 mt-2">{this.state.info.componentStack}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
