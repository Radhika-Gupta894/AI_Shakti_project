import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-[32px] p-10 max-w-2xl w-full shadow-2xl border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Intelligence Portal Halted</h1>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              An unexpected rendering error occurred. This is often caused by missing data from the backend or a malformed API response.
            </p>
            <div className="bg-slate-900 rounded-2xl p-6 mb-8 overflow-auto">
              <code className="text-red-400 text-sm font-mono break-all">
                {this.state.error?.toString()}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all w-full"
            >
              Restart Engine
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
