import { Brain, FileCheck, Info, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

export default function ExplainableAI() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-600" /> Explainable AI Decisions
        </h1>
        <p className="text-gray-500 mt-1">Detailed criterion-level mapping and decision rationale for auditability.</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Nav */}
        <div className="w-64 shrink-0 space-y-2">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg p-3 font-medium flex justify-between items-center cursor-pointer">
            Financial Eligibility <ChevronRight className="w-4 h-4" />
          </div>
          <div className="hover:bg-gray-100 text-gray-700 rounded-lg p-3 font-medium flex justify-between items-center cursor-pointer transition-colors">
            Technical Certifications <ChevronRight className="w-4 h-4 text-transparent" />
          </div>
          <div className="hover:bg-gray-100 text-gray-700 rounded-lg p-3 font-medium flex justify-between items-center cursor-pointer transition-colors">
            Past Experience <ChevronRight className="w-4 h-4 text-transparent" />
          </div>
          <div className="hover:bg-gray-100 text-gray-700 rounded-lg p-3 font-medium flex justify-between items-center cursor-pointer transition-colors">
            Compliance Affidavits <ChevronRight className="w-4 h-4 text-transparent" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <div className="glass-card border-l-4 border-l-green-500 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded uppercase">
                <CheckCircle2 className="w-3 h-3 mr-1" /> PASS
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Criterion: Minimum Annual Turnover</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Requirement</p>
                <p className="text-sm font-medium">&gt;= $5,000,000 avg over last 3 years</p>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-500 uppercase font-semibold mb-1">Extracted Value</p>
                <p className="text-sm font-medium text-blue-900">$6,250,000 (Avg 2021-2023)</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" /> AI Explanation
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                The model successfully extracted turnover data from "Appendix B: Auditor's Report" (Page 14). The calculated average over the past 3 financial years is $6.25M, which exceeds the mandatory threshold of $5M.
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileCheck className="w-4 h-4" /> Source: auditor_report_2023.pdf (Pg 14)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Confidence Score:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                  </div>
                  <span className="text-xs font-bold text-green-600">99%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card border-l-4 border-l-red-500 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded uppercase">
                <XCircle className="w-3 h-3 mr-1" /> FAIL
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Criterion: ISO 27001 Certification</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Requirement</p>
                <p className="text-sm font-medium">Valid ISO 27001 Certificate</p>
              </div>
              <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                <p className="text-xs text-red-500 uppercase font-semibold mb-1">Extracted Value</p>
                <p className="text-sm font-medium text-red-900">Expired Certificate (Exp: 12-Dec-2024)</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" /> AI Explanation
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                A certificate was found, but the expiration date extracted is in the past. Therefore, the mandatory condition of possessing a *valid* certificate is not met.
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileCheck className="w-4 h-4" /> Source: iso_cert_scan.pdf (Pg 1)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Confidence Score:</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-xs font-bold text-green-600">95%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
