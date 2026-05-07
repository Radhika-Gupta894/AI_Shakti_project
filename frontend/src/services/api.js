import axios from 'axios';

// Get API base URL from environment variable or default to localhost
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 300 seconds for heavy AI/OCR tasks
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling and logging
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata?.startTime;
    console.log(`✅ API Response: ${response.status} from ${response.config.url} (${duration}ms)`);
    if (duration > 3000) {
      console.warn(`🐌 SLOW API ALERT: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Something went wrong';
    console.error(`❌ API Error [${error.config?.url}]:`, message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ API Timeout: The request took too long.');
    }
    
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

  getLatestTender: () => api.get('/tenders/latest'),

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

  finalizeSubmission: (tenderId, bidderId) => {
    return api.post('/finalize-submission', null, {
      params: { tender_id: tenderId, bidder_id: bidderId },
    });
  },

  getMySubmissions: (bidderId) => api.get(`/my-submissions/${bidderId}`),

  getEvaluationReport: (id) => api.get(`/evaluation-report/${id}`),

  getDashboardStats: () => api.get('/dashboard-stats'),

  getEvaluations: () => api.get('/evaluations'),

  // Fraud Detection
  getFraudAlerts: () => api.get('/fraud-detection'),
  getFraudSummary: () => api.get('/fraud-detection/summary'),
  runFraudScan: () => api.post('/fraud-detection/scan'),
  getAuditLogs: () => api.get('/audit-logs'),
  getAdminDocuments: () => api.get('/admin/documents'),

  // Manual Review
  getManualReview: (docId) => api.get(`/manual-review/${docId}`),
  approveDocument: (data) => api.post('/manual-review/approve', data),
  rejectDocument: (data) => api.post('/manual-review/reject', data),
  requestClarification: (data) => api.post('/manual-review/clarification', data),
  saveReview: (data) => api.post('/manual-review/save', data),

  approveBidder: (id) => api.post(`/approve-bidder/${id}`),
  rejectBidder: (id, reason) => api.post(`/reject-bidder/${id}`, { reason }),
  sendToManualReview: (id, reason) => api.post(`/send-manual-review/${id}`, { reason }),

  askAi: (question) => api.post('/ask-ai', { question }),
  getSystemStatus: () => api.get('/system-status'),
  saveAnnotation: (data) => api.post('/save-annotation', data),
  highlightClause: (data) => api.post('/highlight-clause', data),

  // Criteria Management
  getCriteria: (tenderId) => api.get('/criteria', { params: { tender_id: tenderId } }),
  addCriterion: (data) => api.post('/criteria/add', data),
  updateCriterion: (id, data) => api.put(`/criteria/${id}`, data),
  deleteCriterion: (id) => api.delete(`/criteria/${id}`),
<<<<<<< HEAD

  // AI Services
  extractCriteria: (tenderId) => api.post(`/extract-criteria/${tenderId}`),
  getTenderSummary: (tenderId) => api.get(`/tenders/${tenderId}/summarize`),
  askAI: (question, tenderId) => api.post('/ask-ai', { question, tender_id: tenderId }),

  // Required Documents — Admin → Bidder Sync
  getRequiredDocuments: (tenderId) =>
    api.get(`/tenders/${tenderId}/required-documents`),
  generateRequiredDocuments: (tenderId) =>
    api.post(`/tenders/${tenderId}/generate-required-documents`),
  addRequiredDocument: (tenderId, data) =>
    api.post(`/tenders/${tenderId}/required-documents`, data),
  deleteRequiredDocument: (docId) =>
    api.delete(`/required-documents/${docId}`),
  getBidderUploadedDocuments: (bidderId, tenderId) =>
    api.get(`/bidders/${bidderId}/uploaded-documents`, { params: { tender_id: tenderId } }),
=======
  extractCriteria: (tender_id, force = false) => api.post('/criteria/extract', { tender_id, force }),

  // Profile APIs
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/profile/upload-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
>>>>>>> e45c444 (my local changes)
};

export default api;
