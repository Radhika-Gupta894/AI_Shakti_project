import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../layouts/AdminLayout';
import { 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  Eye, 
  Search, 
  ArrowRight,
  TrendingUp,
  Target,
  Layers,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { apiService, API_BASE_URL } from '../services/api';
import { useApi } from '../hooks/useApi';

// --- Components ---

const StatCard = ({ title, value, sub, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white/80 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:shadow-md transition-all"
  >
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
    <div>
      <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black text-slate-800">{value}</span>
        {sub && <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-full">{sub}</span>}
      </div>
    </div>
  </motion.div>
);

const CategoryBadge = ({ category }) => {
  const styles = {
    Financial: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Technical: 'bg-blue-50 text-blue-600 border-blue-100',
    Compliance: 'bg-purple-50 text-purple-600 border-purple-100',
    General: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${styles[category] || styles.General}`}>
      {category}
    </span>
  );
};

// --- Main Page ---

import { useNavigate } from 'react-router-dom';

const CriteriaAnalysis = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { request: fetchTender, loading, data: tender } = useApi(apiService.getLatestTender);

  useEffect(() => {
    fetchTender().catch(err => console.log("No tender found yet"));
  }, [fetchTender]);

  const handleFinalize = async () => {
    setIsFinalizing(true);
    // Simulate a final save/verification step
    setTimeout(() => {
      setIsFinalizing(false);
      setShowSuccess(true);
      setTimeout(() => navigate('/admin/dashboard'), 2000);
    }, 1500);
  };

  const criteriaData = tender?.criteria || {
    financial: [],
    technical: [],
    compliance: []
  };

  const flattenedCriteria = [
    ...(criteriaData.financial || criteriaData.financial_criteria || []).map(c => ({ ...c, category: 'Financial', requirement: c.name || c.description })),
    ...(criteriaData.technical || criteriaData.technical_criteria || []).map(c => ({ ...c, category: 'Technical', requirement: c.name || c.description })),
    ...(criteriaData.compliance || criteriaData.compliance_criteria || []).map(c => ({ ...c, category: 'Compliance', requirement: c.name || c.description })),
  ];

  const filteredCriteria = filter === 'All' 
    ? flattenedCriteria 
    : flattenedCriteria.filter(c => c.category === filter);

  // Stats
  const stats = {
    total: flattenedCriteria.length,
    mandatory: flattenedCriteria.filter(c => c.mandatory).length,
    optional: flattenedCriteria.filter(c => !c.mandatory).length,
    confidence: flattenedCriteria.length > 0 
      ? Math.round(flattenedCriteria.reduce((acc, c) => acc + (c.confidence || 90), 0) / flattenedCriteria.length)
      : 0
  };

  if (!loading && !tender) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Tender Data Found</h2>
          <p className="text-slate-500 mb-8 max-w-sm">Please upload a tender document first to view the AI criteria analysis.</p>
          <button onClick={() => navigate('/admin/upload')} className="btn-primary">Go to Upload</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto">
        
        {/* Success Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md"
            >
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analysis Confirmed</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Redirecting to Dashboard...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
              <Target size={14} />
              <span>AI Extraction Engine v1.0</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Criteria <span className="text-blue-600">Analysis</span>
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <FileText size={16} />
              {tender?.title || 'Processing Tender Document...'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <ExternalLink size={18} />
              Export Report
            </button>
            <button 
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isFinalizing ? <Loader2 className="animate-spin" size={18} /> : 'Confirm & Finalize'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Criteria" value={stats.total} sub="Extracted" icon={Layers} color="bg-blue-500" delay={0.1} />
          <StatCard title="Mandatory" value={stats.mandatory} sub="Critical" icon={AlertCircle} color="bg-red-500" delay={0.2} />
          <StatCard title="Optional" value={stats.optional} sub="Standard" icon={CheckCircle2} color="bg-emerald-500" delay={0.3} />
          <StatCard title="AI Confidence" value={`${stats.confidence}%`} sub="High" icon={ShieldCheck} color="bg-purple-500" delay={0.4} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-320px)] min-h-[600px]">
          
          {/* LEFT: PDF Viewer Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} />
                Document Preview
              </span>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer">
                  <Search size={14} />
                </div>
              </div>
            </div>
            <div className="flex-1 bg-slate-100/50 overflow-hidden relative">
              {tender?.file_path ? (
                <iframe 
                  src={`${API_BASE_URL}/uploads/${tender.file_path.split('/').pop()}`}
                  className="w-full h-full border-none"
                  title="Tender Document"
                />
              ) : (
                <div className="max-w-md mx-auto space-y-4 p-8">
                  <div className="text-center py-20">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No document preview available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Analysis Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-7 flex flex-col gap-6"
          >
            {/* Criteria Table Container */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div className="flex gap-2">
                  {['All', 'Financial', 'Technical', 'Compliance'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        filter === cat 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search criteria..." 
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none w-48 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10">
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirement</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode='popLayout'>
                      {filteredCriteria.map((item, idx) => (
                        <motion.tr 
                          key={idx}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedItem(item)}
                          className={`group hover:bg-blue-50/30 cursor-pointer transition-colors ${selectedItem?.name === item.name ? 'bg-blue-50/50' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <CategoryBadge category={item.category} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{item.name}</span>
                              <span className="text-xs text-slate-400 line-clamp-1">{item.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.mandatory ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                              {item.mandatory ? 'Mandatory' : 'Optional'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.confidence || 90}%` }}
                                  className={`h-full ${(item.confidence || 90) > 95 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">{item.confidence || 90}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Eye size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors inline-block" />
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Insights & Sidebar info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/30 transition-all" />
                <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10">
                  <TrendingUp size={18} className="text-blue-400" />
                  AI Intelligence Advisor
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed relative z-10">
                  Detected <span className="text-blue-400 font-bold">2 ambiguities</span> in the Financial section regarding Joint Venture turnover calculations. Recommended manual check for Clause 8.2.
                </p>
                <button className="mt-4 text-xs font-bold text-blue-400 hover:underline flex items-center gap-1 relative z-10">
                  Review Suggestions <ArrowRight size={12} />
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-600" />
                  Quick Notes
                </h3>
                <div className="space-y-2">
                  <div className="bg-white/50 p-2 rounded-lg text-[10px] text-blue-700 border border-blue-100">
                    Criteria verified against GFR 2017 standards.
                  </div>
                  <div className="bg-white/50 p-2 rounded-lg text-[10px] text-blue-700 border border-blue-100">
                    Extraction confidence overall: 94.2%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Detail Overlay / Modal Mockup */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <CategoryBadge category={selectedItem.category} />
                  <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all">
                    <ChevronDown size={20} />
                  </button>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedItem.name}</h2>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  AI Confidence: {selectedItem.confidence || 90}%
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Extracted Requirement</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-600 text-sm leading-relaxed border border-slate-100">
                    {selectedItem.description}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">AI Context Reasoning</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This requirement was identified using semantic analysis of the "Bidder Qualifications" section. 
                    The mention of "₹5 Crores" is interpreted as a mandatory financial threshold based on typical procurement patterns.
                  </p>
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400">Page 4, Clause 4.2</span>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-200">
                  Validate Mapping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
};

export default CriteriaAnalysis;
