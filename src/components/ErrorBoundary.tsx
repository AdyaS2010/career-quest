import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Without this, any thrown error during render unmounts the whole tree and
// leaves the user staring at a blank white screen with no way out. This catches
// it, keeps the app alive, and offers a clear path back (retry / go home) plus
// the actual error text so issues are diagnosable instead of invisible.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Caught by ErrorBoundary:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0f1b3d 0%, #131a2e 60%, #0a1228 100%)' }}
      >
        <div className="max-w-md w-full text-center bg-white/95 rounded-3xl shadow-2xl p-8">
          <div className="text-5xl mb-4">🧭</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">We hit a snag</h1>
          <p className="text-gray-600 mb-6">
            Something went wrong loading this part of Questford. Your progress is safe — try again or head back to the city.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Back to City
            </button>
          </div>
          <pre className="mt-6 text-left text-xs text-red-600/80 bg-red-50 rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }
}
