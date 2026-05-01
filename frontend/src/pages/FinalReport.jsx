import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { Download, FileText, CheckCircle, Clock, ShieldCheck, Printer } from 'lucide-react';

const FinalReport = () => {
  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 no-print">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Tender Evaluation Report</h2>
            <p className="text-slate-500">Summary of all evaluated bidders and final recommendations.</p>
          </div>
          <div className="flex gap-3">
             <button className="btn-secondary flex items-center gap-2" onClick={() => window.print()}>
                <Printer size={18} /> Print
             </button>
             <button className="btn-primary flex items-center gap-2">
                <Download size={18} /> Download PDF
             </button>
          </div>
        </div>

        <div className="bg-white p-12 border border-slate-200 shadow-xl rounded-2xl print:shadow-none print:border-none">
           {/* Report Header */}
           <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-12">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 gradient-blue rounded-xl flex items-center justify-center text-white font-bold text-2xl">S</div>
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900">SHAKTI AI</h1>
                    <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Procurement Excellence</p>
                 </div>
              </div>
              <div className="text-right text-sm">
                 <p className="font-bold text-slate-800">Report ID: #REP-2026-9042</p>
                 <p className="text-slate-500">Date: May 01, 2026</p>
                 <p className="text-slate-500">Department: CRPF Procurement Wing</p>
              </div>
           </div>

           {/* Executive Summary */}
           <div className="mb-12">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <FileText size={20} className="text-blue-600" />
                 Executive Summary
              </h3>
              <div className="grid grid-cols-3 gap-6 mb-6">
                 <div className="p-4 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Bids</span>
                    <span className="text-2xl font-bold text-slate-800">42</span>
                 </div>
                 <div className="p-4 bg-green-50 rounded-xl">
                    <span className="text-[10px] font-bold text-green-400 uppercase block mb-1">Qualified</span>
                    <span className="text-2xl font-bold text-green-600">12</span>
                 </div>
                 <div className="p-4 bg-red-50 rounded-xl">
                    <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">Disqualified</span>
                    <span className="text-2xl font-bold text-red-600">30</span>
                 </div>
              </div>
              <p className="text-slate-600 leading-relaxed italic border-l-4 border-blue-600 pl-6 py-2">
                 The evaluation process was conducted using SHAKTI AI 2.0 with a confidence threshold of 95%. 12 bidders have met all mandatory technical and financial criteria. Fraud detection algorithms found no significant collusion patterns among the qualified group.
              </p>
           </div>

           {/* Recommendations Table */}
           <div className="mb-12">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Final Recommendations</h3>
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-slate-200">
                       <th className="py-4 font-bold text-slate-400 uppercase text-[10px]">Rank</th>
                       <th className="py-4 font-bold text-slate-400 uppercase text-[10px]">Bidder Name</th>
                       <th className="py-4 font-bold text-slate-400 uppercase text-[10px]">Technical Score</th>
                       <th className="py-4 font-bold text-slate-400 uppercase text-[10px]">Compliance</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {[
                       { rank: 1, name: "Bharat Electronics Ltd", score: "98.5/100", status: "Verified" },
                       { rank: 2, name: "Supreme Exports", score: "96.2/100", status: "Verified" },
                       { rank: 3, name: "Advanced Tactical Ltd", score: "94.8/100", status: "Verified" },
                       { rank: 4, name: "Defence Systems Pvt", score: "92.0/100", status: "Verified" },
                    ].map((item, i) => (
                       <tr key={i}>
                          <td className="py-4 font-bold text-slate-800">#{item.rank}</td>
                          <td className="py-4 text-slate-700 font-medium">{item.name}</td>
                          <td className="py-4 text-blue-600 font-bold">{item.score}</td>
                          <td className="py-4">
                             <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                <ShieldCheck size={14} /> {item.status}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Audit Trail Snippet */}
           <div className="mt-20 pt-12 border-t border-slate-100 flex justify-between items-end">
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock size={12} /> Last system sync: 2026-05-01 14:20 IST
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <CheckCircle size={12} /> Digitally Signed by CRPF Officer Wing-A
                 </div>
              </div>
              <div className="w-32 h-32 opacity-20">
                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SHAKTI-REP-9042" alt="Verification QR" />
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinalReport;
