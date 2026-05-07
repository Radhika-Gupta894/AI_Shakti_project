import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Eye, FileText, CheckCircle, XCircle, 
  AlertTriangle, Download, Loader2, PlayCircle, MoreVertical
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { apiService } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';

const BidderEvaluationContent = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await apiService.getEvaluations();
      if (res?.data && Array.isArray(res.data)) {
        setEvaluations(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch evaluations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await apiService.approveBidder(id);
      await fetchEvaluations();
    } catch(e) {
      alert("Error approving bidder");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      setProcessingId(id);
      await apiService.rejectBidder(id, reason);
      await fetchEvaluations();
    } catch(e) {
      alert("Error rejecting bidder");
    } finally {
      setProcessingId(null);
    }
  };

  const handleManualReview = async (id) => {
    const reason = prompt("Enter manual review reason:");
    if (!reason) return;
    try {
      setProcessingId(id);
      await apiService.sendToManualReview(id, reason);
      await fetchEvaluations();
    } catch(e) {
      alert("Error sending to manual review");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRunEvaluation = async (tenderId, bidderId) => {
    try {
      setProcessingId(bidderId);
      await apiService.evaluateBidder(tenderId, bidderId);
      await fetchEvaluations();
    } catch(e) {
      alert("Error running evaluation");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = evaluations.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = e.bidder_name?.toLowerCase().includes(term) || e.tender_title?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'ALL' || e.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch(status?.toUpperCase()) {
      case 'PASS':
      case 'ELIGIBLE':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle size={12}/> {status}</span>;
      case 'FAIL':
      case 'REJECTED':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle size={12}/> {status}</span>;
      case 'REVIEW':
      case 'MANUAL REVIEW':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><AlertTriangle size={12}/> {status}</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"><Loader2 size={12} className="animate-spin"/> {status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Bidder Evaluation</h1>
          <p className="text-slate-500">Manage AI-driven evaluations, approve bidders, and oversee manual reviews.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by bidder or tender..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PASS">Passed AI</option>
              <option value="ELIGIBLE">Eligible (Approved)</option>
              <option value="REVIEW">Needs Review</option>
              <option value="FAIL">Failed AI</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Bidder & Tender</th>
                <th className="py-4 px-6">AI Score</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Submitted At</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Loading evaluations...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                    No bidders match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((evalRecord) => (
                  <tr key={evalRecord.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {evalRecord.bidder_name?.charAt(0)?.toUpperCase() || 'B'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{evalRecord.bidder_name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{evalRecord.tender_title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${evalRecord.ai_score >= 80 ? 'bg-green-500' : evalRecord.ai_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                            style={{ width: `${Math.max(10, evalRecord.ai_score || 0)}%` }} 
                          />
                        </div>
                        <span className="font-bold text-slate-700">{evalRecord.ai_score}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(evalRecord.status)}
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                      {evalRecord.submission_date}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {processingId === evalRecord.id ? (
                        <div className="flex justify-end pr-4"><Loader2 className="animate-spin text-blue-500" size={20}/></div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                          
                          {/* Quick Actions */}
                          {evalRecord.status === 'REVIEW' && (
                            <>
                              <button onClick={() => handleApprove(evalRecord.id)} title="Approve" className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"><CheckCircle size={16} /></button>
                              <button onClick={() => handleReject(evalRecord.id)} title="Reject" className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><XCircle size={16} /></button>
                            </>
                          )}

                          {/* Run/Re-run Evaluation */}
                          <button 
                            onClick={() => handleRunEvaluation(evalRecord.tender_id, evalRecord.bidder_id)} 
                            title={evalRecord.status === 'SUBMITTED' ? "Run AI Evaluation" : "Re-run AI Evaluation"} 
                            className={`p-2 rounded-lg transition-colors ${evalRecord.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                          >
                            <PlayCircle size={16} />
                          </button>

                          {/* Quick Decision Actions */}
                          {(evalRecord.status === 'PASS' || evalRecord.status === 'FAIL' || evalRecord.status === 'REVIEW' || evalRecord.status === 'Eligible' || evalRecord.status === 'Not Eligible' || evalRecord.status === 'Needs Manual Review') && (
                            <button onClick={() => handleManualReview(evalRecord.id)} title="Flag for Manual Review" className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"><AlertTriangle size={16} /></button>
                          )}

                          {/* View Explainability */}
                          <Link 
                            to={`/admin/explain/${evalRecord.id}`} 
                            title="View AI Explainability"
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            <Eye size={14} /> View
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

const BidderEvaluation = () => (
  <ErrorBoundary>
    <BidderEvaluationContent />
  </ErrorBoundary>
);

export default BidderEvaluation;
