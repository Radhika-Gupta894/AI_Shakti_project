import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Users, 
  Link as LinkIcon, 
  Search, 
  Info,
  TrendingUp,
  MapPin,
  Phone,
  FileText,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// --- Components ---

const StatCard = ({ title, value, color, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/50 transition-all cursor-default"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 blur-3xl group-hover:bg-${color}-500/20 transition-all rounded-full -mr-10 -mt-10`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-2xl bg-${color}-500/20 text-${color}-400`}>
        <Icon size={24} />
      </div>
      <div className="flex items-center gap-1 text-green-400 text-xs font-medium bg-green-400/10 px-2 py-1 rounded-full">
        <TrendingUp size={12} />
        <span>Live</span>
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-blue-200/60 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  </motion.div>
);

const NetworkGraph = ({ alerts }) => {
  // Simple logic to build nodes and links from alerts
  const nodes = [];
  const links = [];
  const processedCompanies = new Set();

  alerts.slice(0, 8).forEach((alert, idx) => {
    if (!processedCompanies.has(alert.company1)) {
      nodes.push({ id: alert.company1, type: 'bidder', x: 150 + Math.random() * 500, y: 100 + Math.random() * 300 });
      processedCompanies.add(alert.company1);
    }
    if (!processedCompanies.has(alert.company2)) {
      nodes.push({ id: alert.company2, type: 'bidder', x: 150 + Math.random() * 500, y: 100 + Math.random() * 300 });
      processedCompanies.add(alert.company2);
    }
    links.push({ source: alert.company1, target: alert.company2, risk: alert.risk_level, score: alert.risk_score });
  });

  return (
    <div className="w-full h-[400px] bg-slate-900/50 rounded-3xl border border-white/5 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.05)_0%,_transparent_70%)]" />
      <svg className="w-full h-full relative z-10">
        {links.map((link, i) => {
          const s = nodes.find(n => n.id === link.source);
          const t = nodes.find(n => n.id === link.target);
          if (!s || !t) return null;
          return (
            <motion.line
              key={`link-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: i * 0.2 }}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={link.risk === 'High' ? '#ef4444' : link.risk === 'Medium' ? '#f59e0b' : '#3b82f6'}
              strokeWidth={Math.max(1, link.score / 20)}
              strokeDasharray="5,5"
              className="opacity-40"
            />
          );
        })}
        {nodes.map((node, i) => (
          <motion.g
            key={`node-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: i * 0.1 }}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={node.x} cy={node.y} r={25} fill="#1e293b" stroke="#3b82f6" strokeWidth="2" className="drop-shadow-2xl" />
            <text x={node.x} y={node.y + 45} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500">
              {node.id.length > 15 ? node.id.substring(0, 12) + '...' : node.id}
            </text>
            <foreignObject x={node.x - 10} y={node.y - 10} width={20} height={20}>
              <Users size={20} className="text-blue-400" />
            </foreignObject>
          </motion.g>
        ))}
      </svg>
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-blue-300/60 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
          <Info size={14} />
          <span>Interactive Relationship Map</span>
        </div>
      </div>
    </div>
  );
};

const FraudAlertTable = ({ alerts }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-white/10">
          <th className="pb-4 text-blue-300/50 text-xs font-semibold uppercase tracking-wider">Relationship</th>
          <th className="pb-4 text-blue-300/50 text-xs font-semibold uppercase tracking-wider">Risk Factors</th>
          <th className="pb-4 text-blue-300/50 text-xs font-semibold uppercase tracking-wider">Risk Score</th>
          <th className="pb-4 text-blue-300/50 text-xs font-semibold uppercase tracking-wider">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {alerts.map((alert, idx) => (
          <motion.tr 
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group hover:bg-white/5 transition-colors"
          >
            <td className="py-5">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-white font-medium">{alert.company1}</span>
                  <div className="flex items-center gap-1 text-blue-400/40">
                    <LinkIcon size={12} />
                    <span className="text-[10px] uppercase font-bold tracking-tighter">Connected To</span>
                  </div>
                  <span className="text-white/70">{alert.company2}</span>
                </div>
              </div>
            </td>
            <td className="py-5">
              <div className="flex flex-wrap gap-1.5">
                {alert.reasons.map((reason, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {reason}
                  </span>
                ))}
              </div>
            </td>
            <td className="py-5">
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${alert.risk_score}%` }}
                    className={`h-full ${alert.risk_level === 'High' ? 'bg-red-500' : alert.risk_level === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}
                  />
                </div>
                <span className={`text-xs font-bold ${alert.risk_level === 'High' ? 'text-red-400' : alert.risk_level === 'Medium' ? 'text-amber-400' : 'text-blue-400'}`}>
                  {alert.risk_score}
                </span>
              </div>
            </td>
            <td className="py-5">
              <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-300 transition-all">
                <ChevronRight size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Main Page ---

const FraudDetection = () => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ total_alerts: 0, high_risk: 0, medium_risk: 0, low_risk: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/fraud-detection`),
        axios.get(`${API_BASE_URL}/fraud-detection/summary`)
      ]);
      setAlerts(alertsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Error fetching fraud data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'High', value: summary.high_risk, color: '#ef4444' },
    { name: 'Medium', value: summary.medium_risk, color: '#f59e0b' },
    { name: 'Low', value: summary.low_risk, color: '#3b82f6' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050b18] text-white p-8 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-blue-400 mb-2 font-bold tracking-widest text-xs uppercase"
            >
              <ShieldAlert size={14} />
              <span>Security Intelligence</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black tracking-tight"
            >
              Fraud <span className="text-blue-500">Detection</span>
            </motion.h1>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
              <Search size={18} />
              Scan Database
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Fraud Alerts" value={summary.total_alerts} color="blue" icon={AlertTriangle} delay={0.1} />
          <StatCard title="High Risk Cases" value={summary.high_risk} color="red" icon={ShieldAlert} delay={0.2} />
          <StatCard title="Medium Risk" value={summary.medium_risk} color="amber" icon={Info} delay={0.3} />
          <StatCard title="Safe Records" value="2.4k" color="green" icon={Users} delay={0.4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Visualizations */}
          <div className="lg:col-span-2 space-y-8">
            {/* Network Map */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <LinkIcon size={20} className="text-blue-400" />
                  Bidder Relationship Map
                </h2>
              </div>
              <NetworkGraph alerts={alerts} />
            </motion.div>

            {/* Alert Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-400" />
                Active Fraud Alerts
              </h2>
              <FraudAlertTable alerts={alerts} />
            </motion.div>
          </div>

          {/* Right Sidebar - Distribution & AI Insights */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
            >
              <h2 className="text-lg font-bold mb-6">Risk Distribution</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {chartData.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name} Risk
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Advisor Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-blue-500/20 p-8 rounded-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/30">
                  <ShieldAlert size={20} />
                </div>
                <h2 className="font-bold">AI Intelligence Advisor</h2>
              </div>
              <p className="text-blue-200/70 text-sm leading-relaxed mb-4">
                Pattern detected: 3 bidders in the latest tender share identical physical addresses in Mumbai. 
                <span className="text-red-400 font-bold block mt-2">Recommended Action:</span>
                Initiate manual site verification and suspend evaluation for Bidder #104.
              </p>
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all border border-white/5">
                View Full Audit
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudDetection;
