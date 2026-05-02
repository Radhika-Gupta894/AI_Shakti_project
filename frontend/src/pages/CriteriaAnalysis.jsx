import React, { useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { BadgeCheck, Info, FileText, DollarSign, Award, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

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
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{type}</div>
    <h4 className="font-bold text-slate-800 mb-2">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed mb-4">{value}</p>
    <div className="flex items-center gap-2 text-xs text-blue-600 font-medium cursor-pointer hover:underline">
      <FileText size={14} />
      <span>View Source in PDF</span>
    </div>
  </div>
);

const CriteriaAnalysis = () => {
  const { request: fetchTender, loading, error, data: tender } = useApi(apiService.getLatestTender);

  useEffect(() => {
    fetchTender();
  }, [fetchTender]);

  const criteria = tender?.criteria || {};
  
  const allCriteria = [
    ...(criteria.technical_criteria || []).map(c => ({ ...c, type: 'Technical', icon: Award })),
    ...(criteria.financial_criteria || []).map(c => ({ ...c, type: 'Financial', icon: DollarSign })),
    ...(criteria.compliance_criteria || []).map(c => ({ ...c, type: 'Compliance', icon: BadgeCheck })),
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Extracted Criteria</h2>
          <p className="text-slate-500">{tender?.title || 'Loading Tender Analysis...'}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary py-2" onClick={() => fetchTender()}>Refresh</button>
          <button className="btn-primary py-2">Confirm & Start Evaluations</button>
        </div>
      </div>

      {loading && !tender && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
          <p className="text-slate-500">Fetching AI Extraction results...</p>
        </div>
      )}

      {error && (
        <div className="p-8 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center text-center">
          <AlertCircle size={40} className="text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-800">Unable to load criteria</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button onClick={() => fetchTender()} className="btn-primary">Try Again</button>
        </div>
      )}

      {tender && (
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
                  <span className="text-slate-400">Tender ID</span>
                  <span className="font-medium">#{tender.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">OCR Status</span>
                  <span className="font-medium text-green-600">Success</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Model</span>
                  <span className="font-medium">Gemini 1.5 Flash</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
              <ShieldCheck size={32} className="mb-4 opacity-80" />
              <h4 className="font-bold text-lg mb-2">Policy Check</h4>
              <p className="text-blue-100 text-sm leading-relaxed">All extracted criteria comply with the GFR 2017 procurement guidelines.</p>
            </div>
          </div>

          {/* Criteria Grid */}
          <div className="lg:col-span-3">
            {allCriteria.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center">
                <FileText size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No specific criteria were found in this document.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {allCriteria.map((item, idx) => (
                  <CriterionCard 
                    key={idx}
                    icon={item.icon}
                    type={item.type}
                    title={item.name}
                    value={item.description}
                    mandatory={item.mandatory}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CriteriaAnalysis;
