import { FileText, CheckCircle2, AlertCircle, FileSearch } from 'lucide-react';

export default function TenderAnalysis() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tender Document Analysis</h1>
        <p className="text-gray-500 text-sm">AI-extracted criteria and requirements from tender TR-2026-991</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - PDF Viewer Mock */}
        <div className="w-1/2 border-r border-gray-200 bg-gray-100 p-6 overflow-auto">
          <div className="bg-white shadow-lg rounded-sm min-h-max p-8 mx-auto max-w-2xl border border-gray-300">
            <div className="mb-8 border-b-2 border-gray-800 pb-4">
              <h2 className="text-xl font-bold text-center">GOVERNMENT PROCUREMENT DEPARTMENT</h2>
              <p className="text-center text-sm text-gray-600">REQUEST FOR PROPOSAL (RFP)</p>
            </div>
            
            <div className="space-y-6 text-sm leading-relaxed text-gray-700">
              <p>1. INTRODUCTION</p>
              <p>The Department invites eligible bidders to submit proposals for the implementation of an AI-based evaluation system.</p>
              
              <div className="bg-yellow-100/50 p-2 border-l-4 border-yellow-400 relative group">
                <p>2.1 FINANCIAL ELIGIBILITY</p>
                <p>The bidder must have an <span className="bg-yellow-200 font-semibold">average annual turnover of not less than $5,000,000</span> during the last three financial years.</p>
                <div className="absolute right-2 top-2 hidden group-hover:block bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">Extracted: Fin-Req-01</div>
              </div>

              <div className="bg-green-100/50 p-2 border-l-4 border-green-400 relative group mt-4">
                <p>2.2 TECHNICAL CERTIFICATION</p>
                <p>The bidding entity must possess a valid <span className="bg-green-200 font-semibold">ISO 27001 certification</span> for information security management.</p>
              </div>

              <p>3. SUBMISSION GUIDELINES</p>
              <p>All documents must be digitally signed and submitted via the e-procurement portal before the deadline.</p>
            </div>
          </div>
        </div>

        {/* Right Side - AI Extraction Panel */}
        <div className="w-1/2 bg-white flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold flex items-center gap-2"><FileSearch className="w-5 h-5 text-blue-600"/> AI Extracted Criteria</h3>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Confidence: 98%</span>
          </div>
          
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Financial Criteria */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Financial Requirements
              </h4>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-blue-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900">Minimum Annual Turnover</span>
                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Mandatory</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Bidder must have &gt;= $5M average turnover over last 3 years.</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Source: Section 2.1</span>
                    <span className="flex items-center text-green-600 font-medium"><CheckCircle2 className="w-3 h-3 mr-1"/> AI Conf: 99%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Criteria */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div> Technical Requirements
              </h4>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-purple-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900">ISO 27001 Certification</span>
                    <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Mandatory</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Must possess valid information security certification.</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Source: Section 2.2</span>
                    <span className="flex items-center text-green-600 font-medium"><CheckCircle2 className="w-3 h-3 mr-1"/> AI Conf: 97%</span>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900">Past Experience (AI Projects)</span>
                    <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Optional</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Preferred experience in public sector AI deployments.</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Source: Section 2.4</span>
                    <span className="flex items-center text-yellow-600 font-medium"><AlertCircle className="w-3 h-3 mr-1"/> AI Conf: 85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
