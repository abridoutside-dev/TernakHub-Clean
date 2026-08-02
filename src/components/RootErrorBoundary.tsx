import React, { type ErrorInfo, type ReactNode } from 'react';

interface RootErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class RootErrorBoundary extends React.Component<{
  children: ReactNode;
}, RootErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Caught error', { error, errorInfo });
    this.setState({ error, errorInfo });
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const lastComponent = typeof window !== 'undefined'
      ? (window as Window & { __lastRenderedReactComponent?: string }).__lastRenderedReactComponent
      : undefined;

    const stack = this.state.error.stack ?? 'No stack trace available';
    const componentStack = this.state.errorInfo?.componentStack ?? 'No component stack available';
    const firstStackLine = stack.split('\n')[1]?.trim() ?? 'Unknown';
    const match = firstStackLine.match(/\(([^:]+):(\d+):(\d+)\)/);
    const fileName = match ? match[1] : 'Unknown file';
    const lineNumber = match ? match[2] : 'Unknown line';

    return (
      <div style={{ padding: 24, color: '#111', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Aplikasi mengalami error</h1>
        <p style={{ marginBottom: 8, fontSize: 16 }}>Komponen terakhir berhasil dirender: <strong>{lastComponent ?? 'Unknown'}</strong></p>
        <p style={{ marginBottom: 8, fontSize: 16 }}>File: <strong>{fileName}</strong></p>
        <p style={{ marginBottom: 16, fontSize: 16 }}>Baris: <strong>{lineNumber}</strong></p>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Stack trace</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
            {stack}
          </pre>
        </div>
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Component stack</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
            {componentStack}
          </pre>
        </div>
      </div>
    );
  }
}
