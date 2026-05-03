import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Admin Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import TenderUpload from './pages/TenderUpload';
import CriteriaAnalysis from './pages/CriteriaAnalysis';
import BidderEvaluation from './pages/BidderEvaluation';
import Explainability from './pages/Explainability';
import ManualReview from './pages/ManualReview';
import FraudDetection from './pages/FraudDetection';
import FinalReport from './pages/FinalReport';
import AuditLogs from './pages/AuditLogs';

// Bidder Pages
import ApplyTender from './pages/ApplyTender';
import BidderStatus from './pages/BidderStatus';
import TenderList from './pages/TenderList';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/bidder/login" element={<LandingPage />} /> {/* Placeholder for Login */}

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/upload" element={<TenderUpload />} />
        <Route path="/admin/criteria" element={<CriteriaAnalysis />} />
        <Route path="/admin/evaluations" element={<BidderEvaluation />} />
        <Route path="/admin/explain/:id" element={<Explainability />} />
        <Route path="/admin/manual-review" element={<ManualReview />} />
        <Route path="/admin/fraud" element={<FraudDetection />} />
        <Route path="/admin/audit" element={<AuditLogs />} />
        <Route path="/admin/report" element={<FinalReport />} />

        {/* Bidder Routes */}
        <Route path="/bidder/dashboard" element={<BidderStatus />} />
        <Route path="/bidder/tenders" element={<TenderList />} />
        <Route path="/bidder/apply/:id" element={<ApplyTender />} />
        <Route path="/bidder/status" element={<BidderStatus />} />
        <Route path="/bidder/applications" element={<BidderStatus />} />
        <Route path="/bidder/messages" element={<BidderStatus />} />
      </Routes>
    </Router>
  );
}

export default App;
