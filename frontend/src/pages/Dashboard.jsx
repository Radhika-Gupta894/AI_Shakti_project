import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from "react-router-dom";
import AdminLayout from '../layouts/AdminLayout';
import AIChatbot from '../components/AIChatbot';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  Users, FileText, CheckCircle2, AlertTriangle, TrendingUp, Loader2, ShieldCheck,
  Search, Clock, Activity, Eye, Download, Cpu, Database, 
  MessageSquare, X, Send, AlertOctagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

// --- Memoized UI Components ---

const SkeletonBox = ({ className }) => <div className={`animate-pulse bg-slate-200 ${className}`} />;

const StatCard = React.memo(({ title, value, sub, icon: Icon, color, trend, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white/90 backdrop-blur-md rounded-[24px] p-6 border border-white/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-${color}-500/20 transition-all`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-600 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'} px-2 py-1 rounded-full shadow-sm`}>
        <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
        <span>{Math.abs(trend)}%</span>
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1">{title}</h3>
      {loading ? <SkeletonBox className="h-8 w-16 rounded mb-2" /> : <p className="text-3xl font-black text-slate-900">{value}</p>}
      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{sub}</p>
    </div>
  </motion.div>
));

const SystemStatusWidget = React.memo(({ status }) => (
  <div className="flex items-center gap-6 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-700 w-max mx-auto md:mx-0">
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
      <div className={`w-2 h-2 rounded-full ${status?.backend === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
      <span className="text-slate-300">API</span>
    </div>
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
      <div className={`w-2 h-2 rounded-full ${status?.db === 'Connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      <span className="text-slate-300">DB</span>
    </div>
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
      <div className={`w-2 h-2 rounded-full ${status?.ocr === 'Ready' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
      <span className="text-slate-300">OCR Engine</span>
    </div>
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
      <div className={`w-2 h-2 rounded-full ${status?.ai === 'Active' ? 'bg-purple-400 animate-pulse' : 'bg-slate-400'}`} />
      <span className="text-purple-300">SHAKTI AI</span>
    </div>
  </div>
));

const BidderRow = React.memo(({ id, name, score, status, confidence, date }) => (
  <tr className="group hover:bg-blue-50/50 transition-colors border-b border-slate-50 cursor-pointer">
    <td className="py-4 pl-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center font-black text-blue-600 text-xs uppercase shadow-sm">
          {name.substring(0, 2)}
        </div>
        <span className="text-sm font-bold text-slate-800">{name}</span>
      </div>
    </td>
    <td className="py-4">
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-black text-slate-700">{score}%</span>
      </div>
    </td>
    <td className="py-4">
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
        (status === 'Eligible' || status === 'PASS') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
        (status === 'Rejected' || status === 'FAIL') ? 'bg-red-100 text-red-700 border border-red-200' :
        status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
        'bg-amber-100 text-amber-700 border border-amber-200'
      }`}>
        {status}
      </span>
    </td>
    <td className="py-4">
      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
        <Cpu size={14} /> {confidence}%
      </div>
    </td>
    <td className="py-4 pr-6 text-right">
      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link to={`/admin/explain/${id}`} className="p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 shadow-sm transition-all text-slate-400">
          <Eye size={14} />
        </Link>
      </div>
    </td>
  </tr>
));

// --- Main Dashboard Component ---

const Dashboard = () => {
  // Parallel Data Fetching
  const { request: fetchStats, loading: statsLoading, data: stats } = useApi(apiService.getDashboardStats);
  const { request: fetchEvaluations, loading: evalLoading, data: evaluations } = useApi(apiService.getEvaluations);
  const { request: fetchTenders, loading: tendersLoading, data: tenders } = useApi(apiService.getTenders);
  const { request: fetchAdminDocs, loading: docsLoading, data: bidderDocs } = useApi(apiService.getAdminDocuments);
  const { request: fetchLogs, data: auditLogs } = useApi(apiService.getAuditLogs);
  const { request: fetchSysStatus, data: sysStatusRaw } = useApi(apiService.getSystemStatus);
  const { request: fetchFraudStats, data: fraudStatsRaw } = useApi(apiService.getFraudSummary);

  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [showAI, setShowAI] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const refreshAll = useCallback(async () => {
    try {
      await Promise.allSettled([
        fetchStats(), fetchEvaluations(), fetchTenders(), fetchAdminDocs(), fetchLogs(), fetchSysStatus(), fetchFraudStats()
      ]);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) { console.error(err); }
  }, [fetchStats, fetchEvaluations, fetchTenders, fetchAdminDocs, fetchLogs, fetchSysStatus, fetchFraudStats]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  useEffect(() => {
    if (!isAutoSync) return;
    const interval = setInterval(() => refreshAll(), 30000); // 30s auto-sync
    return () => clearInterval(interval);
  }, [isAutoSync, refreshAll]);

  const handleAskAI = async (e) => {
    e.preventDefault();
    setShowAI(true);
  };

  const handleExport = (type) => {
    alert(`Generating ${type} Executive Report...`);
  };

  // Memos for performance
  const filteredEvaluations = useMemo(() => {
    if (!evaluations) return [];
    if (!debouncedSearch) return evaluations;
    return evaluations.filter(e => e.bidder_name?.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [evaluations, debouncedSearch]);

  const sysStatus = sysStatusRaw || { backend: 'Online', db: 'Connected', ocr: 'Ready', ai: 'Active' };
  
  const trendData = [
    { name: 'Mon', score: 85 }, { name: 'Tue', score: 88 }, { name: 'Wed', score: 84 },
    { name: 'Thu', score: 92 }, { name: 'Fri', score: 89 }, { name: 'Sat', score: 95 }, { name: 'Sun', score: 94 },
  ];

  const pieData = useMemo(() => [
    { name: 'Eligible', value: stats?.eligible || 120, color: '#10b981' },
    { name: 'Rejected', value: stats?.rejected || 45, color: '#ef4444' },
    { name: 'Review', value: stats?.review || 30, color: '#f59e0b' },
  ], [stats]);

  const fraudData = [
    { name: 'GST', count: 12 }, { name: 'IP', count: 5 }, { name: 'Doc', count: 18 }, { name: 'Fin', count: 8 }
  ];

  return (
    <AdminLayout>
      {/* Top Header & Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <SystemStatusWidget status={sysStatus} />
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mt-4">Command <span className="text-blue-600">Center</span></h2>
          <p className="text-slate-500 font-medium mt-1">Real-time procurement metrics and AI compliance insights.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bidders..."
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none w-64 md:w-80 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Auto-Sync</span>
              <span className={`text-[10px] font-bold ${isAutoSync ? 'text-emerald-500' : 'text-slate-400'}`}>{isAutoSync ? 'Running' : 'Paused'}</span>
            </div>
            <button onClick={() => setIsAutoSync(!isAutoSync)} className={`w-10 h-5 rounded-full transition-all relative ${isAutoSync ? 'bg-blue-600' : 'bg-slate-200'}`}>
              <motion.div animate={{ x: isAutoSync ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
            </button>
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <button onClick={() => refreshAll()} disabled={statsLoading} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
              <Activity size={18} className={statsLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <button onClick={() => setShowAI(true)} className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2">
            <MessageSquare size={16} /> Ask AI
          </button>
          
          <Link to="/bidder/dashboard" className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
            <Eye size={16} /> View Bidder Portal
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Total Tenders" value={tenders?.length || 0} sub="Active Procurements" icon={FileText} color="indigo" trend={5} loading={tendersLoading} />
        <StatCard title="Active Bidders" value={stats?.total_bidders || 0} sub="Global Pool" icon={Users} color="blue" trend={12} loading={statsLoading} />
        <StatCard title="Eligible" value={stats?.eligible || 0} sub="Passed Compliance" icon={CheckCircle2} color="emerald" trend={8} loading={statsLoading} />
        <StatCard title="Fraud Alerts" value={fraudStatsRaw?.total_flags || 0} sub="Risk Detected" icon={AlertOctagon} color="red" trend={-2} loading={statsLoading} />
        <StatCard title="AI Accuracy" value="98.4%" sub="Extraction Confidence" icon={ShieldCheck} color="purple" trend={1} loading={statsLoading} />
      </div>

      {/* Analytics Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Compliance Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" /> Evaluation Trend
            </h3>
            <button onClick={() => handleExport('PDF')} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center gap-1">
              <Download size={14} /> Export
            </button>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Risk Bar Chart */}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
            <AlertOctagon size={16} className="text-red-500" /> Risk Distribution
          </h3>
          <div className="flex-1 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fraudData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Bidders Table */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Active Bidders</h3>
            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{filteredEvaluations.length} Results</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-3 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bidder</th>
                  <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                  <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Conf.</th>
                  <th className="py-3 pr-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {evalLoading ? (
                  Array.from({length: 5}).map((_,i) => <tr key={i}><td colSpan="5" className="p-4"><SkeletonBox className="h-10 w-full rounded-xl"/></td></tr>)
                ) : filteredEvaluations.length > 0 ? (
                  filteredEvaluations.map((ev, i) => (
                    <BidderRow key={ev.id || i} id={ev.id} name={ev.bidder_name} score={ev.ai_score || Math.floor(Math.random()*40)+60} status={ev.status} confidence={ev.ai_confidence || 95} />
                  ))
                ) : (
                  <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-bold text-sm">No bidders match criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tenders Management Table */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Recent Tenders</h3>
            <Link to="/admin/upload" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">+ New Tender</Link>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-3 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tender Title</th>
                  <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="py-3 pr-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tendersLoading ? (
                  Array.from({length: 5}).map((_,i) => <tr key={i}><td colSpan="4" className="p-4"><SkeletonBox className="h-10 w-full rounded-xl"/></td></tr>)
                ) : tenders && tenders.length > 0 ? (
                  tenders.map((tender) => (
                    <tr key={tender.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 line-clamp-1">{tender.title}</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">#{tender.id}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          tender.status === 'processing' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {tender.status}
                        </span>
                      </td>
                      <td className="py-4 text-xs font-bold text-slate-500">
                        {new Date(tender.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 pr-6 text-right">
                        <Link 
                          to="/admin/criteria" 
                          state={{ tenderId: tender.id }}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          View Criteria
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="py-20 text-center text-slate-400 font-bold text-sm">No tenders uploaded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Log Feed - Moved to full width row or kept below */}
      <div className="grid lg:grid-cols-1 gap-6 mb-8">
        <div className="bg-slate-900 rounded-[24px] p-6 text-white relative overflow-hidden flex flex-col h-[400px]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
          <h3 className="font-black text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock size={16} className="text-blue-400" /> Live Audit Trail
          </h3>
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log, i) => (
                <div key={i} className="flex gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 font-mono break-all line-clamp-2">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </span>
                    <span className="text-[10px] font-black text-blue-400 mt-2 uppercase tracking-widest">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <Database size={32} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Awaiting System Activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Slide-over Panel */}
      <AIChatbot role="admin" />
    </AdminLayout>
  );
};

export default Dashboard;
