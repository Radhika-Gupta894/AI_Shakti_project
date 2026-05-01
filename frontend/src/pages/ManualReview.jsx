import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { AlertCircle, CheckCircle, XCircle, MessageSquare, ExternalLink } from 'lucide-react';

const ReviewCard = ({ bidder, criterion, issue, ocrScore }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">{bidder}</h4>
          <p className="text-xs text-slate-500">Manual Review Required</p>
        </div>
      </div>
      <div className="text-right">
         <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">OCR Conf.</span>
         <span className="text-sm font-bold text-red-600">{ocrScore}%</span>
      </div>
    </div>
    
    <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm">
       <p className="font-bold text-slate-700 mb-1">Issue: {criterion}</p>
       <p className="text-slate-600">{issue}</p>
    </div>

    <div className="flex gap-2">
       <button className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
         <CheckCircle size={14} /> Approve
       </button>
       <button className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-1">
         <XCircle size={14} /> Reject
       </button>
       <button className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
         <MessageSquare size={14} /> Clarify
       </button>
    </div>
  </div>
);

const ManualReview = () => {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Manual Review Queue</h2>
        <p className="text-slate-500">Decisions flagged by AI for human verification due to low confidence.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReviewCard 
          bidder="Dynamic Solutions"
          criterion="ISO 14001:2015"
          issue="OCR could not read the expiry date on the uploaded scan. Page appears blurry."
          ocrScore={42}
        />
        <ReviewCard 
          bidder="Garrison Supplies"
          criterion="Annual Turnover"
          issue="Financial statement format is non-standard. AI extracted 45Cr but requires verification."
          ocrScore={65}
        />
        <ReviewCard 
          bidder="Supreme Exports"
          criterion="Work Experience"
          issue="Completion certificate is in a regional language. AI translation confidence low."
          ocrScore={58}
        />
      </div>

      <div className="mt-12 glass-card p-8 border-slate-100 flex flex-col items-center justify-center text-center">
         <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <ExternalLink size={24} />
         </div>
         <h3 className="text-lg font-bold text-slate-800">Need more context?</h3>
         <p className="text-slate-500 max-w-md mb-6">Open the full document viewer to inspect the original uploads side-by-side with AI extractions.</p>
         <button className="btn-secondary">Open Advanced Viewer</button>
      </div>
    </AdminLayout>
  );
};

export default ManualReview;
