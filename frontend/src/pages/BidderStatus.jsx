import React, { useEffect } from 'react';
import BidderLayout from '../layouts/BidderLayout';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Download, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight,
  Info,
  History,
  UploadCloud,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

// --- Components ---

const ProgressStep = ({ step, title, status }) => {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';

  return (
    <div className="flex flex-col items-center flex-1 relative group">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm z-10 transition-all ${
        isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
        isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100' :
        'bg-slate-100 text-slate-400'
      }`}>
        {isCompleted ? <CheckCircle size={18} /> : step}
      </div>
      <div className="mt-4 text-center">
        <h4 className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>{title}</h4>
        {isCurrent && <span className="text-[8px] font-bold text-blue-400 animate-pulse uppercase">Processing</span>}
      </div>
    </div>
  );
};

const VerificationCard = ({ doc, status, remarks, time }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-start justify-between"
  >
    <div className="flex gap-4">
      <div className={`p-3 rounded-2xl ${
        status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 
        status === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
      }`}>
        {status === 'Verified' ? <CheckCircle2 size={20} /> : status === 'Warning' ? <AlertTriangle size={20} /> : <Search size={20} />}
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800 mb-1">{doc}</h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{remarks}</p>
        <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          <Clock size={12} />
          {time}
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
        status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 
        status === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
      }`}>
        {status}
      </span>
      <button className="text-[10px] font-bold text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
        View Report
      </button>
    </div>
  </motion.div>
);

const BidderStatus = () => {
  const { request: fetchMySubmissions, loading, data: submissions } = useApi(apiService.getMySubmissions);

  useEffect(() => {
    // For demo using bidderId = 1
    fetchMySubmissions(1);
    
    const interval = setInterval(() => {
      fetchMySubmissions(1);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchMySubmissions]);

  const latestSub = submissions?.[submissions.length - 1];
  const status = latestSub?.status || 'SUBMITTED';
  const score = latestSub?.ai_score || 0;

  // Determine progress steps based on status
  const getStepStatus = (step) => {
    if (status === 'PASS' || status === 'Eligible') return 'completed';
    if (status === 'FAIL' || status === 'Rejected') return step <= 3 ? 'completed' : 'pending';
    
    // Normal flow
    if (step === 1) return 'completed';
    if (step === 2) return (status === 'SUBMITTED' ? 'current' : 'completed');
    if (step === 3) return (status === 'AWAITING_DOCS' ? 'current' : (status === 'SUBMITTED' ? 'pending' : 'completed'));
    return 'pending';
  };

  return (
    <BidderLayout>
      <div className="max-w-6xl mx-auto py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
              <ShieldCheck size={14} />
              Verified Submission Portal
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Application <span className="text-blue-600">Track</span></h2>
            <p className="text-slate-500 font-medium mt-1">
              Ref: #CRPF-2026-{latestSub?.id || '0982'} • {latestSub?.tender_title || 'Loading Application...'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => fetchMySubmissions(1)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <History size={14} />}
              Refresh Track
            </button>
            <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2">
              Withdraw Application
            </button>
          </div>
        </div>

        {!latestSub && !loading ? (
          <div className="bg-white rounded-[32px] p-20 border border-slate-100 shadow-sm text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800">No Applications Found</h3>
              <p className="text-slate-500 text-sm max-w-xs">You haven't submitted any tender applications yet. Head over to Active Tenders to get started.</p>
              <button className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                View Active Tenders
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Intelligence Progress Tracker */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm mb-10 overflow-hidden relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-50 -translate-y-[40px] -z-0" />
              <div className="flex justify-between items-start relative z-10">
                <ProgressStep step={1} title="Submission" status={getStepStatus(1)} />
                <ProgressStep step={2} title="AI Processing" status={getStepStatus(2)} />
                <ProgressStep step={3} title="Eligibility" status={getStepStatus(3)} />
                <ProgressStep step={4} title="Tech Eval" status={getStepStatus(4)} />
                <ProgressStep step={5} title="Outcome" status={getStepStatus(5)} />
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Main Feed: Document Status */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Document Verification Trail
                  </h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {loading && <Loader2 size={12} className="animate-spin" />}
                    Last AI Pulse: {latestSub?.submission_date || 'Just now'}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <VerificationCard 
                    doc="GST Registration" 
                    status={status === 'SUBMITTED' ? 'Processing' : 'Verified'} 
                    remarks={status === 'SUBMITTED' ? 'AI is currently analyzing the GSTIN validity...' : 'Automatic verification successful. Valid until Dec 2026.'} 
                    time={latestSub?.submission_date} 
                  />
                  <VerificationCard 
                    doc="ISO 9001:2015 Cert" 
                    status={status === 'SUBMITTED' ? 'Processing' : 'Verified'} 
                    remarks={status === 'SUBMITTED' ? 'Connecting to global registry for validation...' : 'Certificate authenticity confirmed.'} 
                    time={latestSub?.submission_date} 
                  />
                  <VerificationCard 
                    doc="Financial Statement FY24" 
                    status={status === 'SUBMITTED' ? 'Processing' : 'Verified'} 
                    remarks={status === 'SUBMITTED' ? 'Extracting turnover and balance sheet metrics...' : 'Financial criteria compliance verified.'} 
                    time={latestSub?.submission_date} 
                  />
                </div>
              </div>

              {/* Sidebar Info Panels */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* AI Insight Card */}
                <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all" />
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <TrendingUp size={18} />
                    AI Pre-Scoring
                  </h3>
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eligibility Score</span>
                      <span className="text-2xl font-black">{score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} className="h-full bg-blue-500" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    {status === 'SUBMITTED' 
                      ? "AI is currently evaluating your compliance score against the mandatory tender criteria."
                      : `Based on verified documents, your compliance score is ${score}%.`}
                  </p>
                </div>

                {/* Quick Action Card - Only show if issues */}
                {status === 'FAIL' && (
                  <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-8 shadow-sm shadow-amber-100/20">
                    <AlertTriangle className="text-amber-600 mb-4" size={32} />
                    <h4 className="text-xl font-black text-amber-900 mb-2">Action Required</h4>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium mb-6">
                      Your application has been flagged for a discrepancy in the financial documents.
                    </p>
                    <button className="w-full py-3 bg-amber-600 text-white rounded-2xl font-black text-xs hover:bg-amber-700 shadow-xl shadow-amber-600/20 transition-all flex items-center justify-center gap-2">
                      <UploadCloud size={16} />
                      Re-upload Documents
                    </button>
                  </div>
                )}

                {/* Help/Support Card */}
                <div className="bg-white border border-slate-100 rounded-[32px] p-6">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <History size={16} className="text-slate-400" />
                    Application Pulse
                  </h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                      <p className="text-[10px] text-slate-500 font-medium">Application successfully logged into the CRPF Blockchain registry.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                      <p className="text-[10px] text-slate-500 font-medium">AI analysis engine initialized for document indexing.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </BidderLayout>
  );
};

export default BidderStatus;
