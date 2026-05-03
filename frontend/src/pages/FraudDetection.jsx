import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ShieldAlert, Users, Link as LinkIcon,
  Search, Info, TrendingUp, ChevronRight, Shield,
  Download, Flag, ScanLine, FileBarChart2, Loader2, CheckCircle
} from 'lucide-react';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';
import AdminLayout from '../layouts/AdminLayout';

// ─── Color System ────────────────────────────────────────────────────────────
const RISK = {
  High:   { bg: 'bg-red-500/15',    border: 'border-red-500/40',    text: 'text-red-400',    bar: 'bg-red-500',    badge: 'bg-red-500/20 text-red-300 border-red-500/30',    dot: '#ef4444' },
  Medium: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  bar: 'bg-amber-500',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: '#f59e0b' },
  Low:    { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-400',bar: 'bg-emerald-500',badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: '#10b981' },
};
const riskOf = (level) => RISK[level] || RISK.Low;

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, variant, delay }) => {
  const styles = {
    blue:    { wrap: 'border-blue-500/20',    glow: 'bg-blue-500/10',    icon: 'bg-blue-500/20 text-blue-400' },
    red:     { wrap: 'border-red-500/20',     glow: 'bg-red-500/10',     icon: 'bg-red-500/20 text-red-400' },
    amber:   { wrap: 'border-amber-500/20',   glow: 'bg-amber-500/10',   icon: 'bg-amber-500/20 text-amber-400' },
    emerald: { wrap: 'border-emerald-500/20', glow: 'bg-emerald-500/10', icon: 'bg-emerald-500/20 text-emerald-400' },
  }[variant] || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`bg-white/5 backdrop-blur-xl border ${styles.wrap} p-6 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-all`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 ${styles.glow} blur-3xl rounded-full -mr-10 -mt-10`} />
      <div className={`inline-flex p-3 rounded-2xl ${styles.icon} mb-4`}>
        <Icon size={22} />
      </div>
      <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </motion.div>
  );
};

// ─── Risk Badge ───────────────────────────────────────────────────────────────
const RiskBadge = ({ level }) => {
  const r = riskOf(level);
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${r.badge}`}>
      {level}
    </span>
  );
};

// ─── Network Graph ────────────────────────────────────────────────────────────
const NetworkGraph = ({ alerts }) => {
  const nodes = [];
  const links = [];
  const seen = new Set();

  alerts.slice(0, 8).forEach((a) => {
    if (!seen.has(a.company1)) { nodes.push({ id: a.company1, x: 150 + Math.random() * 480, y: 80 + Math.random() * 280 }); seen.add(a.company1); }
    if (!seen.has(a.company2)) { nodes.push({ id: a.company2, x: 150 + Math.random() * 480, y: 80 + Math.random() * 280 }); seen.add(a.company2); }
    links.push({ source: a.company1, target: a.company2, risk: a.risk_level, score: a.risk_score });
  });

  return (
    <div className="w-full h-[360px] bg-slate-900/60 rounded-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04),transparent_70%)]" />
      <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] text-blue-300/50 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/10 z-10">
        <Info size={12} /> Bidder Relationship Map
      </div>
      <svg className="w-full h-full">
        {links.map((l, i) => {
          const s = nodes.find(n => n.id === l.source);
          const t = nodes.find(n => n.id === l.target);
          if (!s || !t) return null;
          const color = riskOf(l.risk).dot;
          return (
            <motion.line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={color} strokeWidth={Math.max(1, (l.score || 0) / 20)}
              strokeDasharray="4 4" opacity={0.5}
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: i * 0.15 }}
            />
          );
        })}
        {nodes.map((n, i) => (
          <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, delay: i * 0.08 }}>
            <circle cx={n.x} cy={n.y} r={22} fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <text x={n.x} y={n.y + 38} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">
              {n.id.length > 14 ? n.id.slice(0, 11) + '…' : n.id}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
};

