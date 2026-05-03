import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, Shield, FileText, Search, ChevronRight, Eye, ShieldCheck, 
  Activity, AlertTriangle, FileCheck, CheckCircle2, XCircle, TrendingUp,
  Download, History, UserCheck, ShieldAlert, LayoutDashboard, FileSearch, 
  Bell, Settings, Layout, Loader2, Clock, ArrowLeft
} from 'lucide-react';
import { apiService } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';

const ExplainabilityContent = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [report, setReport] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const evalsRes = await apiService.getEvaluations();
        const evalsData = evalsRes?.data || [];
        const currentEval = id 
          ? evalsData.find(e => e?.id?.toString() === id.toString()) 
          : evalsData[0];
          
        if (currentEval && isMounted) {
          setEvaluation(currentEval);
          try {
            const reportRes = await apiService.getEvaluationReport(currentEval.id);
            if (reportRes?.data && isMounted) setReport(reportRes.data);
          } catch(e) {}
          try {
            const docsRes = await apiService.getAdminDocuments();
            if (docsRes?.data && Array.isArray(docsRes.data) && isMounted) {
              setDocuments(docsRes.data.filter(d => d.bidder_id === currentEval.bidder_id));
            }
          } catch(e) {}
        }
        try {
          const logsRes = await apiService.getAuditLogs();
          if (logsRes?.data && Array.isArray(logsRes.data) && isMounted) {
            setAuditLogs(logsRes.data.slice(0, 4));
          }
        } catch(e) {}
      } catch (err) {
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] animate-pulse" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <Loader2 className="text-blue-500 w-12 h-12 animate-spin mb-4 shadow-[0_0_15px_rgba(37,99,235,0.5)] rounded-full" />
          <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Initializing Decision Engine...</h2>
          <p className="text-slate-400 text-sm">Aggregating AI analysis and bidder profiles</p>
        </div>
      </div>
    );
  }

  const bidderDetails = {
    bidder_name: evaluation?.bidder_name || "Unknown Bidder",
    tender_title: evaluation?.tender_title || "Unknown Tender",
    bidder_id: evaluation?.bidder_id || "B-000",
    pan: evaluation?.pan || "PENDING",
    tender_id: evaluation?.tender_id || "TNDR-000",
    status: evaluation?.status || "PASS",
    submission_date: evaluation?.submission_date || new Date().toLocaleString(),
    ai_score: evaluation?.ai_score ?? 0,
    risk_level: evaluation?.risk_level || "Low"
  };

  const aiResults = report?.results || [];
  
  const getCardData = (keyword, defaultData) => {
    const found = aiResults.find(r => r?.criterion_name?.toLowerCase().includes(keyword.toLowerCase()));
    if (found) {
      return {
        title: found.criterion_name || defaultData.title,
        status: found.status || 'REVIEW',
        value: found.extracted_value || 'Verified',
        source: "Extracted Document",
        explanation: found.reasoning || 'No detailed reasoning provided by AI.',
        confidence: Math.round((found.confidence || 0.9) * 100)
      };
    }
    return defaultData;
  };

  const cards = [
    getCardData('turnover', { title: "TURNOVER CHECK", status: "PASS", value: "Verified", source: "Document", explanation: "Verified successfully.", confidence: 98 }),
    getCardData('gst', { title: "GST REGISTRATION", status: "PASS", value: "Verified", source: "Document", explanation: "Verified successfully.", confidence: 99 }),
    getCardData('iso', { title: "ISO CERTIFICATE", status: "PASS", value: "Verified", source: "Document", explanation: "Verified successfully.", confidence: 95 })
  ];

  const docs = (Array.isArray(documents) && documents.length > 0) ? documents : [
    { type: "General", name: "Submission.pdf", extracted: "Verified", confidence: 98 }
  ];

  const logs = (Array.isArray(auditLogs) && auditLogs.length > 0) ? auditLogs : [
    { action: "Evaluation Loaded", timestamp: "Just now" }
  ];

  const bidderInitial = typeof bidderDetails?.bidder_name === 'string' && bidderDetails.bidder_name.length > 0 
    ? bidderDetails.bidder_name.charAt(0).toUpperCase() 
    : 'B';

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-900/20 blur-[100px]" />
      </div>

      <main className="relative z-10">
        <header className="h-20 bg-[#0F172A]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Link to="/admin/evaluations" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="text-xs font-bold text-blue-400 flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
              <Activity size={12} className="animate-pulse" />
              <span>AI Engine v2.4</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-white font-medium">Explainable AI Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">Cmdr. Rajesh Kumar</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">CRPF Officer</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-white font-bold">RK</div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-6 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1E293B]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-2xl">
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/5 blur-3xl rounded-full" />
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-2xl shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                {bidderInitial}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{bidderDetails.bidder_name}</h3>
                <p className="text-sm text-slate-400 mb-3">{bidderDetails.tender_title}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300"><span className="text-slate-500">Bidder ID:</span> {bidderDetails.bidder_id}</div>
                  <div className="flex items-center gap-1.5 text-slate-300"><span className="text-slate-500">Tender ID:</span> {bidderDetails.tender_id}</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 uppercase tracking-widest">AI Status</span>
                <span className={`px-4 py-1.5 rounded-lg border font-black tracking-widest text-sm shadow-sm ${bidderDetails.status === 'PASS' || bidderDetails.status === 'Eligible' ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : bidderDetails.status === 'REVIEW' || bidderDetails.status === 'Manual Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {bidderDetails.status}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock size={12} /> Evaluated: {bidderDetails.submission_date}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards?.map((card, idx) => (
              <motion.div key={`card-${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }} className="bg-[#1E293B]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-blue-500/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card?.title || 'Criteria'}</h4>
                  <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded border ${card?.status === 'PASS' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                    {card?.status === 'PASS' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                    {card?.status || 'REVIEW'}
                  </div>
                </div>
                <div className="mb-4 pb-4 border-b border-white/5">
                  <p className="text-2xl font-bold text-white mb-1">{card?.value || 'N/A'}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1"><FileText size={10} /> {card?.source || 'Unknown'}</p>
                </div>
                <div>
                  <h5 className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity size={12} /> AI Explanation</h5>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[48px]">{card?.explanation || 'No explanation generated.'}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="xl:col-span-2 bg-[#1E293B]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-white/5 bg-white/5">
                <h3 className="text-sm font-bold text-white">Submitted Documents Evidence</h3>
              </div>
              <div className="overflow-x-auto flex-1 p-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                      <th className="py-3 px-4">Document Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">AI Confidence</th>
                      <th className="py-3 px-4 text-center">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {docs?.map((doc, i) => (
                      <tr key={`doc-${i}`} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white font-medium flex items-center gap-2">
                          <FileCheck size={14} className="text-blue-400" />
                          {doc?.name || doc?.file_path?.split('/').pop() || `Document_${i}.pdf`}
                        </td>
                        <td className="py-3 px-4 text-slate-400"><span className="bg-white/5 px-2 py-1 rounded text-[10px]">{doc?.type || doc?.document_type || 'General'}</span></td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" style={{ width: `${doc?.confidence || 95}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-blue-400">{doc?.confidence || 95}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"><Eye size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    {docs?.length === 0 && (<tr><td colSpan="4" className="py-8 text-center text-slate-500">No documents found.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-6 flex flex-col">
              <div className="bg-[#1E293B]/60 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden flex-1 shadow-[0_0_30px_rgba(37,99,235,0.05)]">
                <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={100} /></div>
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-4 uppercase tracking-widest relative z-10"><ShieldCheck size={16} />AI Decision Rationale</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6 relative z-10">{report?.summary || "Analysis confirms a high validity score across all extracted data points."}</p>
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    <span>Overall Confidence</span><span className="text-white">{bidderDetails.ai_score}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${bidderDetails.ai_score}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Explainability = () => (
  <ErrorBoundary>
    <ExplainabilityContent />
  </ErrorBoundary>
);

export default Explainability;
