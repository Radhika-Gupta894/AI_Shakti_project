import React, { useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Users, FileText, CheckCircle2, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

const StatCard = ({ title, value, sub, icon: Icon, color, loading }) => (
  <div className="glass-card p-6 border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    {loading ? <Loader2 className="animate-spin text-slate-300" size={24} /> : <p className="text-3xl font-bold text-slate-800">{value}</p>}
    <p className="text-xs text-slate-400 mt-2">{sub}</p>
  </div>
);

const Dashboard = () => {
  const { request: fetchStats, loading, data: stats } = useApi(apiService.getDashboardStats);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const barData = stats?.bar_data || [
    { name: 'Tender 1', eligible: 12, rejected: 4, review: 2 },
    { name: 'Tender 2', eligible: 8, rejected: 10, review: 5 },
  ];

  const pieData = [
    { name: 'Eligible', value: stats?.eligible || 55, color: '#10b981' },
    { name: 'Rejected', value: stats?.rejected || 25, color: '#ef4444' },
    { name: 'Manual Review', value: stats?.review || 20, color: '#f59e0b' },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Executive Overview</h2>
          <p className="text-slate-500">Real-time procurement metrics and AI insights.</p>
        </div>
        <button onClick={() => fetchStats()} className="btn-secondary py-2 text-sm">Refresh Stats</button>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Bidders" value={stats?.total_bidders || 0} sub="Across active tenders" icon={Users} color="blue" loading={loading} />
        <StatCard title="Pending Review" value={stats?.review || 0} sub="Requires manual approval" icon={AlertTriangle} color="amber" loading={loading} />
        <StatCard title="Evaluated" value={stats?.evaluated || 0} sub="Processed by SHAKTI AI" icon={CheckCircle2} color="emerald" loading={loading} />
        <StatCard title="Active Tenders" value={stats?.active_tenders || 0} sub="Open for applications" icon={FileText} color="indigo" loading={loading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-card p-8 border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg mb-8">Bidder Status by Tender</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="eligible" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="review" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-8 border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg mb-8">Global Eligibility</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
