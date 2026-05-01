import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { CheckCircle2, XCircle, AlertCircle, FileSearch, ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const EvaluationRow = ({ criterion, required, found, status, reason, score }) => (
  <div className="border-b border-slate-100 py-6 last:border-0">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        {status === 'PASS' ? <CheckCircle2 className="text-green-500" size={20} /> : 
         status === 'FAIL' ? <XCircle className="text-red-500" size={20} /> : 
         <AlertCircle className="text-amber-500" size={20} />}
        <h4 className="font-bold text-slate-800">{criterion}</h4>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">AI Confidence</span>
        <span className="text-sm font-bold text-blue-600">{score}%</span>
      </div>
    </div>
    
    <div className="grid md:grid-cols-2 gap-8 mb-4">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Required Value</span>
        <p className="text-sm text-slate-700">{required}</p>
      </div>
      <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100">
        <span className="text-[10px] font-bold text-blue-400 uppercase block mb-2">Extracted Value</span>
        <p className="text-sm text-slate-800 font-medium">{found}</p>
      </div>
    </div>

    <div className="flex items-start gap-3 text-sm">
      <div className="mt-1 flex-shrink-0">
        <FileSearch size={16} className="text-slate-400" />
      </div>
      <div>
        <span className="font-bold text-slate-800">Reasoning: </span>
        <span className="text-slate-600">{reason}</span>
        <button className="ml-2 text-blue-600 font-medium hover:underline">View Source in Bidder Doc</button>
      </div>
    </div>
  </div>
);

const ExplainabilityPage = () => {
  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/admin/evaluations" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">AI Decision Rationale</h2>
            <p className="text-slate-500">Bharat Electronics Ltd • Tender #CRPF-2026-0982</p>
          </div>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download size={18} />
          Export Report
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Criteria Evaluation Detail</h3>
            <EvaluationRow 
              criterion="Annual Turnover"
              required="Min 50 Cr average for 3 years"
              found="Avg 62.5 Cr (FY23: 58Cr, FY24: 65Cr, FY25: 64.5Cr)"
              status="PASS"
              reason="Financial statements from 2023-2025 were analyzed. Auditor certified values match the requirement."
              score={99}
            />
            <EvaluationRow 
              criterion="Work Experience"
              required="2 works of 20 Cr+ in last 5 years"
              found="Project X (25 Cr, 2024), Project Y (18.5 Cr, 2022)"
              status="FAIL"
              reason="The second project value (18.5 Cr) is below the mandatory threshold of 20 Cr."
              score={98}
            />
            <EvaluationRow 
              criterion="ISO Certification"
              required="ISO 9001:2015 & 14001:2015"
              found="ISO 9001 found. ISO 14001 document is blurry/unreadable."
              status="REVIEW"
              reason="OCR could not confidently verify the expiry date on ISO 14001 certificate due to poor scan quality."
              score={62}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Overall Verdict</h3>
            <div className="flex flex-col items-center py-6">
              <div className="w-24 h-24 rounded-full border-8 border-red-50 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-red-600">FAIL</span>
              </div>
              <p className="text-center text-sm text-slate-500 px-4">
                Bidder failed 1 mandatory criterion and 1 requires manual review.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <button className="btn-primary w-full py-3 bg-red-600 hover:bg-red-700">Reject Bidder</button>
              <button className="btn-secondary w-full py-3 text-amber-600 border-amber-200 hover:bg-amber-50">Request Clarification</button>
            </div>
          </div>

          <div className="bg-blue-600 rounded-2xl p-6 text-white">
            <h4 className="font-bold mb-2">AI Confidence Map</h4>
            <p className="text-xs text-blue-100 mb-6">Visual heat-map of data extraction accuracy across documents.</p>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(15)].map((_, i) => (
                <div key={i} className={`h-8 rounded ${i % 4 === 0 ? 'bg-blue-400' : 'bg-white'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExplainabilityPage;
