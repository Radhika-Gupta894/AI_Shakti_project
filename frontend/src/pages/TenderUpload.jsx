import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { Upload, File, CheckCircle2, Loader2, Search, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

const TenderUpload = () => {
  const [file, setFile] = useState(null);
  const { request: uploadTender, loading, progress, error, data } = useApi(apiService.uploadTender);
  const [step, setStep] = useState(1); // 1: Upload, 2: Processing, 3: Success

  const handleUpload = async () => {
    if (!file) return;
    setStep(2);
    try {
      await uploadTender(file);
      setStep(3);
    } catch (err) {
      setStep(1); // Go back to upload on error
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">New Tender Analysis</h2>
          <p className="text-slate-500">Upload your tender document (PDF/Image) to extract eligibility criteria automatically.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="glass-card p-12 border-dashed border-2 border-slate-200 text-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
                  <Upload size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Select Tender Document</h3>
                <p className="text-slate-400 mb-8 max-w-sm">Drag and drop your PDF file here, or click to browse files from your computer.</p>
                
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files[0])} 
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                      <File className="text-slate-500" size={18} />
                      <span className="text-sm font-medium text-slate-700">{file.name}</span>
                    </div>
                    <button 
                      onClick={handleUpload} 
                      disabled={loading}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {loading ? 'Uploading...' : 'Start AI Extraction'}
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="btn-secondary cursor-pointer">
                    Browse Files
                  </label>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-8">
                  <Loader2 className="text-blue-600 animate-spin" size={60} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="text-blue-600/40" size={24} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Document...</h3>
                <p className="text-sm text-slate-400 mb-4">Upload Progress: {progress}%</p>
                <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full gradient-blue"
                  />
                </div>
                <div className="mt-6 space-y-2 text-sm text-slate-500">
                  <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> OCR Text Extraction</p>
                  <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Processing with SHAKTI AI...</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Extraction Complete</h3>
                <p className="text-slate-400 mb-8">SHAKTI AI has successfully identified the eligibility parameters.</p>
                
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="btn-secondary">Upload Another</button>
                  <a href="/admin/criteria" className="btn-primary">View Criteria Details</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TenderUpload;
