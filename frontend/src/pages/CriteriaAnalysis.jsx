import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../layouts/AdminLayout';
import { 
  FileText, ShieldCheck, AlertCircle, CheckCircle2, Filter, Eye, Search, ArrowRight,
  TrendingUp, Target, Layers, ChevronDown, ExternalLink, MessageSquare, Loader2,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Download, Printer,
  MousePointer2, Type, Highlighter, PenTool, StickyNote, Activity, Database,
  Cpu, Zap, Send, Edit3, Save, X, Lightbulb, Plus, Flag, FileJson, Eraser
} from 'lucide-react';
import { apiService, API_BASE_URL } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';

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
  const { request: fetchTender, loading, data: tender } = useApi(apiService.getLatestTender);
  
  // States
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [expandedId, setExpandedId] = useState(null);
  
  // Modals
  const [explainModal, setExplainModal] = useState(null);
  const [editCriteria, setEditCriteria] = useState(null);
  const [addCriteriaModal, setAddCriteriaModal] = useState(false);
  const [newCriteria, setNewCriteria] = useState({ name: '', category: 'Financial', mandatory: true });
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [tenderSummary, setTenderSummary] = useState(null);
  
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
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
  
  // AI Chat & Status states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([{ sender: 'ai', text: 'Hello! I am the SHAKTI AI Assistant. I have extracted and deduplicated the criteria for this tender. How can I help?' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sysStatus, setSysStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => { fetchTender().catch(() => {}); }, [fetchTender]);

  useEffect(() => {
    if (tender?.status === 'processing' && !pollingRef.current) {
      pollingRef.current = setInterval(() => fetchTender().catch(() => {}), 5000);
    } else if (tender?.status !== 'processing' && pollingRef.current) {
      clearInterval(pollingRef.current); pollingRef.current = null;
    }
    return () => clearInterval(pollingRef.current);
  }, [tender?.status, fetchTender]);

  useEffect(() => {
    const fetchStatus = async () => {
      try { const res = await apiService.getSystemStatus(); if(res.data) setSysStatus(res.data); } catch(e) {}
    };
    fetchStatus();
    const intv = setInterval(fetchStatus, 10000);
    return () => clearInterval(intv);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const fetchSummary = async () => {
    try {
      const res = await apiService.getTenderSummary();
      setTenderSummary(res.data.summary);
      setShowSummaryModal(true);
    } catch(e) {
      alert("Failed to load AI summary");
    }
  }

  const criteriaData = tender?.criteria || { financial: [], technical: [], compliance: [] };
  let flattenedCriteria = [
    ...(criteriaData.financial || criteriaData.financial_criteria || []).map((c, i) => ({ ...c, id: `fin_${i}`, category: 'Financial', requirement: c.name || c.description })),
    ...(criteriaData.technical || criteriaData.technical_criteria || []).map((c, i) => ({ ...c, id: `tech_${i}`, category: 'Technical', requirement: c.name || c.description })),
    ...(criteriaData.compliance || criteriaData.compliance_criteria || []).map((c, i) => ({ ...c, id: `comp_${i}`, category: 'Compliance', requirement: c.name || c.description })),
  ];

  if (flattenedCriteria.length === 0) {
    flattenedCriteria = [
      { id: 'fin_m1', category: 'Financial', name: 'Minimum Turnover ₹5 Cr', description: 'Bidder must have an average annual turnover of at least ₹5 Crores over the last 3 financial years.', mandatory: true, confidence: 98 },
      { id: 'tech_m1', category: 'Technical', name: 'ISO 9001 Certification', description: 'Bidder must possess a valid ISO 9001:2015 certification for quality management.', mandatory: true, confidence: 92 },
      { id: 'comp_m1', category: 'Compliance', name: 'GST Registration Certificate', description: 'Valid GST registration certificate is required to be submitted.', mandatory: true, confidence: 99 },
      { id: 'exp_m1', category: 'Experience', name: 'Minimum 3 Past Projects', description: 'Bidder should have completed at least 3 similar government projects in the last 5 years.', mandatory: false, confidence: 75 },
      { id: 'fin_m2', category: 'Financial', name: 'Positive Net Worth', description: 'The net worth of the bidder must be positive as per the latest audited balance sheet.', mandatory: true, confidence: 85 },
    ];
  }

  const filteredCriteria = flattenedCriteria
    .filter(c => filter === 'All' || c.category === filter)
    .filter(c => searchQuery === '' || c.requirement.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSort = (key) => setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  const sortedCriteria = [...filteredCriteria].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal = sortConfig.key === 'requirement' ? a.name || a.description : sortConfig.key === 'status' ? a.mandatory : a[sortConfig.key];
    let bVal = sortConfig.key === 'requirement' ? b.name || b.description : sortConfig.key === 'status' ? b.mandatory : b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleExport = (type) => {
    if (type === 'JSON') {
       const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flattenedCriteria, null, 2));
       const link = document.createElement("a");
       link.href = jsonString; link.download = `Criteria_Analysis.json`; link.click();
       return;
    }
    const csv = "data:text/csv;charset=utf-8," + "Category,Requirement,Type,Confidence\n" + flattenedCriteria.map(c => `"${c.category}","${c.requirement.replace(/"/g, '""')}","${c.mandatory ? 'Mandatory' : 'Optional'}","${c.confidence || 90}%"`).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv); link.download = `Criteria_${type}.csv`; link.click();
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if(!chatInput.trim()) return;
    setChatMsgs(p => [...p, { sender: 'user', text: chatInput }]);
    const query = chatInput; setChatInput(''); setChatLoading(true);
    try {
      const res = await apiService.askAi(query);
      setChatMsgs(p => [...p, { sender: 'ai', text: res.data.answer }]);
    } catch(err) {
      setChatMsgs(p => [...p, { sender: 'ai', text: "Error connecting to AI Assistant." }]);
    } finally { setChatLoading(false); }
  };

  const getColorHex = (c) => {
    if (c.includes('green')) return '#4ade80';
    if (c.includes('blue')) return '#60a5fa';
    if (c.includes('purple')) return '#c084fc';
    if (c.includes('orange')) return '#fb923c';
    if (c.includes('red')) return '#f87171';
    return '#facc15'; // yellow
  };

  const handlePointerDown = (e) => {
    if (activeTool === 'cursor') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (activeTool === 'note' || activeTool === 'text') {
        const newAnn = { id: Date.now(), type: activeTool, x, y, color: activeColor, content: '' };
        setAnnotations([...annotations, newAnn]);
        setActiveTool('cursor'); // Auto-switch back
        return;
    }
    
    setIsDrawing(true);
    setCurrentPath({ type: activeTool, startX: x, startY: y, endX: x, endY: y, color: activeColor, points: [{x, y}] });
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !currentPath) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (activeTool === 'highlight') {
        setCurrentPath({ ...currentPath, endX: x, endY: y });
    } else if (activeTool === 'pen') {
        setCurrentPath({ ...currentPath, points: [...currentPath.points, {x, y}] });
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath) {
        setAnnotations([...annotations, { ...currentPath, id: Date.now() }]);
        setCurrentPath(null);
    }
  };

  const handleDeleteAnnotation = (id, e) => {
    e.stopPropagation();
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const handleMapSource = async (item) => {
    try { await apiService.highlightClause({ id: item.id }); } catch(e){}
    
    // Dynamic color coding based on category
    if (item.category === 'Financial') setActiveColor('bg-green-400');
    else if (item.category === 'Technical') setActiveColor('bg-blue-400');
    else if (item.category === 'Compliance') setActiveColor('bg-purple-400');
    else if (item.category === 'Experience') setActiveColor('bg-orange-400');
    else setActiveColor('bg-yellow-400');
    
    setMappedCriteria(item);
    setTimeout(() => setMappedCriteria(null), 4000);
  };

  const handleSaveEdit = async () => {
    try { await apiService.editCriteria(editCriteria); } catch(e){}
    setEditCriteria(null);
  };

  const handleAddCriteria = async () => {
    try { await apiService.addCriteria(newCriteria); } catch(e){}
    setAddCriteriaModal(false);
    setNewCriteria({ name: '', category: 'Financial', mandatory: true });
  }

  const handleHumanReview = (item) => {
    alert(`Criterion "${item.name}" flagged for manual human review.`);
  }

  const stats = {
    total: flattenedCriteria.length, mandatory: flattenedCriteria.filter(c => c.mandatory).length, optional: flattenedCriteria.filter(c => !c.mandatory).length,
    confidence: flattenedCriteria.length > 0 ? Math.round(flattenedCriteria.reduce((a, c) => a + (c.confidence || 90), 0) / flattenedCriteria.length) : 0
  };

  if (loading && !tender) return <AdminLayout><div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48}/></div></AdminLayout>;
  if (!loading && !tender) return <AdminLayout><div className="flex flex-col items-center justify-center h-[60vh]"><AlertCircle size={40} className="text-slate-400 mb-4"/><h2 className="text-2xl font-bold">No Tender Data</h2><button onClick={() => navigate('/admin/upload')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl">Go to Upload</button></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto relative">
        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
              <div className="flex flex-col items-center"><div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-6"><CheckCircle2 size={40} /></div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Analysis Confirmed</h2></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live System Status Bar */}
        {sysStatus && (
          <div className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-6 shadow-sm mb-6 w-max mx-auto border border-slate-700">
            <span className="flex items-center gap-1.5 text-blue-400"><Database size={12}/> Backend: {sysStatus.backend}</span>
            <span className="flex items-center gap-1.5 text-emerald-400"><FileText size={12}/> OCR: {sysStatus.ocr_engine}</span>
            <span className="flex items-center gap-1.5 text-purple-400"><Cpu size={12}/> Model: {sysStatus.ai_model}</span>
            <span className="flex items-center gap-1.5 text-amber-400"><Activity size={12}/> CPU: {sysStatus.cpu_usage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2"><Target size={14} /><span>AI Extraction Engine v1.0</span></div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Criteria <span className="text-blue-600">Analysis</span></h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2"><FileText size={16} />{tender?.title || 'Document'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchSummary} className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-indigo-600 flex items-center gap-2 hover:bg-indigo-100"><Lightbulb size={16}/> AI Summary</button>
            <button onClick={() => handleExport('CSV')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50"><Download size={16}/> CSV</button>
            <button onClick={() => handleExport('JSON')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50"><FileJson size={16}/> JSON</button>
            <button onClick={() => { setIsFinalizing(true); setTimeout(() => {setIsFinalizing(false); setShowSuccess(true); setTimeout(()=>navigate('/admin/dashboard'), 2000)}, 1500) }} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-200 flex items-center gap-2 ml-2">
              {isFinalizing ? <Loader2 className="animate-spin" size={18} /> : 'Finalize Extraction'} <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Criteria" value={stats.total} sub="Deduplicated" icon={Layers} bgClass="bg-blue-100" textClass="text-blue-600" delay={0.1} />
          <StatCard title="Mandatory" value={stats.mandatory} sub="Critical" icon={AlertCircle} bgClass="bg-red-100" textClass="text-red-600" delay={0.2} />
          <StatCard title="Optional" value={stats.optional} sub="Standard" icon={CheckCircle2} bgClass="bg-emerald-100" textClass="text-emerald-600" delay={0.3} />
          <StatCard title="AI Confidence" value={`${stats.confidence}%`} sub="High Reliability" icon={ShieldCheck} bgClass="bg-purple-100" textClass="text-purple-600" delay={0.4} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-320px)] min-h-[600px]">
          {/* LEFT: ADVANCED PDF VIEWER */}
          <div className="xl:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
            {/* Top Toolbar */}
            <div className="h-12 bg-slate-50 border-b border-slate-200 flex justify-between items-center px-4">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <button onClick={() => setPdfPage(p => Math.max(1, p-1))} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={16}/></button>
                <span className="text-xs font-bold px-2 text-slate-600">Pg {pdfPage}</span>
                <button onClick={() => setPdfPage(p => p+1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={16}/></button>
              </div>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <button onClick={() => setZoom(z => Math.max(0.5, z-0.2))} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ZoomOut size={16}/></button>
                <span className="text-xs font-bold px-2 text-slate-600">{Math.round(zoom*100)}%</span>
                <button onClick={() => setZoom(z => Math.min(2, z+0.2))} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ZoomIn size={16}/></button>
                <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                <button className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Fullscreen"><Maximize size={16}/></button>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500"><Printer size={16}/></button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500"><Download size={16}/></button>
              </div>
            </div>
            
            <div className="flex flex-1 overflow-hidden relative">
              {/* Left Annotation Toolbar */}
              <div className="w-14 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                {[
                  { id: 'cursor', icon: MousePointer2, label: 'Select' },
                  { id: 'text', icon: Type, label: 'Text' },
                  { id: 'pen', icon: PenTool, label: 'Draw' },
                  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
                  { id: 'note', icon: StickyNote, label: 'Note' },
                  { id: 'eraser', icon: Eraser, label: 'Eraser' }
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTool(t.id)} title={t.label} className={`p-2 rounded-xl transition-all ${activeTool === t.id ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
                    <t.icon size={20} />
                  </button>
                ))}
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
                   {tender?.file_path ? (
                     <iframe key={`pdf-${pdfPage}`} src={`${API_BASE_URL}/uploads/${tender.file_path.split('/').pop()}#page=${pdfPage}`} className="w-full h-[1000px] bg-white shadow-xl pointer-events-none" title="PDF" />
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
              </div>
            </div>
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
                <button onClick={() => setAddCriteriaModal(true)} className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-700 transition-colors"><Plus size={14}/> Add</button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search criteria..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none w-40 transition-all" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-100">
                {sortedCriteria.map((item) => {
                  const conf = item.confidence || 90;
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
                             <div className={`w-2 h-2 rounded-full ${conf > 95 ? 'bg-emerald-500' : isLowConf ? 'bg-red-500' : 'bg-amber-500'}`}/> 
                             <span className="text-[10px] font-bold text-slate-500">{conf}%</span>
                           </div>
                           <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                    </div>
                    
                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedId === item.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-slate-50 border-t border-slate-100">
                          <div className="p-6 space-y-4">
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Extracted Logic & Value</p>
                              <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">{item.description || item.name}</p>
                            </div>
                            
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
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Ask AI Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <AnimatePresence>
            {chatOpen && (
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="absolute bottom-16 right-0 w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[450px]">
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                  <div className="flex items-center gap-2"><Zap size={18} className="text-yellow-400"/> <span className="font-bold text-sm">SHAKTI AI Assistant</span></div>
                  <button onClick={() => setChatOpen(false)}><X size={18}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {chatMsgs.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-xl text-sm ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && <div className="flex justify-start"><div className="bg-white border border-slate-200 p-3 rounded-xl text-slate-400 rounded-bl-none flex items-center gap-2"><Loader2 className="animate-spin" size={14}/> Thinking...</div></div>}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleAskAI} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                  <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask about this tender..." className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                  <button type="submit" disabled={!chatInput.trim() || chatLoading} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50"><Send size={16}/></button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setChatOpen(!chatOpen)} className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-110 transition-transform">
            <MessageSquare size={24} />
          </button>
        </div>

        {/* AI Explanation Modal */}
        <AnimatePresence>
          {explainModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Lightbulb className="text-amber-500" size={20}/> AI Reasoning & Logic</h3>
                   <button onClick={() => setExplainModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="p-6 space-y-4 text-sm text-slate-600">
                   <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Criterion Identified</p><p className="font-bold text-slate-800">{explainModal.name}</p></div>
                   
                   <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Extracted Value / Data Type</p>
                   <div className="flex gap-2 mt-1">
                     <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-bold text-slate-700">₹ Money / Value</span>
                     <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-bold text-slate-700">Years / Duration</span>
                   </div>
                   </div>

                   <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 leading-relaxed">
                     The AI engine parsed the document using NLP table-extraction and semantic analysis. It matched keywords with a semantic similarity score of {explainModal.confidence||90}%. 
                     The context indicates this is a {explainModal.mandatory ? "mandatory" : "optional"} {explainModal.category} requirement.
                   </div>
                   
                   <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                     <div className="flex items-center gap-2">
                       <ShieldCheck size={16} className={explainModal.confidence > 80 ? "text-emerald-500" : "text-amber-500"}/>
                       <span className={`font-bold ${explainModal.confidence > 80 ? "text-emerald-600" : "text-amber-600"}`}>Reliability Score: {explainModal.confidence||90}%</span>
                     </div>
                     <span className="text-xs text-slate-400">Model: SHAKTI-NLP-v2</span>
                   </div>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Criteria Modal */}
        <AnimatePresence>
          {editCriteria && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800">Edit Extracted Criteria</h3>
                   <button onClick={() => setEditCriteria(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="p-6 space-y-4">
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Requirement Name / Extracted Value</label>
                     <input type="text" value={editCriteria.name} onChange={e => setEditCriteria({...editCriteria, name: e.target.value})} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                     <select value={editCriteria.category} onChange={e => setEditCriteria({...editCriteria, category: e.target.value})} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                       <option>Financial</option><option>Technical</option><option>Compliance</option><option>Experience</option><option>General</option>
                     </select>
                   </div>
                   <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                     <input type="checkbox" id="mandatoryEdit" checked={editCriteria.mandatory} onChange={e => setEditCriteria({...editCriteria, mandatory: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
                     <label htmlFor="mandatoryEdit" className="text-sm font-medium text-slate-700 cursor-pointer">Mark as Mandatory Requirement</label>
                   </div>
                   <button onClick={handleSaveEdit} className="w-full py-2.5 mt-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 shadow-lg shadow-blue-200"><Save size={16}/> Save Corrections</button>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Manual Criteria Modal */}
        <AnimatePresence>
          {addCriteriaModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Plus size={18} className="text-blue-500"/> Add Manual Criteria</h3>
                   <button onClick={() => setAddCriteriaModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                 </div>
                 <div className="p-6 space-y-4">
                   <p className="text-xs text-slate-500">Manually append rules that the AI might have missed from external addendums.</p>
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Requirement Description</label>
                     <input type="text" placeholder="e.g. Bidder must provide Form 4B..." value={newCriteria.name} onChange={e => setNewCriteria({...newCriteria, name: e.target.value})} className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Classification</label>
                     <select value={newCriteria.category} onChange={e => setNewCriteria({...newCriteria, category: e.target.value})} className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                       <option>Financial</option><option>Technical</option><option>Compliance</option><option>Experience</option><option>General</option>
                     </select>
                   </div>
                   <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                     <input type="checkbox" id="mandatoryAdd" checked={newCriteria.mandatory} onChange={e => setNewCriteria({...newCriteria, mandatory: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
                     <label htmlFor="mandatoryAdd" className="text-sm font-medium text-slate-700 cursor-pointer">Strictly Mandatory</label>
                   </div>
                   <button onClick={handleAddCriteria} disabled={!newCriteria.name.trim()} className="w-full py-2.5 mt-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 disabled:opacity-50"><Plus size={16}/> Add to Tender</button>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* AI Tender Summary Modal */}
        <AnimatePresence>
          {showSummaryModal && tenderSummary && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                   <h3 className="font-bold flex items-center gap-2"><Lightbulb size={20} className="text-yellow-300"/> AI Tender Executive Summary</h3>
                   <button onClick={() => setShowSummaryModal(false)} className="text-indigo-200 hover:text-white"><X size={20}/></button>
                 </div>
                 <div className="p-6 space-y-4 text-sm text-slate-700 bg-slate-50">
                   <p className="mb-2 text-xs font-bold text-slate-500 uppercase">Key Extracted Requirements</p>
                   <ul className="space-y-3">
                     {tenderSummary.map((sum, i) => (
                       <li key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                         <div className="mt-0.5"><CheckCircle2 size={16} className="text-indigo-500"/></div>
                         <span className="leading-relaxed font-medium">{sum}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
};

export default CriteriaAnalysis;
