import React from 'react';
import BidderLayout from '../layouts/BidderLayout';
import { Clock, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';

const StatusRow = ({ doc, status, remarks, date }) => (
  <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
    <td className="py-4 font-medium text-slate-800">{doc}</td>
    <td className="py-4">
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        status === 'Verified' ? 'bg-green-50 text-green-600' : 
        status === 'Processing' ? 'bg-blue-50 text-blue-600' : 
        'bg-amber-50 text-amber-600'
      }`}>
        {status}
      </span>
    </td>
    <td className="py-4 text-sm text-slate-500">{remarks}</td>
    <td className="py-4 text-sm text-slate-400">{date}</td>
  </tr>
);

const BidderStatus = () => {
  return (
    <BidderLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Application Status</h2>
          <p className="text-slate-500">Tender #CRPF-2026-0982: Supply of Tactical Gear</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
           <div className="glass-card p-6 border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Overall Status</span>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                 <span className="text-xl font-bold text-blue-600 uppercase">Evaluating</span>
              </div>
           </div>
           <div className="glass-card p-6 border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Docs Verified</span>
              <span className="text-xl font-bold text-slate-800">4 / 6</span>
           </div>
           <div className="glass-card p-6 border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">AI Score</span>
              <span className="text-xl font-bold text-green-600">PRE-QUALIFIED</span>
           </div>
           <div className="glass-card p-6 border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Last Update</span>
              <span className="text-xl font-bold text-slate-800">2h Ago</span>
           </div>
        </div>

        <div className="glass-card overflow-hidden border-slate-100">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800">Document Verification Trail</h3>
             <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                <Download size={14} /> Download Receipt
             </button>
          </div>
          <div className="p-6">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4">Document</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">AI Remarks</th>
                  <th className="pb-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <StatusRow 
                  doc="GST Registration" 
                  status="Verified" 
                  remarks="Document valid until Dec 2026. PAN match confirmed." 
                  date="May 01, 10:20 AM" 
                />
                <StatusRow 
                  doc="ISO 9001:2015" 
                  status="Verified" 
                  remarks="Certificate authentic. NABL accredited issuer." 
                  date="May 01, 10:22 AM" 
                />
                <StatusRow 
                  doc="ISO 14001:2015" 
                  status="Manual Review" 
                  remarks="Blurry scan. AI could not read the issue date." 
                  date="May 01, 10:25 AM" 
                />
                <StatusRow 
                  doc="Financial Audit FY25" 
                  status="Processing" 
                  remarks="Analyzing turnover thresholds (50 Cr+)." 
                  date="May 01, 11:45 AM" 
                />
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
           <AlertCircle className="text-amber-600 shrink-0" size={24} />
           <div>
              <h4 className="font-bold text-amber-900 mb-1">Action Required</h4>
              <p className="text-sm text-amber-700 mb-4">Your ISO 14001 certificate is flagged as unreadable. Please upload a high-resolution scan to proceed with automatic evaluation.</p>
              <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">Re-upload Document</button>
           </div>
        </div>
      </div>
    </BidderLayout>
  );
};

export default BidderStatus;
