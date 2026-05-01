import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { BadgeCheck, Info, FileText, DollarSign, Award, ShieldCheck } from 'lucide-react';

const CriterionCard = ({ type, title, value, mandatory, icon: Icon }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
        <Icon size={20} />
      </div>
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${mandatory ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
        {mandatory ? 'Mandatory' : 'Optional'}
      </span>
    </div>
    <h4 className="font-bold text-slate-800 mb-2">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed mb-4">{value}</p>
    <div className="flex items-center gap-2 text-xs text-blue-600 font-medium cursor-pointer hover:underline">
      <FileText size={14} />
      <span>View Source in PDF</span>
    </div>
  </div>
);

const CriteriaAnalysis = () => {
  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Extracted Criteria</h2>
          <p className="text-slate-500">Tender #CRPF-2026-0982: Supply of Tactical Gear</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary py-2">Edit Criteria</button>
          <button className="btn-primary py-2">Confirm & Start Evaluations</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-600" />
              Extraction Meta
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Pages</span>
                <span className="font-medium">42</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">OCR Confidence</span>
                <span className="font-medium text-green-600">98.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI Model</span>
                <span className="font-medium">Gemini 1.5 Pro</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 rounded-2xl p-6 text-white">
            <ShieldCheck size={32} className="mb-4 opacity-80" />
            <h4 className="font-bold text-lg mb-2">Policy Check</h4>
            <p className="text-blue-100 text-sm leading-relaxed">All extracted criteria comply with the GFR 2017 procurement guidelines.</p>
          </div>
        </div>

        {/* Criteria Grid */}
        <div className="lg:col-span-3">
          <div className="grid md:grid-cols-2 gap-6">
            <CriterionCard 
              icon={DollarSign}
              type="Financial"
              title="Annual Turnover"
              value="Average annual turnover of INR 50 Crores for last 3 financial years."
              mandatory={true}
            />
            <CriterionCard 
              icon={Award}
              type="Technical"
              title="Work Experience"
              value="At least 2 similar works of value not less than 20 Crores each in last 5 years."
              mandatory={true}
            />
            <CriterionCard 
              icon={BadgeCheck}
              type="Compliance"
              title="ISO Certification"
              value="Valid ISO 9001:2015 and ISO 14001:2015 certifications required."
              mandatory={true}
            />
            <CriterionCard 
              icon={FileText}
              type="Technical"
              title="Product Testing"
              value="Product must be tested at NABL accredited labs with test report."
              mandatory={false}
            />
            <CriterionCard 
              icon={ShieldCheck}
              type="Compliance"
              title="Anti-Collusion Declaration"
              value="Signed affidavit that bidder has not been blacklisted by any GOI dept."
              mandatory={true}
            />
            <CriterionCard 
              icon={DollarSign}
              type="Financial"
              title="Net Worth"
              value="Positive net worth during the immediately preceding financial year."
              mandatory={true}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CriteriaAnalysis;
