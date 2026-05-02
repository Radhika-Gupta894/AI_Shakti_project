import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Clock, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

const StatusBadge = ({ status }) => {
  const styles = {
    PASS: "bg-green-50 text-green-600 border-green-100",
    FAIL: "bg-red-50 text-red-600 border-red-100",
    REVIEW: "bg-amber-50 text-amber-600 border-amber-100"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.REVIEW}`}>
      {status}
    </span>
  );
};

const BidderEvaluation = () => {
  const { request: fetchEvaluations, loading, error, data: evaluations } = useApi(apiService.getEvaluations);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const bidders = evaluations || [
    { id: 1, name: "Bharat Electronics Ltd", status: "PASS", score: 98, risk: "LOW", date: "2026-04-28" },
    { id: 2, name: "Modern Garments Pvt", status: "FAIL", score: 45, risk: "HIGH", date: "2026-04-29" },
    { id: 3, name: "Dynamic Solutions", status: "REVIEW", score: 72, risk: "MEDIUM", date: "2026-04-30" },
  ];

  const filteredBidders = bidders.filter(b => 
    (b.name || b.bidder_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bidder Evaluations</h2>
          <p className="text-slate-500">Live evaluation status for active tenders</p>
        </div>
        <button 
          onClick={() => fetchStats()}
          disabled={loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">Failed to load evaluations: {error}</p>
        </div>
      )}

      <div className="glass-card overflow-hidden border-slate-100 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search bidders..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Bidder Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">AI Score</th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4">Submission Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && filteredBidders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                  <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                  Loading evaluations...
                </td>
              </tr>
            ) : filteredBidders.map((bidder) => (
              <tr key={bidder.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-blue/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {(bidder.name || bidder.bidder_name || "B").charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{bidder.name || bidder.bidder_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={bidder.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${(bidder.score || bidder.ai_score) > 80 ? 'bg-green-500' : (bidder.score || bidder.ai_score) > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{width: `${bidder.score || bidder.ai_score}%`}}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{bidder.score || bidder.ai_score}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium ${bidder.risk === 'HIGH' || bidder.risk_level === 'HIGH' ? 'text-red-600' : bidder.risk === 'MEDIUM' ? 'text-amber-600' : 'text-green-600'}`}>
                    ● {bidder.risk || bidder.risk_level}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{bidder.date || bidder.submission_date}</td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    to={`/admin/explain/${bidder.id}`}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg inline-flex items-center gap-2 text-sm font-medium"
                  >
                    <Eye size={16} />
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default BidderEvaluation;
