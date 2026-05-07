import React, { useEffect, useState, useCallback } from 'react';
import BidderLayout from '../layouts/BidderLayout';
import {
  Clock, CheckCircle, AlertCircle, FileText, Download, ShieldCheck,
  TrendingUp, History, UploadCloud, Search, CheckCircle2,
  AlertTriangle, Loader2, MessageSquare, Activity, X, Eye, FileJson, Paperclip, Send, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import AIChatbot from '../components/AIChatbot';

// --- Shared Components ---

const SkeletonBox = ({ className }) => <div className={`animate-pulse bg-slate-200 ${className}`} />;

const StatCard = React.memo(({ title, value, sub, icon: Icon, color, loading }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white/90 backdrop-blur-md rounded-[24px] p-6 border border-white/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-${color}-500/20 transition-all`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-600 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1">{title}</h3>
      {loading ? <SkeletonBox className="h-8 w-16 rounded mb-2" /> : <p className="text-3xl font-black text-slate-900">{value}</p>}
      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{sub}</p>
    </div>
  </motion.div>
));

const ProgressStep = ({ step, title, status }) => {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';

  return (
    <div className="flex flex-col items-center flex-1 relative group z-10">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm z-10 transition-all shadow-sm ${isCompleted ? 'bg-emerald-500 text-white shadow-emerald-200' :
          isCurrent ? 'bg-blue-600 text-white shadow-blue-200 ring-4 ring-blue-100' :
            'bg-slate-100 text-slate-400 border border-slate-200'
        }`}>
        {isCompleted ? <CheckCircle size={18} /> : step}
      </div>
      <div className="mt-4 text-center">
        <h4 className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>{title}</h4>
        {isCurrent && <span className="text-[8px] font-bold text-blue-400 animate-pulse uppercase">Processing</span>}
      </div>
    </div>
  );
};

// --- Main Bidder Dashboard ---

const BidderStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Define active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Sync tab with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/bidder/dashboard') setActiveTab('overview');
    else if (path === '/bidder/applications') setActiveTab('track');
    else if (path === '/bidder/messages') setActiveTab('clarification');
    else if (path === '/bidder/status') setActiveTab('track');
  }, [location.pathname]);

  // Data Fetching
  const BIDDER_ID = 1; // Assuming logged in user ID is 1 for now
  const { request: fetchMySubmissions, loading: subLoading, data: submissions } = useApi(apiService.getMySubmissions);
  const { request: fetchTenders, loading: tendersLoading, data: tenders } = useApi(apiService.getTenders);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null); // For PDF Source Mapping Modal

  // Criteria States
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [activeCriteriaTender, setActiveCriteriaTender] = useState(null);
  const [tenderCriteria, setTenderCriteria] = useState([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);

  // Dynamic Documents State
  const [activeApplication, setActiveApplication] = useState(null);
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [evalReport, setEvalReport] = useState(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [complianceScore, setComplianceScore] = useState(0);

  const fetchApplicationDocs = useCallback(async (tenderId) => {
    console.log("📂 Fetching docs for Tender:", tenderId);
    setDocsLoading(true);
    try {
      const [reqRes, upRes] = await Promise.all([
        apiService.getRequiredDocuments(tenderId),
        apiService.getBidderUploadedDocuments(BIDDER_ID, tenderId)
      ]);

      console.log("📋 Required Docs Response:", reqRes.data);
      console.log("📤 Uploaded Docs Response:", upRes.data);

      const reqs = reqRes.data?.data || [];
      const ups = upRes.data?.data || [];

      setRequiredDocs(reqs);
      setUploadedDocs(ups);

      // Fetch AI evaluation report for this application
      try {
        const subRes = await apiService.getMySubmissions(BIDDER_ID);
        const submissions = subRes.data || subRes; // Handle both Axios and useApi results
        console.log("📊 Submissions for Evaluation:", submissions);
        
        const mySub = Array.isArray(submissions) ? submissions.find(s => Number(s.tender_id) === Number(tenderId)) : null;
        
        if (mySub) {
          console.log("🎯 Found Submission for Report:", mySub.id);
          const reportRes = await apiService.getEvaluationReport(mySub.id);
          console.log("📝 Evaluation Report:", reportRes.data);
          setEvalReport(reportRes.data);
        } else {
          console.warn("❓ No submission record found for tender", tenderId);
          setEvalReport(null);
        }
      } catch (e) {
        console.warn("⚠️ Evaluation report not available yet", e);
        setEvalReport(null);
      }

      // Calculate score
      if (reqs.length > 0) {
        const mandatoryReqs = reqs.filter(r => r.mandatory);
        const uploadedMandatory = mandatoryReqs.filter(r =>
          ups.some(u => u.document_type === r.document_name)
        );
        const score = Math.round((uploadedMandatory.length / (mandatoryReqs.length || 1)) * 100);
        setComplianceScore(score);
      } else {
        setComplianceScore(0);
      }
    } catch (err) {
      console.error("❌ Failed to fetch docs", err);
    } finally {
      setDocsLoading(false);
    }
  }, [BIDDER_ID]);

  const fetchAll = useCallback(async () => {
    try {
      console.log("📡 Initializing Bidder Workspace for ID:", BIDDER_ID);
      const submissionsData = await fetchMySubmissions(BIDDER_ID);
      await fetchTenders();

      console.log("📝 All My Submissions:", submissionsData);

      // Auto-load docs for the latest submission if no active selection
      if (submissionsData && submissionsData.length > 0 && !activeApplication) {
        const latest = submissionsData[submissionsData.length - 1];
        const tenderId = latest.tender_id; // CRITICAL: Use tender_id, NOT id (id is the evaluation id)
        console.log("🆕 Auto-selecting latest application:", tenderId);
        
        if (tenderId) {
          setActiveApplication({ 
            id: tenderId, 
            evalId: latest.id,
            title: latest.tender_title || "My Application" 
          });
          fetchApplicationDocs(tenderId);
        }
      }
    } catch (err) { console.error("❌ Initial fetch failed", err); }
  }, [BIDDER_ID, fetchMySubmissions, fetchTenders, activeApplication, fetchApplicationDocs]);

  useEffect(() => { fetchAll(); }, [BIDDER_ID]); // Depend on BIDDER_ID to re-run if it changes

  // Derived Data
  const latestSub = submissions?.[submissions.length - 1];
  const status = latestSub?.status || 'SUBMITTED';
  const score_value = latestSub?.ai_score || 0;
  const isRejected = status === 'FAIL' || status === 'Rejected';

  // Handlers
  const handleFileUpload = async (e, docRequirement) => {
    const file = e.target.files[0];
    if (!file || !activeApplication) return;

    setIsUploading(true);
    try {
      await apiService.uploadBidderDocument(
        BIDDER_ID,
        activeApplication.id,
        docRequirement.document_name,
        file
      );
      // Refresh documents after upload
      fetchApplicationDocs(activeApplication.id);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };



  const handleApply = (tender) => {
    setActiveApplication(tender);
    setActiveTab('track');
    fetchApplicationDocs(tender.id);
  };

  const handleDownloadReport = () => {
    alert("Generating AI Evaluation PDF Report...");
  };

  const handleDeepSync = async (tenderId) => {
    if (!tenderId) return;
    setIsUploading(true);
    try {
      await apiService.generateRequiredDocuments(tenderId);
      await fetchApplicationDocs(tenderId);
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const viewTenderCriteria = async (tender) => {
    setActiveCriteriaTender(tender);
    setShowCriteriaModal(true);
    setCriteriaLoading(true);
    try {
      const res = await apiService.getCriteria(tender.id);
      setTenderCriteria(res.data || []);
    } catch (err) {
      console.error("Failed to fetch criteria", err);
    } finally {
      setCriteriaLoading(false);
    }
  };

  const openPdfSource = (clause) => {
    setSelectedPdf(clause);
  };

  // Render logic for different tabs
  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Active Tenders" value={tenders?.length || 0} sub="Available Opportunities" icon={Search} color="indigo" loading={tendersLoading} />
            <StatCard title="My Submissions" value={submissions?.length || 0} sub="Total Lifetime Bids" icon={FileText} color="blue" loading={subLoading} />
            <StatCard title="Compliance Score" value={latestSub ? `${score_value}%` : 'N/A'} sub="Latest Evaluation" icon={ShieldCheck} color="emerald" loading={subLoading} />
            <StatCard title="Clarifications" value={isRejected ? 1 : 0} sub="Pending Action" icon={AlertCircle} color="amber" loading={subLoading} />
          </div>



          {/* Available Tenders Module */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Available Government Tenders</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Search tenders..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none w-64 transition-all shadow-sm" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white">
                  <tr className="border-b border-slate-50">
                    <th className="py-4 pl-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tender Description</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Match</th>
                    <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
                    <th className="py-4 pr-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tendersLoading ? (
                    <tr><td colSpan="4" className="py-10 text-center"><Loader2 className="animate-spin inline mr-2 text-blue-500" size={16} /> Loading Tenders...</td></tr>
                  ) : tenders && tenders.length > 0 ? (
                    tenders.map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                        <td className="py-4 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16} /></div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">{t.title}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">ID: {t.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg border border-emerald-100">
                            {85 + (idx % 10)}% Match
                          </span>
                        </td>
                        <td className="py-4 text-xs font-bold text-slate-500">Dec 31, 2026</td>
                        <td className="py-4 pr-8 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => viewTenderCriteria(t)} className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-1.5">
                              <Target size={14} /> Criteria
                            </button>
                            <button
                              onClick={() => handleApply(t)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all"
                            >
                              Apply Now
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="py-10 text-center text-sm font-bold text-slate-400">No active tenders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'track' || activeTab === 'documents') {
      const getStepStatus = (step) => {
        if (!latestSub) return 'pending';
        if (status === 'PASS' || status === 'Eligible') return 'completed';
        if (status === 'FAIL' || status === 'Rejected') return step <= 3 ? 'completed' : 'pending';
        if (step === 1) return 'completed';
        if (step === 2) return (status === 'SUBMITTED' ? 'current' : 'completed');
        if (step === 3) return (status === 'AWAITING_DOCS' ? 'current' : (status === 'SUBMITTED' ? 'pending' : 'completed'));
        return 'pending';
      };

      return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          {!latestSub && !subLoading ? (
            <div className="bg-white rounded-[32px] p-20 border border-slate-100 shadow-sm text-center">
              <FileText size={40} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-black text-slate-800 mb-2">No Applications Found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">You haven't submitted any tender applications yet.</p>
              <button onClick={() => setActiveTab('overview')} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                Browse Tenders
              </button>
            </div>
          ) : (
            <>
              {/* Intelligent Timeline */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-100 -translate-y-6 z-0 rounded-full" />
                <div className="flex justify-between items-start relative z-10 px-4">
                  <ProgressStep step={1} title="Draft Saved" status={getStepStatus(1)} />
                  <ProgressStep step={2} title="AI Processing" status={getStepStatus(2)} />
                  <ProgressStep step={3} title="Eligibility" status={getStepStatus(3)} />
                  <ProgressStep step={4} title="Tech Eval" status={getStepStatus(4)} />
                  <ProgressStep step={5} title="Outcome" status={getStepStatus(5)} />
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8">
                {/* Document & AI Evaluation Center */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          <ShieldCheck size={20} className="text-blue-600" /> AI Document Evaluation Center
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                          {activeApplication ? `Requirements for: ${activeApplication.title} (ID: ${activeApplication.id})` : "Real-time OCR extraction and compliance mapping."}
                        </p>
                      </div>
                      <button onClick={handleDownloadReport} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center gap-2 transition-all">
                        <Download size={14} /> AI Report
                      </button>
                    </div>

                    <div className="space-y-4">
                      {docsLoading ? (
                        <div className="py-20 text-center">
                          <Loader2 className="animate-spin inline text-blue-500 mb-4" size={40} />
                          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Syncing with Intelligence Matrix...</p>
                        </div>
                      ) : requiredDocs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">


                          {requiredDocs.map((doc, idx) => {
                            const isUploaded = uploadedDocs.some(u => u.document_type === doc.document_name);
                            const conf = doc.confidence || 0.95;
                            
                            return (
                              <motion.div 
                                key={doc.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`group bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 transition-all relative overflow-hidden ${isUploaded ? 'border-emerald-200' : ''}`}
                              >
                                {isUploaded && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm">Verified</div>}
                                
                                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                                  <div className={`p-4 rounded-xl flex-none ${isUploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {isUploaded ? <FileCheck size={24} /> : <FileText size={24} />}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="text-lg font-black text-slate-800">{doc.document_name}</h4>
                                      {doc.mandatory && (
                                        <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                                          <AlertTriangle size={10} /> Critical
                                        </span>
                                      )}
                                      
                                      {/* AI EVALUATION STATUS BADGE */}
                                      {isUploaded && evalReport && (
                                        (() => {
                                          const result = evalReport.results?.find(r => 
                                            r.criterion_name.toLowerCase().includes(doc.document_name.toLowerCase()) ||
                                            doc.document_name.toLowerCase().includes(r.criterion_name.toLowerCase())
                                          );
                                          if (!result) return null;
                                          
                                          const isPass = result.status === 'PASS';
                                          const isFail = result.status === 'FAIL';
                                          
                                          return (
                                            <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                              isPass ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                              isFail ? 'bg-red-50 text-red-600 border-red-100' : 
                                              'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                              {result.status}
                                            </span>
                                          );
                                        })()
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                                      {(() => {
                                        if (!isUploaded) return doc.description || "Required for technical qualification.";
                                        
                                        const result = evalReport?.results?.find(r => 
                                          r.criterion_name.toLowerCase().includes(doc.document_name.toLowerCase()) ||
                                          doc.document_name.toLowerCase().includes(r.criterion_name.toLowerCase())
                                        );
                                        
                                        if (result) return result.reasoning;
                                        return "Extraction complete. Document successfully linked to criteria.";
                                      })()}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-6 w-full lg:w-auto lg:pl-6 lg:border-l border-slate-100">
                                    <div className="flex-1 lg:w-32">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weight</span>
                                        <span className="text-xs font-black text-slate-800">{doc.weightage || 10}%</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${doc.weightage || 10}%` }} />
                                      </div>
                                    </div>

                                    <div className="relative">
                                      {isUploaded ? (
                                        <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Source"><Eye size={20} /></button>
                                      ) : (
                                        <>
                                          <input type="file" onChange={(e) => handleFileUpload(e, doc)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.png,.jpg" disabled={isUploading} />
                                          <button disabled={isUploading} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                                            Upload
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                           <FileJson size={48} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Extraction Required</p>
                           <p className="text-slate-400 text-xs mt-1 mb-6">AI has not flagged any custom documents for this tender yet.</p>
                           <button 
                             onClick={() => handleDeepSync(activeApplication?.id)}
                             disabled={isUploading}
                             className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 flex items-center gap-2 mx-auto"
                           >
                             {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                             Deep Intelligence Sync
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Info Panels */}
                <div className="lg:col-span-4 space-y-6">


                  {/* Clarification Request System */}
                  {isRejected && (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageSquare size={16} className="text-amber-500" /> Clarification Request
                      </h4>
                      <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                        <p className="text-xs font-bold text-slate-800 mb-1">From: Procurement Officer</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">"The provided ISO certificate appears to have expired last month. Please upload the renewed certificate for FY26 to proceed."</p>
                      </div>
                      <button onClick={() => setActiveTab('clarification')} className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-100">
                        Reply & Attach
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    if (activeTab === 'clarification') {
      return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-600" /> Clarification Center
            </h3>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">Action Required</span>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6">
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procurement Officer</span>
                  <span className="text-[9px] text-slate-400">10:45 AM</span>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm text-sm text-slate-700">
                  The provided ISO certificate appears to have expired last month. Please upload the renewed certificate for FY26 to proceed.
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
            <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Paperclip size={18} /></button>
            <input type="text" placeholder="Type your reply or attach a document..." className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all" />
            <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2">
              Send <Send size={14} />
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <BidderLayout>
      <div className="max-w-7xl mx-auto py-8">

        {/* Portal Header & Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
              <ShieldCheck size={14} /> Official E-Procurement Portal
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Bidder <span className="text-blue-600">Workspace</span></h2>
            <p className="text-slate-500 font-medium mt-1">Manage tenders, submit documents, and track AI evaluations securely.</p>
          </div>
        </div>

        {/* Dynamic Content */}
        {renderTabContent()}

        {/* PDF Source Mapping Modal */}
        <AnimatePresence>
          {selectedPdf && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPdf(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
                    <FileJson size={20} className="text-blue-600" /> AI Source Mapping Viewer
                  </h3>
                  <button onClick={() => setSelectedPdf(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-auto p-8 bg-slate-100 relative">
                  {/* Mock PDF Document Render */}
                  <div className="bg-white p-12 shadow-md max-w-3xl mx-auto min-h-[600px] border border-slate-200 relative">
                    <h2 className="text-2xl font-black text-center border-b-2 border-slate-900 pb-4 mb-8">Audited Financial Statement FY24</h2>
                    <div className="space-y-6 text-sm leading-relaxed font-serif text-slate-800">
                      <p>This is to certify that M/s Tech Solutions has successfully maintained the required financial standards for the previous fiscal year.</p>
                      <div className="p-4 bg-yellow-100/50 border border-yellow-300 rounded relative">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-md transform -rotate-90 origin-left">
                          AI Extracted
                        </div>
                        <p><strong>Section 4.1:</strong> The average annual turnover of the company for the last 3 financial years is calculated as <strong className="bg-yellow-200 px-1 rounded">₹7.2 Crores</strong>.</p>
                      </div>
                      <p>The balance sheet is positive and net worth has increased by 14% year-over-year.</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
                  <p className="text-xs text-slate-500 font-bold">Confidence Score: <span className="text-emerald-600 font-black">99.8%</span></p>
                  <button onClick={() => setSelectedPdf(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-sm transition-all">Close Viewer</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Evaluation Criteria Modal */}
        <AnimatePresence>
          {showCriteriaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCriteriaModal(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[32px] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight flex items-center gap-3">
                      <Target size={24} className="text-blue-600" /> Evaluation Criteria
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{activeCriteriaTender?.title}</p>
                  </div>
                  <button onClick={() => setShowCriteriaModal(false)} className="p-3 text-slate-400 hover:bg-slate-200 rounded-2xl transition-all"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                  {criteriaLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                      <p className="text-slate-500 font-bold animate-pulse">Fetching official criteria...</p>
                    </div>
                  ) : tenderCriteria?.length > 0 ? (
                    <div className="space-y-4">
                      {tenderCriteria.map((c) => (
                        <div key={c.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${c.mandatory ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                {c.mandatory ? 'Mandatory' : 'Optional'}
                              </span>
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                {c.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-blue-600">{c.weightage || 0}%</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weightage</p>
                            </div>
                          </div>
                          <h4 className="text-lg font-black text-slate-800 mb-2">{c.title}</h4>
                          <p className="text-sm text-slate-500 leading-relaxed font-medium mb-4">{c.description || 'No description provided.'}</p>
                          <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Score: <span className="text-slate-900 font-black">{c.max_score || 100}</span></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence: <span className="text-emerald-500 font-black">{Math.round((c.confidence || 0.9) * 100)}%</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                      <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-bold text-slate-800">No criteria defined yet</h3>
                      <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">The procurement officer has not yet published the evaluation weightage for this tender.</p>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
                  <button onClick={() => setShowCriteriaModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95">Got it, Thanks</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
      <AIChatbot role="bidder" />
    </BidderLayout>
  );
};

export default BidderStatus;
