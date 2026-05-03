import React from 'react';
import { AlertTriangle, RefreshCcw, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-900/20 blur-[120px] pointer-events-none" />
          
          <div className="bg-[#1E293B]/80 backdrop-blur-2xl border border-red-500/30 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] relative z-10 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">System Evaluation Failure</h1>
            <p className="text-sm text-slate-400 mb-6">
              The AI Decision Dashboard encountered a critical rendering error. The analytics engine could not safely parse the provided data payload.
            </p>
            
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left mb-8 overflow-auto max-h-32">
              <p className="text-xs text-red-400 font-mono break-all">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                <RefreshCcw size={16} />
                Reload Engine
              </button>
              <Link 
                to="/admin/dashboard"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl border border-white/10 transition-all"
              >
                <LayoutDashboard size={16} />
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
