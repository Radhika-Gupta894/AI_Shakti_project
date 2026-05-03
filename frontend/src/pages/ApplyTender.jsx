import React, { useState, useEffect } from 'react';
import BidderLayout from '../layouts/BidderLayout';
import { FileUp, CheckCircle, AlertCircle, Trash2, Info, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useParams, useNavigate } from 'react-router-dom';

const DocumentUpload = ({ label, type, bidderId, tenderId, docType, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const { request: uploadDoc, loading, progress, error, data } = useApi(apiService.uploadBidderDocument);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      await uploadDoc(bidderId, tenderId, docType, file);
      onUploadSuccess(docType);
    } catch (err) {
      console.error(err);
    }
  };

  const status = data ? 'uploaded' : (loading ? 'uploading' : 'pending');

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status === 'uploaded' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
          {loading ? <Loader2 size={24} className="animate-spin" /> : <FileUp size={24} />}
        </div>
        <div>
          <h4 className="font-bold text-slate-800">{label}</h4>
          <p className="text-xs text-slate-400">{type} • Max 10MB</p>
          {loading && (
            <div className="w-32 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {status === 'uploaded' ? (
          <>
            <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle size={14} />
              Verified
            </div>
            <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={18} />
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            {!file ? (
              <label htmlFor={`doc-upload-${docType}`} className="btn-secondary py-2 text-sm cursor-pointer">
                Select File
                <input 
                  id={`doc-upload-${docType}`}
                  name={`doc-upload-${docType}`}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 truncate max-w-[100px]">{file.name}</span>
                <button 
                  onClick={handleUpload} 
                  disabled={loading}
                  className="btn-primary py-2 text-sm"
                >
                  {loading ? `${progress}%` : 'Upload'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="absolute mt-16 text-[10px] text-red-500">{error}</p>}
    </div>
  );
};

const ApplyTender = () => {
  const { id } = useParams();
  const [tender, setTender] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch tender details if needed, or just use the ID
    const fetchTenderDetails = async () => {
      try {
        const response = await apiService.getTenders();
        const found = response.data.find(t => t.id === parseInt(id));
        if (found) setTender(found);
      } catch (err) {
        console.error("Failed to fetch tender details", err);
      }
    };
    fetchTenderDetails();
  }, [id]);

  const handleUploadSuccess = (type) => {
    setUploadedDocs(prev => [...prev, type]);
  };

  const handleFinalSubmission = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // For demo, we use bidderId = 1
      await apiService.finalizeSubmission(id, 1);
      // Success! Redirect to status page
      setTimeout(() => {
        navigate('/bidder/status');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  const isFormComplete = uploadedDocs.length >= 3;

  return (
    <BidderLayout>
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Apply to Tender</h2>
            <p className="text-slate-500">{tender ? tender.title : `Tender #${id}`}</p>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Deadline</span>
             <span className="text-sm font-bold text-red-600">12 Days Left</span>
          </div>
        </div>

        <div className="bg-blue-600 rounded-3xl p-8 text-white mb-8 relative overflow-hidden shadow-xl shadow-blue-200">
           <div className="relative z-1">
             <div className="flex items-center gap-3 mb-4">
               <Info size={24} />
               <h3 className="text-lg font-bold">AI Compliance Engine</h3>
             </div>
             <p className="text-blue-100 mb-6 max-w-2xl">
               SHAKTI AI will automatically scan your documents for compliance. Ensure all certificates are clearly visible.
             </p>
           </div>
        </div>

        <h3 className="font-bold text-slate-800 text-lg mb-6">Required Documents</h3>
        <div className="space-y-4 mb-10">
          <DocumentUpload 
            label="GST Registration" 
            type="PDF/Image" 
            docType="GST" 
            bidderId={1} 
            tenderId={id} 
            onUploadSuccess={handleUploadSuccess} 
          />
          <DocumentUpload 
            label="ISO 9001:2015 Certificate" 
            type="PDF/Image" 
            docType="ISO" 
            bidderId={1} 
            tenderId={id} 
            onUploadSuccess={handleUploadSuccess} 
          />
          <DocumentUpload 
            label="Financial Audit (FY 2024-25)" 
            type="PDF" 
            docType="Financial" 
            bidderId={1} 
            tenderId={id} 
            onUploadSuccess={handleUploadSuccess} 
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3 text-slate-600">
              <AlertCircle size={20} className="text-amber-500" />
              <div>
                <p className="text-sm font-bold text-slate-800">Final Verification</p>
                <p className="text-xs text-slate-500">Submit your documents for AI evaluation.</p>
              </div>
           </div>
           <button 
             onClick={handleFinalSubmission}
             disabled={submitting}
             className={`px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center gap-3 ${
               submitting
               ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
               : 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95'
             }`}
           >
             {submitting ? (
               <>
                 <Loader2 size={18} className="animate-spin" />
                 Processing Bid...
               </>
             ) : 'Final Submission'}
           </button>
        </div>
      </div>
    </BidderLayout>
  );
};

export default ApplyTender;
