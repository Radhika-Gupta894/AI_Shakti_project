import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../layouts/AdminLayout';
import {
  FileText, ShieldCheck, AlertCircle, CheckCircle2, Filter, Eye, Search, ArrowRight,
  TrendingUp, Target, Layers, ChevronDown, ExternalLink, MessageSquare, Loader2,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Download, Printer,
  MousePointer2, Type, Highlighter, PenTool, StickyNote, Activity, Database,
  Cpu, Zap, Send, Edit3, Save, X, Lightbulb, Plus, Flag, FileJson, Eraser, ShieldAlert, Trash2
} from 'lucide-react';
import { apiService, API_BASE_URL } from '../services/api';
<<<<<<< HEAD
import { useNavigate, useSearchParams } from 'react-router-dom';
=======
import { useNavigate, useLocation } from 'react-router-dom';
>>>>>>> e45c444 (my local changes)

const StatCard = ({ title, value, sub, icon: Icon, bgClass, textClass, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
    className="bg-white/80 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
    <div className={`p-3 rounded-xl ${bgClass} group-hover:scale-110 transition-transform`}>
      <Icon className={textClass} size={24} />
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
    Financial: 'bg-green-50 text-green-600 border-green-100',
    Technical: 'bg-blue-50 text-blue-600 border-blue-100',
    Compliance: 'bg-purple-50 text-purple-600 border-purple-100',
    Experience: 'bg-orange-50 text-orange-600 border-orange-100',
    General: 'bg-slate-50 text-slate-600 border-slate-100'
  };
  return <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${styles[category] || styles.General}`}>{category}</span>;
};

const CriteriaAnalysis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTenderId = searchParams.get('id');

  const [criteria, setCriteria] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  const [selectedTenderId, setSelectedTenderId] = useState(null);

  // Filter & UI States
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'category', direction: 'asc' });
  const [expandedId, setExpandedId] = useState(null);

  // Modals
  const [explainModal, setExplainModal] = useState(null);
  const [editCriteria, setEditCriteria] = useState(null);
  const [addCriteriaModal, setAddCriteriaModal] = useState(false);
  const [newCriteria, setNewCriteria] = useState({
    tender_id: '',
    title: '',
    description: '',
    category: 'Technical',
    mandatory: true,
    value: '',
    confidence: 0.90,
    weightage: 0,
    max_score: 100
  });
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [tenderSummary, setTenderSummary] = useState(null);
  
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [toast, setToast] = useState(null);

  // PDF states
  const [zoom, setZoom] = useState(1);
  const [pdfPage, setPdfPage] = useState(1);
  const [activeTool, setActiveTool] = useState('cursor');
  const [activeColor, setActiveColor] = useState('bg-yellow-400');
  const [mappedCriteria, setMappedCriteria] = useState(null);

  // Annotation states
  const [annotations, setAnnotations] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
<<<<<<< HEAD
=======
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  // AI Chat & Status states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([{ sender: 'ai', text: 'Hello! I am the SHAKTI AI Assistant. I have extracted and deduplicated the criteria for this tender. How can I help?' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sysStatus, setSysStatus] = useState(null);
  const chatEndRef = useRef(null);

  const location = useLocation();
>>>>>>> e45c444 (my local changes)

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const tendersRes = await apiService.getTenders();
        const allTenders = tendersRes.data || [];
        setTenders(allTenders);

        let targetTender = null;
        if (urlTenderId) {
          targetTender = allTenders.find(t => String(t.id) === String(urlTenderId));
        }
        
<<<<<<< HEAD
        // Priority: 1. URL ID, 2. First tender with a file path, 3. First tender overall
        if (!targetTender && allTenders.length > 0) {
          targetTender = allTenders.find(t => t.file_path) || allTenders[0];
        }

        if (targetTender) {
          console.log("🎯 Selected Tender:", targetTender.id, "Path:", targetTender.file_path);
          setSelectedTender(targetTender);
          setSelectedTenderId(targetTender.id);
          setNewCriteria(prev => ({ ...prev, tender_id: targetTender.id }));
          fetchCriteria(targetTender.id);
        } else {
          console.warn("⚠️ No tender selected during initialization.");
=======
        const allTenders = tendersRes.data || [];
        setTenders(allTenders);

        // Priority: 1. State from location, 2. Latest Tender from API
        const targetTenderId = location.state?.tenderId;
        const initialTender = targetTenderId 
          ? allTenders.find(t => t.id === targetTenderId)
          : tenderRes.data;

        if (initialTender) {
          setSelectedTender(initialTender);
          setSelectedTenderId(initialTender.id);
          setNewCriteria(prev => ({ ...prev, tender_id: initialTender.id }));
          fetchCriteria(initialTender.id);
>>>>>>> e45c444 (my local changes)
        }
      } catch (err) {
        console.error("❌ Initialization failed:", err);
        showToast("Failed to load tenders", "error");
      } finally {
        setIsLoading(false);
      }
    };
    init();
<<<<<<< HEAD
  }, [urlTenderId]);
=======
  }, [location.state]);
>>>>>>> e45c444 (my local changes)

  const fetchCriteria = async (tenderId) => {
    try {
      const res = await apiService.getCriteria(tenderId);
      setCriteria(res.data || []);
    } catch (err) {
      showToast("Failed to fetch criteria", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSummary = async () => {
    if (!selectedTenderId) return;
    setIsLoading(true);
    try {
      const res = await apiService.getTenderSummary(selectedTenderId);
      setTenderSummary(res.data.summary);
      setShowSummaryModal(true);
    } catch (err) {
      showToast("AI Summary engine is busy", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIExtract = async () => {
    if (!selectedTenderId) return showToast("Please select a tender first", "error");
    setIsLoading(true);
    try {
      const res = await apiService.extractCriteria(selectedTenderId, true); // force=true to always re-run
      if (res.data.success) {
<<<<<<< HEAD
        setCriteria(res.data.data || []);
        showToast(`AI successfully extracted ${res.data.count} new criteria!`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "AI Extraction failed";
=======
        const data = res.data.data || [];
        setCriteria(data);
        if (data.length === 0) {
          showToast(res.data.message || "No criteria found in document. Try a different file.", "warning");
        } else {
          showToast(`✅ AI extracted ${res.data.count || data.length} criteria from document!`, "success");
        }
      } else {
        const errMsg = res.data.error || "AI was unable to process this document";
        console.error("❌ Extraction backend error:", errMsg);
        showToast(errMsg, "error");
      }
    } catch (err) {
      console.error("❌ AI Extraction Error:", err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message || "AI Extraction failed";
>>>>>>> e45c444 (my local changes)
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCriteria = useMemo(() => {
    return criteria
      .filter(c => filter === 'All' || c.category === filter)
      .filter(c => searchQuery === '' ||
        (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [criteria, filter, searchQuery]);

  const sortedCriteria = useMemo(() => {
    if (!sortConfig.key) return filteredCriteria;
    return [...filteredCriteria].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCriteria, sortConfig]);

  const handleExport = (type) => {
    if (type === 'JSON') {
      const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(criteria, null, 2));
      const link = document.createElement("a");
      link.href = jsonString; link.download = `Criteria_Analysis.json`; link.click();
      return;
    }
    const csv = "data:text/csv;charset=utf-8," + "Category,Title,Type,Confidence\n" + criteria.map(c => `"${c.category}","${(c.title || '').replace(/"/g, '""')}","${c.mandatory ? 'Mandatory' : 'Optional'}","${c.confidence * 100 || 90}%"`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv); link.download = `Criteria_${type}.csv`; link.click();
  };

  const handlePointerDown = (e) => {
    if (activeTool === 'cursor') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setIsDrawing(true);
    setCurrentPath({ type: activeTool, startX: x, startY: y, endX: x, endY: y, color: activeColor, points: [{ x, y }] });
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !currentPath) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    if (activeTool === 'highlight') setCurrentPath({ ...currentPath, endX: x, endY: y });
    else if (activeTool === 'pen') setCurrentPath({ ...currentPath, points: [...currentPath.points, { x, y }] });
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath) {
      setAnnotations([...annotations, { ...currentPath, id: Date.now() }]);
      setCurrentPath(null);
    }
  };

  const handleMapSource = (item) => {
    if (item.category === 'Financial') setActiveColor('bg-green-400');
    else if (item.category === 'Technical') setActiveColor('bg-blue-400');
    else if (item.category === 'Compliance') setActiveColor('bg-purple-400');
    else if (item.category === 'Experience') setActiveColor('bg-orange-400');
    else setActiveColor('bg-yellow-400');
    setMappedCriteria(item);
    setTimeout(() => setMappedCriteria(null), 4000);
  };

  const handleAddCriteria = async () => {
    if (!newCriteria.tender_id) return showToast("Please select a tender", "error");
    try {
      const res = await apiService.addCriterion(newCriteria);
      if (res.data.success) {
        setCriteria(prev => [res.data.data, ...prev]);
        setAddCriteriaModal(false);
        showToast("Criteria added!");
      }
    } catch (e) { showToast("Failed to add criteria", "error"); }
  };

  const handleDeleteCriteria = async (id) => {
    if (!window.confirm("Delete this criteria?")) return;
    try {
      await apiService.deleteCriterion(id);
      setCriteria(prev => prev.filter(c => c.id !== id));
      showToast("Criteria deleted!");
    } catch (e) { showToast("Failed to delete", "error"); }
  };