// ─── Alert Table ──────────────────────────────────────────────────────────────
const FraudAlertTable = ({ alerts, filter }) => {
  const filtered = filter === 'All' ? alerts : alerts.filter(a => a.risk_level === filter);

  if (filtered.length === 0) return (
    <div className="py-16 text-center">
      <CheckCircle size={40} className="text-emerald-500/40 mx-auto mb-3" />
      <p className="text-white/40 font-bold">No alerts for this filter.</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10">
            {['Relationship', 'Risk Level', 'Factors', 'Score', 'Action'].map(h => (
              <th key={h} className="pb-4 pr-4 text-white/30 text-[10px] font-black uppercase tracking-widest">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {filtered.map((alert, idx) => {
            const r = riskOf(alert.risk_level);
            return (
              <motion.tr key={idx}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                className={`group transition-colors ${alert.risk_level === 'High' ? 'hover:bg-red-500/5' : alert.risk_level === 'Medium' ? 'hover:bg-amber-500/5' : 'hover:bg-emerald-500/5'}`}
              >
                {/* Relationship */}
                <td className="py-4 pr-4">
                  <div className={`flex items-start gap-2 pl-3 border-l-2 ${r.border}`}>
                    <div>
                      <p className="text-white font-semibold text-sm leading-tight">{alert.company1 || '—'}</p>
                      <p className="text-white/30 text-[10px] uppercase tracking-widest my-0.5 flex items-center gap-1">
                        <LinkIcon size={9} /> linked to
                      </p>
                      <p className="text-white/70 text-sm">{alert.company2 || '—'}</p>
                    </div>
                  </div>
                </td>
                {/* Risk Badge */}
                <td className="py-4 pr-4"><RiskBadge level={alert.risk_level} /></td>
                {/* Factors */}
                <td className="py-4 pr-4 max-w-[220px]">
                  <div className="flex flex-wrap gap-1">
                    {(alert.reasons || []).map((r, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/5 text-white/50 border border-white/10">{r}</span>
                    ))}
                    {(!alert.reasons || alert.reasons.length === 0) && <span className="text-white/30 text-xs">—</span>}
                  </div>
                </td>
                {/* Score bar */}
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div className={`h-full ${riskOf(alert.risk_level).bar}`}
                        initial={{ width: 0 }} animate={{ width: `${Math.min(alert.risk_score || 0, 100)}%` }} />
                    </div>
                    <span className={`text-xs font-black ${riskOf(alert.risk_level).text}`}>{alert.risk_score || 0}</span>
                  </div>
                </td>
                {/* Action */}
                <td className="py-4">
                  <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                    <ChevronRight size={16} />
                  </button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FraudDetection = () => {
  const { request: fetchAlerts, loading: alertsLoading, data: alertsData } = useApi(apiService.getFraudAlerts);
  const { request: fetchSummary, data: summaryData } = useApi(apiService.getFraudSummary);
  const { request: triggerScan, loading: scanLoading } = useApi(apiService.runFraudScan);
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState(null);

  const alerts = alertsData || [];
  const summary = summaryData || { total_alerts: 0, high_risk: 0, medium_risk: 0, low_risk: 0 };

  // Stable fetch ref to avoid re-render loops
  const fetchRef = useRef({ fetchAlerts, fetchSummary });
  useEffect(() => { fetchRef.current = { fetchAlerts, fetchSummary }; }, [fetchAlerts, fetchSummary]);
  useEffect(() => { fetchRef.current.fetchAlerts(); fetchRef.current.fetchSummary(); }, []);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const handleScan = async () => {
    try {
      await triggerScan();
      await Promise.all([fetchAlerts(), fetchSummary()]);
      showToast('✅ Scan complete. New patterns indexed.');
    } catch { showToast('❌ Scan failed. Check backend logs.', false); }
  };

  const handleExport = () => {
    const rows = [['Company 1','Company 2','Risk Level','Risk Score','Reasons']];
    alerts.forEach(a => rows.push([a.company1, a.company2, a.risk_level, a.risk_score, (a.reasons||[]).join('; ')]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'fraud_report.csv';
    a.click();
  };

  const chartData = [
    { name: 'High',   value: summary.high_risk   || 0, color: '#ef4444' },
    { name: 'Medium', value: summary.medium_risk  || 0, color: '#f59e0b' },
    { name: 'Low',    value: summary.low_risk     || 0, color: '#10b981' },
  ];

  return (
    <AdminLayout>
      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </motion.div>
      )}

      {/* Dark Mode Workspace Wrapper */}
      <div className="bg-[#0B1120] -mx-6 lg:-mx-10 -mt-6 -mb-12 px-6 lg:px-10 pt-10 pb-24 min-h-screen relative overflow-hidden rounded-t-[40px] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-800">
        
        {/* Ambient Light Effects */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest mb-2">
                <ShieldAlert size={14} /> Security Intelligence
              </div>
              <h1 className="text-5xl font-black tracking-tight text-white">
                Fraud <span className="text-blue-500">Detection</span>
              </h1>
              <p className="text-white/40 text-sm mt-2">AI-powered collusion & anomaly scanner</p>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={handleScan} disabled={scanLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-wait rounded-2xl font-bold text-sm text-white shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all">
                {scanLoading ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                {scanLoading ? 'Scanning…' : 'Scan Database'}
              </button>
              <button
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-2xl font-bold text-sm text-white shadow-lg shadow-violet-600/20 flex items-center gap-2 transition-all">
                <Flag size={16} /> Flag Selected
              </button>
              <button onClick={handleExport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-sm text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all">
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard title="Total Alerts"   value={summary.total_alerts || 0} icon={AlertTriangle}  variant="blue"    delay={0.05} />
          <StatCard title="High Risk"      value={summary.high_risk   || 0} icon={ShieldAlert}    variant="red"     delay={0.1}  />
          <StatCard title="Medium Risk"    value={summary.medium_risk || 0} icon={Info}            variant="amber"   delay={0.15} />
          <StatCard title="Low Risk"       value={summary.low_risk    || 0} icon={Shield}          variant="emerald" delay={0.2}  />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Graph + Table */}
          <div className="lg:col-span-2 space-y-8">

            {/* Network graph */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                <LinkIcon size={18} className="text-blue-400" /> Bidder Relationship Map
              </h2>
              {alertsLoading && alerts.length === 0
                ? <div className="h-[360px] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-400" /></div>
                : alerts.length === 0
                  ? <div className="h-[360px] flex flex-col items-center justify-center gap-3 text-white/30"><Shield size={48} /><p className="font-bold">No suspicious relationships found</p></div>
                  : <NetworkGraph alerts={alerts} />
              }
            </motion.div>

            {/* Alert Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-400" /> Active Fraud Alerts
                </h2>
                {/* Filter tabs */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                  {['All', 'High', 'Medium', 'Low'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === f
                        ? f === 'High' ? 'bg-red-500/20 text-red-300' : f === 'Medium' ? 'bg-amber-500/20 text-amber-300' : f === 'Low' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                        : 'text-white/30 hover:text-white/60'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <FraudAlertTable alerts={alerts} filter={filter} />
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">

            {/* Donut chart */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
              <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <FileBarChart2 size={16} className="text-blue-400" /> Risk Distribution
              </h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#fff', borderRadius: 12 }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {chartData.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name} Risk
                    </div>
                    <span className="font-black text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Advisor */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 p-8 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <ShieldAlert size={18} className="text-white" />
                </div>
                <h2 className="font-bold text-white">AI Intelligence Advisor</h2>
              </div>

              {alerts.length > 0 ? (
                <>
                  {/* Top alert preview */}
                  <div className={`rounded-2xl p-4 mb-4 border ${riskOf(alerts[0].risk_level).border} ${riskOf(alerts[0].risk_level).bg}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${riskOf(alerts[0].risk_level).text}`}>
                      ⚠ Highest Priority Alert
                    </p>
                    <p className="text-white/80 text-sm leading-relaxed">
                      <span className="font-bold text-white">{alerts[0].company1}</span> and <span className="font-bold text-white">{alerts[0].company2}</span> share suspicious connections: {(alerts[0].reasons || []).join(', ') || 'unknown pattern'}.
                    </p>
                  </div>
                  <p className="text-blue-200/50 text-xs leading-relaxed">
                    Recommend immediate investigation. {summary.high_risk} high-risk pair{summary.high_risk !== 1 ? 's' : ''} require review.
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <CheckCircle size={32} className="text-emerald-400" />
                  <p className="text-white/60 text-sm text-center">No active threats detected. System is secure.</p>
                </div>
              )}

              <button className="w-full mt-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest border border-white/10 transition-all">
                View Full Audit Log
              </button>
            </motion.div>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default FraudDetection;
