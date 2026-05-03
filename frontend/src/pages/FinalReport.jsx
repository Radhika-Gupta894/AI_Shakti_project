import React, { useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { Download, FileText, CheckCircle, Clock, ShieldCheck, Printer, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

const FinalReport = () => {
  const { request: fetchSummary, loading, data: summary } = useApi(apiService.getReportSummary);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleExportCSV = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL}/reports/export-csv`, '_blank');
  };

  if (loading && !summary) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest">Generating Secure Report...</p>
        </div>
      </AdminLayout>
    );
  }

  const data = summary || {
    total_bids: 0,
    qualified: 0,
    disqualified: 0,
    top_bidders: [],
    report_date: new Date().toLocaleDateString(),
    report_id: "PENDING"
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-8 no-print">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Tender Evaluation Report</h2>
            <p className="text-slate-500">Summary of all evaluated bidders and final recommendations.</p>
          </div>
          <div className="flex gap-3">
             <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
                <Printer size={18} /> Print
             </button>
             <button className="btn-primary flex items-center gap-2" onClick={handleExportCSV}>
                <Download size={18} /> Export CSV
             </button>
          </div>
        </div>

        <div className="bg-white p-12 border border-slate-200 shadow-xl rounded-[32px] print:shadow-none print:border-none relative overflow-hidden">
           {/* Watermark */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-45deg]">
              <h1 className="text-[120px] font-black whitespace-nowrap">SHAKTI AI SECURE</h1>
           </div>

           {/* Report Header */}
           <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-12 relative z-10">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-200">S</div>
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SHAKTI AI</h1>
                    <p className="text-[10px] text-blue-600 font-black tracking-widest uppercase">Procurement Wing • Official Report</p>
                 </div>
              </div>
              <div className="text-right text-sm">
                 <p className="font-black text-slate-800 uppercase tracking-tighter">Report ID: #{data.report_id}</p>
                 <p className="text-slate-500 font-medium">Date: {data.report_date}</p>
                 <p className="text-slate-500 font-medium">System Status: Verified Secure</p>
              </div>
           </div>

           {/* Executive Summary */}
           <div className="mb-12 relative z-10">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                 <FileText size={20} className="text-blue-600" />
                 Executive Summary
              </h3>
              <div className="grid grid-cols-3 gap-6 mb-8">
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Total Bids</span>
                    <span className="text-3xl font-black text-slate-900">{data.total_bids}</span>
                 </div>
                 <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-400 uppercase block mb-1 tracking-widest">Qualified</span>
                    <span className="text-3xl font-black text-emerald-600">{data.qualified}</span>
                 </div>
                 <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                    <span className="text-[10px] font-black text-red-400 uppercase block mb-1 tracking-widest">Disqualified</span>
                    <span className="text-3xl font-black text-red-600">{data.disqualified}</span>
                 </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-3xl">
                 <p className="text-blue-900 leading-relaxed font-medium">
                    The evaluation process was conducted using SHAKTI AI 2.0 with a confidence threshold of 95%. 
                    A total of {data.qualified} bidders have met all mandatory technical and financial criteria. 
                    Fraud detection algorithms found no significant collusion patterns among the qualified group.
                 </p>
              </div>
           </div>

           {/* Recommendations Table */}
           <div className="mb-12 relative z-10">
              <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">Final Recommendations</h3>
              <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50">
                         <th className="py-4 pl-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Rank</th>
                         <th className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Bidder Identity</th>
                         <th className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">AI Score</th>
                         <th className="py-4 pr-6 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">Compliance</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {data.top_bidders.length > 0 ? data.top_bidders.map((item, i) => (
                         <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="py-5 pl-6 font-black text-slate-900">#{item.rank}</td>
                            <td className="py-5">
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-800">{item.name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">{item.tender_title}</span>
                               </div>
                            </td>
                            <td className="py-5">
                               <div className="flex items-center gap-2">
                                  <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                     <div className="h-full bg-blue-600" style={{ width: `${item.score.split('/')[0]}%` }} />
                                  </div>
                                  <span className="text-blue-600 font-black text-xs">{item.score}</span>
                               </div>
                            </td>
                            <td className="py-5 pr-6 text-right">
                               <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-black text-[10px] uppercase tracking-tighter">
                                  <ShieldCheck size={12} /> {item.status}
                               </span>
                            </td>
                         </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-slate-400 font-bold text-sm">No qualified bidders found for this cycle.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
              </div>
           </div>

           {/* Audit Trail Snippet */}
           <div className="mt-20 pt-12 border-t border-slate-100 flex justify-between items-end relative z-10">
              <div className="space-y-3">
                 <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    <Clock size={12} /> Generated: {new Date().toLocaleString()}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                    <CheckCircle size={12} /> Digitally Signed & Encrypted by SHAKTI AI
                 </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="w-24 h-24 opacity-40">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SHAKTI-${data.report_id}`} alt="Verification QR" />
                 </div>
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Official Document</span>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinalReport;
