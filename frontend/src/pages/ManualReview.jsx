import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Save, 
  Maximize2, 
  RotateCw, 
  Download, 
  ZoomIn, 
  ZoomOut,
  AlertTriangle,
  Info,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  Loader2,
  Send,
  History as HistoryIcon
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { apiService, API_BASE_URL } from '../services/api';
import { useApi } from '../hooks/useApi';

// --- Shared Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    'PENDING': 'bg-amber-50 text-amber-600 border-amber-200',
    'APPROVED': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'REJECTED': 'bg-rose-50 text-rose-600 border-rose-200',
    'CLARIFICATION_REQUESTED': 'bg-blue-50 text-blue-600 border-blue-200',
    'DRAFT': 'bg-slate-50 text-slate-600 border-slate-200'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles['PENDING']}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const ManualReview = () => {
  const [docId, setDocId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id')) || 1;
  });
  const [document, setDocument] = useState(null);
  const [history, setHistory] = useState([]);
  const [comment, setComment] = useState('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isClarifyModalOpen, setIsClarifyModalOpen] = useState(false);
  const [clarificationMsg, setClarificationMsg] = useState('');
  const [toast, setToast] = useState(null);

  const { request: fetchDoc, loading } = useApi(apiService.getManualReview);
  const { request: approveDoc, loading: approving } = useApi(apiService.approveDocument);
  const { request: rejectDoc, loading: rejecting } = useApi(apiService.rejectDocument);
  const { request: clarifyDoc, loading: clarifying } = useApi(apiService.requestClarification);
  const { request: saveDoc, loading: saving } = useApi(apiService.saveReview);

  useEffect(() => {
    loadData();
  }, [docId]);

  const loadData = async () => {
    const res = await fetchDoc(docId);
    if (res) {
      setDocument(res.document);
      setHistory(res.history);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    const res = await approveDoc({ document_id: docId, comments: comment });
    if (res) {
      showToast("Document approved successfully", "success");
      loadData();
      setComment('');
    }
  };

  const handleReject = async () => {
    const res = await rejectDoc({ document_id: docId, comments: comment });
    if (res) {
      showToast("Document rejected", "error");
      loadData();
      setComment('');
    }
  };

  const handleClarification = async () => {
    const res = await clarifyDoc({ 
      document_id: docId, 
      bidder_id: document?.bidder_id || 1, 
      message: clarificationMsg 
    });
    if (res) {
      showToast("Clarification request sent to bidder", "info");
      setIsClarifyModalOpen(false);
      setClarificationMsg('');
      loadData();
    }
  };

  const handleSave = async () => {
    const res = await saveDoc({ document_id: docId, comments: comment });
    if (res) {
      showToast("Review draft saved", "success");
      loadData();
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 20 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 left-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm ${
                toast.type === 'success' ? 'bg-emerald-600 text-white' :
                toast.type === 'error' ? 'bg-rose-600 text-white' :
                'bg-blue-600 text-white'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <ShieldCheck size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {document?.type || 'Loading Document...'}
                </h1>
                <StatusBadge status={document?.status || 'PENDING'} />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-2"><User size={14} className="text-blue-500" /> {document?.uploaded_by}</span>
                <span className="flex items-center gap-2"><Clock size={14} className="text-blue-500" /> {document?.uploaded_at}</span>
                <span className="flex items-center gap-2 text-slate-400">ID: REV-{docId.toString().padStart(6, '0')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDocId(prev => Math.max(1, prev - 1))}
              className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <div className="px-4 py-2 bg-slate-50 rounded-xl font-black text-xs text-slate-900">
              {docId} / 12
            </div>
            <button 
              onClick={() => setDocId(prev => prev + 1)}
              className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all"
            >
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Content: Document Viewer */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[800px]">
              {/* Viewer Controls */}
              <div className="px-8 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500"><ZoomOut size={18} /></button>
                  <span className="text-[10px] font-black text-slate-400 min-w-[40px] text-center">{zoom}%</span>
                  <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500"><ZoomIn size={18} /></button>
                  <div className="w-px h-4 bg-slate-200 mx-2" />
                  <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500"><RotateCw size={18} /></button>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 transition-all">
                    <Maximize2 size={14} /> Fullscreen
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-[10px] font-black uppercase text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>

              {/* Viewer Area */}
              <div className="flex-1 bg-slate-200/50 overflow-hidden relative">
                {document?.file_path ? (
                  <iframe 
                    src={`${API_BASE_URL}/uploads/${document.file_path.split(/[/\\]/).pop()}`}
                    className="w-full h-full border-none"
                    title="Review Document"
                    style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transition: 'transform 0.3s ease' }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText size={120} className="text-slate-100 mb-8" />
                    <p className="text-slate-400 font-bold text-lg">No Document Selected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Comments Section */}
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                <MessageSquare className="text-blue-600" size={20} />
                Official Review Comments
              </h3>
              <textarea 
                id="review-comment"
                name="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter detailed review observations, findings, or reasons for rejection..."
                className="w-full h-32 p-6 rounded-[24px] bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 font-medium placeholder:text-slate-400 mb-6"
              />
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 min-w-[160px] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  {approving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Approve Document
                </button>
                <button 
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex-1 min-w-[160px] py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2"
                >
                  {rejecting ? <Loader2 className="animate-spin" /> : <XCircle size={16} />}
                  Reject Document
                </button>
                <button 
                  onClick={() => setIsClarifyModalOpen(true)}
                  className="flex-1 min-w-[160px] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <Info size={16} />
                  Request Clarification
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 min-w-[160px] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Draft
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* AI Intelligence Summary Card */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:bg-blue-500/20 transition-all" />
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">AI Summary</h3>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Automatic Extraction</p>
                </div>
              </div>

              {/* OCR Warning */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex gap-4">
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                <div>
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-tight mb-1">OCR Confidence Warning</h4>
                  <p className="text-[10px] text-amber-500/80 font-medium">Some fields have low character recognition confidence. Manual verification required.</p>
                </div>
              </div>

              {/* AI Score */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Extraction Score</span>
                  <span className="text-3xl font-black text-blue-400">84%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                </div>
              </div>

              {/* Extracted Fields */}
              <div className="space-y-4 mb-8">
                {Object.entries(document?.extracted_data || {}).map(([key, val]) => (
                  <div key={key} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{key.replace('_', ' ')}</span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[8px] font-black uppercase tracking-widest">High Conf</span>
                    </div>
                    <div className="text-sm font-black tracking-tight">
                      {typeof val === 'object' ? JSON.stringify(val) : val}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center">
                <p className="text-[10px] font-bold text-slate-400 italic">"Please verify extracted information manually before approval."</p>
              </div>
            </div>

            {/* Review History Table */}
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm h-[400px] flex flex-col">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                <HistoryIcon className="text-blue-600" size={20} />
                Verification History
              </h3>
              <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                      <th className="pb-3 pr-4">Reviewer</th>
                      <th className="pb-3 pr-4">Action</th>
                      <th className="pb-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-medium text-slate-600 divide-y divide-slate-50">
                    {history.map((h, i) => (
                      <tr key={i} className="group">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <User size={12} />
                            </div>
                            <span className="font-bold text-slate-900">{h.reviewer}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-tighter text-[9px] ${
                            h.action === 'APPROVE' ? 'text-emerald-600 bg-emerald-50' : 
                            h.action === 'REJECT' ? 'text-rose-600 bg-rose-50' : 'text-blue-600 bg-blue-50'
                          }`}>
                            {h.action}
                          </span>
                        </td>
                        <td className="py-4 text-slate-400 font-bold">{h.timestamp}</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400 font-bold italic">No review history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* Clarification Modal */}
        <AnimatePresence>
          {isClarifyModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsClarifyModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-xl p-10 relative z-10 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-blue-50 rounded-3xl text-blue-600">
                    <MessageSquare size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Request Clarification</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Direct communication with bidder</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Message to Bidder</label>
                    <textarea 
                      id="clarification-msg"
                      name="clarification-msg"
                      value={clarificationMsg}
                      onChange={(e) => setClarificationMsg(e.target.value)}
                      placeholder="Specify exactly what information is missing or needs clarification..."
                      className="w-full h-40 p-6 rounded-3xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 font-medium"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsClarifyModalOpen(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleClarification}
                      disabled={clarifying || !clarificationMsg}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
                    >
                      {clarifying ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                      Send Request
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
};

export default ManualReview;