<<<<<<< HEAD
  if (isLoading) return <AdminLayout><div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div></AdminLayout>;
=======
  const handleHumanReview = (item) => {
    showToast(`Criterion "${item.title}" flagged for manual human review.`, "success");
  }

  const stats = {
    total: criteria.length, 
    mandatory: criteria.filter(c => c.mandatory).length, 
    optional: criteria.filter(c => !c.mandatory).length,
    confidence: criteria.length > 0 ? Math.round(criteria.reduce((a, c) => {
      const v = c.confidence !== undefined ? c.confidence : 0.9;
      return a + (v > 1 ? v : v * 100);
    }, 0) / criteria.length) : 0
  };

  if (isLoading) return <AdminLayout><div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48}/></div></AdminLayout>;
  if (!selectedTender && tenders.length === 0) return <AdminLayout><div className="flex flex-col items-center justify-center h-[60vh]"><AlertCircle size={40} className="text-slate-400 mb-4"/><h2 className="text-2xl font-bold">No Tender Data</h2><button onClick={() => navigate('/admin/upload')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl">Go to Upload</button></div></AdminLayout>;
>>>>>>> e45c444 (my local changes)

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto relative">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`fixed top-10 left-1/2 -translate-x-1/2 z-[250] px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
              {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restore Header from Old UI (Second Pic) */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-[11px] uppercase tracking-[0.3em] mb-3">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Cpu size={14} className="animate-pulse" />
            </div>
            AI Extraction Engine V1.0
          </div>
          
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                  Criteria <span className="text-blue-600">Analysis</span>
                  <div className="relative group">
                    <button className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-300 group-hover:text-blue-600">
                      <ChevronDown size={28} />
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Select Active Tender</p>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {tenders.map(t => (
                          <button 
                            key={t.id} 
                            onClick={() => {
                              setSelectedTenderId(t.id);
                              setSelectedTender(t);
                              fetchCriteria(t.id);
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedTenderId === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {t.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500 font-black text-sm bg-slate-100/50 px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                  <FileText size={18} className="text-blue-600" /> 
                  Tender #{selectedTenderId || '---'}
                </div>
              </div>
            </div>
<<<<<<< HEAD

            <div className="flex flex-wrap items-center gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAIExtract} 
                className="px-6 py-4 bg-blue-600 text-white rounded-[20px] text-sm font-black flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">
                <Zap size={20} className="fill-current" /> Extract with AI
              </motion.button>
              
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={fetchSummary}
                className="px-6 py-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-[20px] text-sm font-black flex items-center gap-3 hover:bg-indigo-100 transition-all">
                <Lightbulb size={20} className="text-amber-500" /> AI Summary
              </motion.button>

              <div className="flex gap-1 p-1 bg-slate-100 rounded-[20px] border border-slate-200">
                <button onClick={() => handleExport('CSV')} className="p-3 text-slate-500 hover:text-slate-800 transition-all" title="Export CSV"><Download size={20}/></button>
                <div className="w-px h-6 bg-slate-200 self-center" />
                <button onClick={() => handleExport('JSON')} className="p-3 text-slate-500 hover:text-slate-800 transition-all" title="Export JSON"><FileJson size={20}/></button>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => { 
                  setIsFinalizing(true); 
                  try {
                    await apiService.generateRequiredDocuments(selectedTenderId);
                    showToast(`Successfully Propagated Constraints`);
                    // Navigation fix: From Admin to Bidder Workspace
                    setTimeout(() => { 
                      if(window.confirm("Documents synchronized. Redirect to Bidder Portal to verify?")) {
                        navigate('/bidder/dashboard'); 
                      } else {
                        navigate('/admin/dashboard');
                      }
                    }, 1500);
                  } catch (err) { showToast("Sync failed", "error"); }
                  finally { setIsFinalizing(false); }
                }}
                className="px-8 py-4 bg-slate-900 text-white rounded-[20px] text-sm font-black flex items-center gap-3 shadow-2xl hover:bg-slate-800 transition-all group"
              >
                {isFinalizing ? <Loader2 className="animate-spin" size={20} /> : 'Finalize & Sync to Bidder'} 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
=======
            <p className="text-slate-500 mt-2 flex items-center gap-2"><FileText size={16} />{selectedTender?.title || 'No tender selected'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleAIExtract(true)} 
              disabled={isLoading} 
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-500 shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="Clears existing criteria and runs fresh AI analysis"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Eraser size={16}/>} Reset & Re-Extract
            </button>
            <button onClick={handleAIExtract} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-500 shadow-md transition-all active:scale-95 disabled:opacity-50">
              {isLoading ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>} Extract with AI
            </button>
            <button onClick={fetchSummary} className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-600 flex items-center gap-2 hover:bg-indigo-100"><Lightbulb size={16}/> AI Summary</button>
            <button onClick={async () => {
              try {
                const res = await apiService.getLatestTender(); // Or specific endpoint for raw text
                alert("Extracted Document Text:\n\n" + (res.data.text_content || "No text extracted yet. Ensure the document is not just images."));
              } catch(e) { showToast("Failed to fetch text", "error"); }
            }} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
              <FileText size={16}/> View Raw Text
            </button>
>>>>>>> e45c444 (my local changes)
          </div>
        </div>

        {/* Restore Premium Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <StatCard title="Total Criteria" value={criteria.length} sub="Deduplicated" icon={Layers} bgClass="bg-blue-50" textClass="text-blue-600" delay={0.1} />
          <StatCard title="Mandatory" value={criteria.filter(c => c.mandatory).length} sub="Critical" icon={AlertCircle} bgClass="bg-red-50" textClass="text-red-600" delay={0.2} />
          <StatCard title="Optional" value={criteria.filter(c => !c.mandatory).length} sub="Standard" icon={CheckCircle2} bgClass="bg-emerald-50" textClass="text-emerald-600" delay={0.3} />
          <StatCard title="AI Confidence" value="93%" sub="High Reliability" icon={ShieldCheck} bgClass="bg-purple-50" textClass="text-purple-600" delay={0.4} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-380px)] min-h-[650px] mb-12">
          {/* PDF VIEWER - Restore from Old UI */}
          <div className="xl:col-span-7 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group">
            <div className="h-16 bg-slate-50/50 backdrop-blur-md border-b border-slate-200 flex justify-between items-center px-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button onClick={() => setPdfPage(p => Math.max(1, p - 1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"><ChevronLeft size={18} /></button>
                  <span className="text-xs font-black px-3 text-slate-700 min-w-[60px] text-center">Page {pdfPage}</span>
                  <button onClick={() => setPdfPage(p => p + 1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"><ChevronRight size={18} /></button>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"><ZoomOut size={18} /></button>
                  <span className="text-[10px] font-black px-2 text-slate-700">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"><ZoomIn size={18} /></button>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2.5 hover:bg-white hover:text-blue-600 rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200"><Printer size={20} /></button>
                <button className="p-2.5 hover:bg-white hover:text-blue-600 rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200"><Maximize size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-100/50 overflow-auto p-12 flex justify-center items-start custom-scrollbar">
              {selectedTender?.file_path ? (
                <div className="relative shadow-2xl transform-gpu transition-all" style={{ transform: `scale(${zoom})`, originX: 0, originY: 0 }}>
                  <iframe 
                    src={`${API_BASE_URL}/uploads/${selectedTender.file_path.split(/[/\\]/).pop()}#page=${pdfPage}`} 
                    className="w-[800px] h-[1100px] bg-white border border-slate-300 rounded-sm" 
                    title="PDF" 
                  />
                  {/* Overlays for annotations would go here */}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                  <div className="p-8 bg-white rounded-full shadow-inner animate-pulse">
                    <FileText size={64} className="opacity-20" />
                  </div>
                  <p className="font-black uppercase tracking-[0.3em] text-xs">Deep Analysis in Progress...</p>
                </div>
              )}
            </div>

            {/* Floating Source Marker */}
            <AnimatePresence>
              {mappedCriteria && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="absolute bottom-10 right-10 bg-white border-2 border-blue-600 p-6 rounded-3xl shadow-2xl max-w-sm z-[60] overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">Reference Found</span>
                    <button onClick={() => setMappedCriteria(null)} className="text-slate-300 hover:text-slate-600"><X size={16}/></button>
                  </div>
                  <p className="text-sm font-black text-slate-800 mb-2 pl-2 line-clamp-1">{mappedCriteria.title}</p>
                  <p className="text-xs text-slate-500 font-medium pl-2 line-clamp-2">"Found in Clause 4.2.1: Bidders must demonstrate minimum ₹50Cr annual turnover..."</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ANALYSIS PANEL - Restore from Old UI */}
          <div className="xl:col-span-5 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                {['All', 'Financial', 'Technical', 'Compliance'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setFilter(cat)} 
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${filter === cat ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {cat}
                  </button>
                ))}
<<<<<<< HEAD
=======
                <div className="w-8 h-[1px] bg-slate-200 my-2"></div>
                {['bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-yellow-400'].map(c => (
                  <button key={c} onClick={() => setActiveColor(c)} className={`w-5 h-5 rounded-full ${c} ${activeColor === c ? 'ring-2 ring-offset-2 ring-slate-400' : 'opacity-70 hover:opacity-100'}`} />
                ))}
              </div>
              
              {/* PDF Container Mock */}
              <div className="flex-1 bg-slate-200 overflow-auto relative p-8 flex justify-center items-start cursor-crosshair">
                <div 
                  onPointerDown={handlePointerDown} 
                  onPointerMove={handlePointerMove} 
                  onPointerUp={handlePointerUp} 
                  onPointerLeave={handlePointerUp}
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s', touchAction: 'none' }} 
                  className={`w-full max-w-3xl relative shadow-2xl ${activeTool !== 'cursor' ? 'cursor-crosshair' : ''}`}
                >
                   {/* Draw existing annotations */}
                   <div className="absolute inset-0 z-30 pointer-events-none">
                     {annotations.map(ann => {
                        const isEraser = activeTool === 'eraser';
                        const eraseProps = isEraser ? { onPointerDown: (e) => handleDeleteAnnotation(ann.id, e) } : {};
                        
                        if (ann.type === 'highlight') {
                           return <div key={ann.id} {...eraseProps} style={{ left: Math.min(ann.startX, ann.endX), top: Math.min(ann.startY, ann.endY), width: Math.abs(ann.endX - ann.startX), height: Math.abs(ann.endY - ann.startY) }} className={`absolute opacity-40 mix-blend-multiply ${ann.color} ${isEraser ? 'pointer-events-auto cursor-pointer hover:bg-red-500 hover:opacity-80' : ''}`} />
                        }
                        if (ann.type === 'pen') {
                           return <svg key={ann.id} className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"><polyline {...eraseProps} points={ann.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={getColorHex(ann.color)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={isEraser ? 'pointer-events-auto cursor-pointer hover:stroke-red-500' : ''} /></svg>
                        }
                        if (ann.type === 'note') {
                           return (
                              <div key={ann.id} {...eraseProps} style={{ left: ann.x, top: ann.y }} className={`absolute w-48 shadow-xl p-2 rounded-br-xl rounded-tr-xl rounded-bl-xl ${ann.color.replace('bg-', 'bg-').replace('400', '100')} border ${ann.color.replace('bg-', 'border-')} pointer-events-auto ${isEraser ? 'cursor-pointer hover:border-red-500 opacity-50' : ''}`}>
                                 <StickyNote size={14} className="mb-1 text-slate-700" />
                                 <textarea autoFocus placeholder="Add note..." className={`w-full text-xs bg-transparent border-none outline-none resize-none h-16 text-slate-800 ${isEraser ? 'pointer-events-none' : ''}`} defaultValue={ann.content} />
                              </div>
                           )
                        }
                        if (ann.type === 'text') {
                           return (
                              <div key={ann.id} {...eraseProps} style={{ left: ann.x, top: ann.y - 12 }} className={`absolute pointer-events-auto ${isEraser ? 'cursor-pointer opacity-50 bg-red-100' : ''}`}>
                                 <input autoFocus type="text" placeholder="Type text..." className={`bg-transparent font-bold text-lg outline-none border-b border-dashed border-slate-400 placeholder-slate-400 ${isEraser ? 'pointer-events-none' : ''}`} style={{ color: getColorHex(ann.color) }} />
                              </div>
                           )
                        }
                        return null;
                     })}
                     
                     {/* Draw currently drawing path */}
                     {currentPath && currentPath.type === 'highlight' && (
                           <div style={{ left: Math.min(currentPath.startX, currentPath.endX), top: Math.min(currentPath.startY, currentPath.endY), width: Math.abs(currentPath.endX - currentPath.startX), height: Math.abs(currentPath.endY - currentPath.startY) }} className={`absolute opacity-40 mix-blend-multiply ${currentPath.color}`} />
                     )}
                     {currentPath && currentPath.type === 'pen' && (
                           <svg className="absolute inset-0 w-full h-full overflow-visible">
                              <polyline points={currentPath.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={getColorHex(currentPath.color)} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                           </svg>
                     )}
                   </div>
                   {/* Highlight mapping overlay */}
                   <AnimatePresence>
                     {mappedCriteria && (
                       <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                         className={`absolute top-[25%] left-[5%] w-[90%] h-24 ${activeColor.replace('bg-', 'bg-').replace('400', '200')} bg-opacity-50 border-2 ${activeColor.replace('bg-', 'border-')} rounded z-20 pointer-events-none flex items-start justify-end p-2`}
                       >
                         <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className={`${activeColor} text-white text-[10px] font-black px-3 py-1 rounded shadow-lg uppercase tracking-widest`}>
                           {mappedCriteria.category} MATCH
                         </motion.div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                   {selectedTender?.file_path ? (
                      <iframe 
                        key={`pdf-${pdfPage}`} 
                        src={`${API_BASE_URL}/${selectedTender.file_path.replace(/\\/g, '/')}#page=${pdfPage}`} 
                        className="w-full h-[1000px] bg-white shadow-xl pointer-events-none" 
                        title="PDF" 
                      />
                   ) : (
                     <div className="w-full h-[1000px] bg-white shadow-xl p-12 text-slate-800 font-serif overflow-hidden relative">
                       <div className="absolute top-0 left-0 w-full h-8 bg-slate-100 border-b border-slate-200"></div>
                       <div className="absolute top-2 right-4 text-xs font-bold text-slate-400">Page {pdfPage}</div>
                       <h1 className="text-3xl font-black text-slate-900 mb-8 border-b-2 border-slate-900 pb-4 mt-4 uppercase tracking-widest text-center">Government Procurement Tender Document</h1>
                       {pdfPage === 1 ? (
                         <div className="space-y-6 text-sm leading-relaxed max-w-2xl mx-auto mt-12">
                           <h2 className="text-xl font-bold uppercase mb-4 text-center">Section 4: Eligibility Criteria</h2>
                           <p><strong>4.1 Financial Standing:</strong> The bidder must have an average annual turnover of at least <span className="bg-yellow-200 font-bold px-1 rounded border border-yellow-300">₹5 Crores</span> over the last 3 financial years. Audited balance sheets must be provided.</p>
                           <p><strong>4.2 Technical Competence:</strong> The bidder must possess a valid <span className="bg-yellow-200 font-bold px-1 rounded border border-yellow-300">ISO 9001:2015 certification</span> for quality management to ensure standardized delivery processes across the contract period.</p>
                           <p><strong>4.3 Statutory Compliance:</strong> A valid <span className="bg-yellow-200 font-bold px-1 rounded border border-yellow-300">GST registration certificate</span> is strictly required to be submitted along with the PAN card details.</p>
                           <p><strong>4.4 Past Experience:</strong> As per the experience clause, the bidder should have completed at least <span className="bg-yellow-200 font-bold px-1 rounded border border-yellow-300">3 similar government projects</span> in the last 5 years.</p>
                           <p><strong>4.5 Financial Health:</strong> The net worth of the bidder must be positive as per the latest audited balance sheet submitted. Failure to meet this will lead to disqualification.</p>
                         </div>
                       ) : pdfPage === 2 ? (
                         <div className="space-y-6 text-sm leading-relaxed max-w-2xl mx-auto mt-12">
                           <h2 className="text-xl font-bold uppercase mb-4 text-center">Section 5: General Terms & Conditions</h2>
                           <p><strong>5.1 Delivery Schedule:</strong> The successful bidder must deliver the entire scope of work within <span className="bg-yellow-200 font-bold px-1 rounded border border-yellow-300">120 days</span> from the date of issuance of the work order.</p>
                           <p><strong>5.2 Performance Bank Guarantee:</strong> A PBG equivalent to <span className="bg-yellow-200 font-bold px-1 rounded border border-yellow-300">10% of the total contract value</span> must be submitted within 15 days of contract signing.</p>
                           <p><strong>5.3 Liquidated Damages:</strong> Delay in delivery will attract a penalty of <span className="bg-yellow-200 font-bold px-1 rounded border border-yellow-300">0.5% per week</span> of the delayed goods value, up to a maximum of 10%.</p>
                           <p><strong>5.4 Subcontracting:</strong> Subcontracting is strictly <span className="bg-red-200 font-bold px-1 rounded border border-red-300 text-red-800">prohibited</span> without prior written consent from the competent authority.</p>
                         </div>
                       ) : (
                         <div className="space-y-6 text-sm leading-relaxed max-w-2xl mx-auto mt-12">
                           <h2 className="text-xl font-bold uppercase mb-4 text-center">Section 6: Appendices</h2>
                           <p><strong>Appendix A:</strong> List of approved makes and models for the IT hardware.</p>
                           <p><strong>Appendix B:</strong> Format for the Non-Disclosure Agreement (NDA) to be signed by all deployed resources.</p>
                           <p><strong>Appendix C:</strong> Detailed Service Level Agreement (SLA) metrics and associated penalties for non-compliance during the AMC period.</p>
                           <div className="mt-12 border border-slate-300 p-4 bg-slate-50 text-center text-slate-500 font-bold tracking-widest">
                              [ END OF DOCUMENT ]
                           </div>
                         </div>
                       )}
                       <div className="absolute bottom-8 right-12 opacity-50"><img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Seal" className="w-24 opacity-20" /></div>
                     </div>
                   )}
                </div>
>>>>>>> e45c444 (my local changes)
              </div>
              <button 
                onClick={() => setAddCriteriaModal(true)} 
                className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg"
              >
                <Plus size={20} />
              </button>
            </div>
<<<<<<< HEAD
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {sortedCriteria.length > 0 ? (
                sortedCriteria.map((item, idx) => (
                  <motion.div 
                    key={item.id || idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-200 p-6 rounded-3xl transition-all relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <CategoryBadge category={item.category} />
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {Math.round((item.confidence || 0.95) * 100)}% Match
=======
          </div>

          {/* RIGHT: ANALYSIS PANEL */}
          <div className="xl:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {['All', 'Financial', 'Technical', 'Compliance', 'Experience'].map((cat) => (
                  <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{cat}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setNewCriteria(prev => ({...prev, tender_id: selectedTenderId || ''}));
                    setAddCriteriaModal(true);
                  }} 
                  className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-700 transition-colors"
                >
                  <Plus size={14}/> Add
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search criteria..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none w-40 transition-all" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-100">
                {sortedCriteria.map((item) => {
                  const confFraction = item.confidence !== undefined ? item.confidence : 0.9;
                  // If the AI somehow returns 95 instead of 0.95, normalize it
                  const conf = confFraction > 1 ? confFraction : Math.round(confFraction * 100);
                  const isLowConf = conf < 80;
                  return (
                  <div key={item.id} className="group">
                    <div onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className={`p-5 cursor-pointer hover:bg-blue-50/30 transition-colors ${expandedId === item.id ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-3 items-center">
                          <CategoryBadge category={item.category} />
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.mandatory ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{item.mandatory ? 'Mandatory' : 'Optional'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1.5">
                             <div className={`w-2 h-2 rounded-full ${conf >= 90 ? 'bg-emerald-500' : isLowConf ? 'bg-red-500' : 'bg-amber-500'}`}/> 
                             <span className="text-[10px] font-bold text-slate-500">{conf}%</span>
                           </div>
                           <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
>>>>>>> e45c444 (my local changes)
                        </div>
                        {item.mandatory && <span className="p-1 bg-red-50 text-red-500 rounded-lg" title="Mandatory"><AlertCircle size={14} /></span>}
                      </div>
                    </div>
                    <h4 className="text-base font-black text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">{item.description}</p>
                    
<<<<<<< HEAD
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleMapSource(item)} 
                        className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                      >
                        <Target size={14} /> View Source
                      </button>
                      <button 
                        onClick={() => handleDeleteCriteria(item.id)}
                        className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-20">
                  <Database size={48} className="opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Extraction Detected</p>
                </div>
              )}
=======
                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedId === item.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50 border-t border-slate-100">
                          <div className="p-6 space-y-4">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Extracted Logic & Requirement</p>
                              <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">{item.description || item.title}</p>
                            </div>
                            
                            {item.value && item.value !== "None" && item.value !== "" && (
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Extracted Value / Threshold</p>
                                <p className="text-sm font-bold text-blue-700 bg-blue-50 p-2 rounded inline-block border border-blue-200">{item.value}</p>
                              </div>
                            )}
                            
                            {isLowConf && (
                              <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-2">
                                <AlertCircle size={16} className="text-red-500 mt-0.5" />
                                <p className="text-xs text-red-700"><strong>Low Confidence Extraction.</strong> The OCR quality was poor or the requirement phrasing was ambiguous. Human validation is strongly recommended.</p>
                              </div>
                            )}

                            <div className="flex gap-3">
                              {isLowConf ? (
                                <button onClick={(e) => { e.stopPropagation(); handleHumanReview(item); }} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-2">
                                  <Flag size={14}/> Flag for Manual Review
                                </button>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); handleMapSource(item); }} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                                  <Zap size={14}/> Validate Source Mapping
                                </button>
                              )}
                              
                              <button onClick={(e) => { e.stopPropagation(); setExplainModal(item); }} className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                                <Lightbulb size={14} className="text-amber-500"/> AI Explanation
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setEditCriteria(item); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors" title="Edit Criteria"><Edit3 size={14}/></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteCriteria(item.id); }} className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Delete Criteria"><Eraser size={14}/></button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )})}
              </div>
>>>>>>> e45c444 (my local changes)
            </div>
          </div>
        </div>

        {/* Floating AI Assistant - Restore from Old UI */}
        <div className="fixed bottom-10 right-10 z-[100]">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }} 
            whileTap={{ scale: 0.9 }} 
            className="w-20 h-20 bg-blue-600 text-white rounded-[32px] flex items-center justify-center shadow-2xl border-4 border-white cursor-pointer hover:bg-blue-700 transition-all relative group"
          >
            <div className="absolute inset-0 bg-blue-600 rounded-[32px] animate-ping opacity-20 group-hover:hidden" />
            <MessageSquare size={32} className="relative z-10" />
          </motion.button>
        </div>
      </div>

      {/* Restore Briefing Modal */}
      <AnimatePresence>
        {showSummaryModal && tenderSummary && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white rounded-[48px] w-full max-w-xl shadow-2xl overflow-hidden relative">
              <div className="p-10 bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
                <h3 className="font-black text-3xl tracking-tighter flex items-center gap-4 mb-2"><Lightbulb size={36} className="text-yellow-400" /> AI Executive Briefing</h3>
                <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Strategic Requirement Analysis</p>
                <button onClick={() => setShowSummaryModal(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-all"><X size={28} /></button>
              </div>
              <div className="p-10 space-y-6 bg-white">
                {tenderSummary.map((sum, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all"
                  >
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <CheckCircle2 size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 leading-relaxed">{sum}</span>
                  </motion.div>
                ))}
                <button 
                  onClick={() => setShowSummaryModal(false)} 
                  className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-widest mt-6 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Close Briefing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Criteria Modal */}
      <AnimatePresence>
        {addCriteriaModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <Plus size={24} className="text-blue-600" /> New Evaluation Criterion
                </h3>
                <button onClick={() => setAddCriteriaModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <div className="p-8 grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Criterion Title</label>
                  <input 
                    type="text" 
                    value={newCriteria.title} 
                    onChange={e => setNewCriteria({...newCriteria, title: e.target.value})}
                    placeholder="e.g., Minimum Annual Turnover"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Detailed Description</label>
                  <textarea 
                    value={newCriteria.description}
                    onChange={e => setNewCriteria({...newCriteria, description: e.target.value})}
                    rows="3"
                    placeholder="Provide specific details about this requirement..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
                  <select 
                    value={newCriteria.category}
                    onChange={e => setNewCriteria({...newCriteria, category: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  >
                    <option>Technical</option>
                    <option>Financial</option>
                    <option>Compliance</option>
                    <option>Experience</option>
                  </select>
                </div>
                <div className="flex items-end pb-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={newCriteria.mandatory}
                      onChange={e => setNewCriteria({...newCriteria, mandatory: e.target.checked})}
                      className="hidden" 
                    />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${newCriteria.mandatory ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                      {newCriteria.mandatory && <CheckCircle2 size={14} />}
                    </div>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Mandatory Requirement</span>
                  </label>
                </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setAddCriteriaModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                <button onClick={handleAddCriteria} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all">Save Criterion</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default CriteriaAnalysis;
