import axios from 'axios';

// Get API base URL from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Something went wrong';
    console.error('API Error:', message);
    // You could trigger a global toast here
    return Promise.reject(error);
  }
);

/**
 * API Service for SHAKTI AI
 */
export const apiService = {
  // Tender APIs
  uploadTender: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-tender', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },

  getTenders: () => api.get('/tenders'),

  // Bidder APIs
  uploadBidderDocument: (bidderId, tenderId, docType, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);
    formData.append('tender_id', tenderId);
    formData.append('bidder_id', bidderId);
    return api.post('/upload-bidder-doc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },

  // Evaluation APIs
  evaluateBidder: (tenderId, bidderId) => {
    return api.post('/evaluate-bidder', null, {
      params: { tender_id: tenderId, bidder_id: bidderId },
    });
  },

  getEvaluationReport: (id) => api.get(`/evaluation-report/${id}`),

  getDashboardStats: () => api.get('/dashboard-stats'),

  getFraudDetection: () => api.get('/fraud-detection'),

  getAuditLogs: () => api.get('/audit-logs'),
};

export default api;
