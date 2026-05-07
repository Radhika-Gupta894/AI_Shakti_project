import React, { useState, useEffect } from 'react';
import BidderLayout from '../layouts/BidderLayout';
import { FileUp, CheckCircle, AlertCircle, Trash2, Info, Loader2, Eye, X, Zap } from 'lucide-react';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useParams, useNavigate } from 'react-router-dom';

const DocumentPreviewModal = ({ url, onClose }) => {
  if (!url) return null;

  // Simple check for image vs other (handling blob URLs and extension types)
  const isImage = url.startsWith('blob:') || url.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 md:p-8">
      <div className="bg-white rounded-[32px] w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div>
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Document Preview</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SHAKTI AI Compliance Verification</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all active:scale-90"
            title="Close Preview"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 bg-slate-50 overflow-hidden flex items-center justify-center p-4">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              <img src={url} alt="Document Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
            </div>
          ) : (
            <iframe
              src={url}
              title="Document Preview"
              className="w-full h-full border-none rounded-xl bg-white shadow-lg"
            />
          )}
        </div>
        <div className="p-6 bg-white border-t border-slate-100 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-2"
          >
            Back to Application
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentUpload = ({ label, type, bidderId, tenderId, docType, onUploadSuccess, onPreview }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { request: uploadDoc, loading, progress, error, data } = useApi(apiService.uploadBidderDocument);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create a local URL for previewing before upload
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const openDocument = () => {
    if (data?.file_path) {
      // If uploaded, get the server URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const normalizedPath = data.file_path.replace(/\\/g, '/');
      onPreview(`${baseUrl}/${normalizedPath}`);
    } else if (previewUrl) {
      // If not yet uploaded, use the local blob URL
      onPreview(previewUrl);
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
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1 mb-1">
            <Zap size={10} /> AI Sync Active
          </p>
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
            <button
              onClick={openDocument}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-bold text-sm"
              title="Open Document"
            >
              <Eye size={16} />
              Open
            </button>
            <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[100px] mb-1">{file.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={openDocument}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all font-bold text-xs"
                    >
                      <Eye size={14} />
                      Preview
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={loading}
                      className="btn-primary py-1.5 px-4 text-xs font-bold"
                    >
                      {loading ? `${progress}%` : 'Upload Now'}
                    </button>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
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
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [requiredDocs, setRequiredDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

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

    const fetchRequirements = async () => {
      setDocsLoading(true);
      try {
        const res = await apiService.getRequiredDocuments(id);
        setRequiredDocs(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch requirements", err);
      } finally {
        setDocsLoading(false);
      }
    };

    fetchTenderDetails();
    fetchRequirements();
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

  const isFormComplete = requiredDocs.length > 0 && uploadedDocs.length >= requiredDocs.filter(d => d.mandatory).length;

  return (
    <BidderLayout>
      <div className="max-w-4xl mx-auto pb-20">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Apply to Tender</h2>
            <p className="text-slate-500 font-medium">{tender ? tender.title : `Tender #${id}`}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 tracking-widest">Deadline</span>
            <span className="text-sm font-bold text-red-600">12 Days Left</span>
          </div>
        </div>

        <div className="bg-blue-600 rounded-[32px] p-8 text-white mb-10 relative overflow-hidden shadow-2xl shadow-blue-200">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <Info size={24} />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-tight">AI Compliance Engine</h3>
            </div>
            <p className="text-blue-50/80 mb-6 max-w-2xl text-sm leading-relaxed">
              SHAKTI AI will automatically scan your documents for compliance. Ensure all certificates are clearly visible for real-time verification.
            </p>
          </div>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Required Documents</h3>
          <button
            onClick={() => {
              const fetchRequirements = async () => {
                setDocsLoading(true);
                try {
                  const res = await apiService.getRequiredDocuments(id);
                  setRequiredDocs(res.data.data || []);
                } catch (err) {
                  console.error("Failed to fetch requirements", err);
                } finally {
                  setDocsLoading(false);
                }
              };
              fetchRequirements();
            }}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            <Loader2 size={10} className={docsLoading ? 'animate-spin' : ''} /> Sync Requirements
          </button>
        </div>

        <div className="space-y-4 mb-10">
          {docsLoading ? (
            <div className="py-10 text-center bg-white rounded-2xl border border-slate-100">
              <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
              <p className="text-slate-500 font-bold">Fetching requirements...</p>
            </div>
          ) : requiredDocs.length > 0 ? (
            requiredDocs.map((doc) => (
              <DocumentUpload
                key={doc.id}
                label={doc.document_name}
                type={doc.category}
                docType={doc.document_name}
                bidderId={1}
                tenderId={id}
                onUploadSuccess={handleUploadSuccess}
                onPreview={setPreviewDocUrl}
              />
            ))
          ) : (
            <div className="py-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">No document requirements defined for this tender.</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Please contact admin if this is unexpected.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 flex items-center gap-3">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-slate-600">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Final Verification</p>
              <p className="text-xs text-slate-500 font-medium">Submit your documents for AI evaluation and score generation.</p>
            </div>
          </div>
          <button
            onClick={handleFinalSubmission}
            disabled={submitting}
            className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${submitting
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95'
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

      {/* Modal for Document Preview */}
      <DocumentPreviewModal url={previewDocUrl} onClose={() => setPreviewDocUrl(null)} />
    </BidderLayout>
  );
};

export default ApplyTender;

