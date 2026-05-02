import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Loader2, 
  ShieldCheck, 
  Search, 
  ArrowUpRight,
  Clock,
  ChevronRight,
  MoreVertical,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

// --- Components ---

const StatCard = ({ title, value, sub, icon: Icon, color, trend, loading }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-${color}-500/10 transition-all`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-600`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-green-500' : 'text-red-500'} bg-white px-2 py-1 rounded-full shadow-sm`}>
        <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
        <span>{trend}%</span>
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
      {loading ? <Loader2 className="animate-spin text-slate-300" size={24} /> : <p className="text-3xl font-black text-slate-900">{value}</p>}
      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{sub}</p>
    </div>
  </motion.div>
);

const CategoryProgress = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value}%</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className={`h-full bg-${color}-500`}
      />
    </div>
  </div>
);

const BidderRow = ({ name, score, status, confidence, issues, date }) => (
  <tr className="group hover:bg-slate-50 transition-colors border-b border-slate-50">
    <td className="py-4 pl-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs uppercase">
          {name.substring(0, 2)}
        </div>
        <span className="text-sm font-bold text-slate-800">{name}</span>
      </div>
    </td>
    <td className="py-4">
      <div className="flex items-center gap-2">
        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600" style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-600">{score}%</span>
      </div>
    </td>
    <td className="py-4">
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
        (status === 'Eligible' || status === 'PASS') ? 'bg-emerald-50 text-emerald-600' : 
        (status === 'Rejected' || status === 'FAIL') ? 'bg-red-50 text-red-600' : 
        status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600' :
        'bg-amber-50 text-amber-600'
      }`}>
        {status}
      </span>
    </td>
    <td className="py-4">
      <span className="text-xs font-bold text-slate-500">{confidence}%</span>
    </td>
    <td className="py-4">
      <span className="text-xs text-slate-400 font-medium">{issues}</span>
    </td>
    <td className="py-4">
      <span className="text-xs text-slate-400">{date}</span>
    </td>
    <td className="py-4 pr-6 text-right">
      <button className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 group-hover:text-blue-600 transition-all">
        <ChevronRight size={18} />
      </button>
    </td>
  </tr>
);

// --- Main Dashboard ---

const Dashboard = () => {
  const { request: fetchStats, loading: statsLoading, data: stats } = useApi(apiService.getDashboardStats);
  const { request: fetchEvaluations, loading: evalLoading, data: evaluations } = useApi(apiService.getEvaluations);
  const { request: fetchLogs, data: auditLogs } = useApi(apiService.getAuditLogs);

  useEffect(() => {
    fetchStats();
    fetchEvaluations();
    fetchLogs();

    const interval = setInterval(() => {
      fetchStats();
      fetchEvaluations();
      fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchEvaluations, fetchLogs]);

  const trendData = [
    { name: 'Mon', value: 45 }, { name: 'Tue', value: 52 }, { name: 'Wed', value: 48 },
    { name: 'Thu', value: 61 }, { name: 'Fri', value: 55 }, { name: 'Sat', value: 67 }, { name: 'Sun', value: 72 },
  ];

  const pieData = [
    { name: 'Eligible', value: stats?.eligible || 55, color: '#3b82f6' },
    { name: 'Rejected', value: stats?.rejected || 25, color: '#ef4444' },
    { name: 'Under Review', value: stats?.review || 20, color: '#f59e0b' },
  ];

  return (
    <AdminLayout>
      {/* Top Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
            <Activity size={14} />
            Executive Intelligence Overview
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">System <span className="text-blue-600">Dashboard</span></h2>
          <p className="text-slate-500 font-medium mt-1">Real-time CRPF procurement metrics and AI compliance insights.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Global Search..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none w-64 transition-all"
            />
          </div>
          <button onClick={() => { fetchStats(); fetchEvaluations(); }} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2">
            {(statsLoading || evalLoading) && <Loader2 size={16} className="animate-spin" />}
            Refresh Engine
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Bidders" value={stats?.total_bidders || 0} sub="Current Evaluation Cycle" icon={Users} color="blue" trend={12} loading={statsLoading} />
        <StatCard title="Eligible" value={stats?.eligible || 0} sub="Criteria Compliance Passed" icon={CheckCircle2} color="emerald" trend={8} loading={statsLoading} />
        <StatCard title="Under Review" value={stats?.review || 0} sub="Awaiting Manual Check" icon={AlertTriangle} color="amber" trend={-4} loading={statsLoading} />
        <StatCard title="Compliance Score" value="94.2%" sub="Global System Average" icon={ShieldCheck} color="indigo" trend={2} loading={statsLoading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        {/* Main Analytics Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Compliance Score Trend
            </h3>
            <select className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-500 px-3 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Distribution Donut */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight mb-8">Bidder Status</h3>
          <div className="flex-1 h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900">{stats?.total_bidders || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="space-y-3 mt-6">
            {pieData.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-tighter">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
                <span className="font-black text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Detailed Bidder Table */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Bidder Evaluation Matrix</h3>
              {evalLoading && <Loader2 size={16} className="animate-spin text-blue-500" />}
            </div>
            <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              View Full Report <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr className="border-b border-slate-100">
                  <th className="py-4 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bidder Name</th>
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Score</th>
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Lvl</th>
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issues</th>
                  <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission</th>
                  <th className="py-4 pr-6"></th>
                </tr>
              </thead>
              <tbody>
                {evaluations && evaluations.length > 0 ? (
                  evaluations.map((ev, idx) => (
                    <BidderRow 
                      key={ev.id || idx}
                      name={ev.bidder_name} 
                      score={ev.ai_score || 0} 
                      status={ev.status} 
                      confidence={ev.ai_score || 0} 
                      issues={ev.status === 'SUBMITTED' ? 'Processing Docs...' : 'None'} 
                      date={ev.submission_date} 
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={40} className="text-slate-200" />
                        <p className="text-slate-400 font-bold text-sm">No active submissions found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories & Audit Trail */}
        <div className="space-y-8">
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight mb-8">Category Benchmarks</h3>
            <div className="space-y-6">
              <CategoryProgress label="Technical" value={88} color="blue" />
              <CategoryProgress label="Financial" value={72} color="emerald" />
              <CategoryProgress label="Compliance" value={95} color="purple" />
              <CategoryProgress label="Experience" value={64} color="amber" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/30 transition-all" />
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Clock size={20} className="text-blue-400" />
              Audit Trail
            </h3>
            <div className="space-y-5 relative z-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log, i) => (
                  <div key={i} className="flex gap-4 border-l-2 border-blue-500/30 pl-4 py-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-sm font-bold text-slate-300">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{log.details}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 font-bold text-center py-10">Waiting for system activity...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
