import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { ShieldAlert, AlertCircle, Share2, Map, Users, ExternalLink } from 'lucide-react';

const FraudAlertCard = ({ bidder, risk, reason, score }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${risk === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
        {risk} Risk
      </div>
      <span className="text-xl font-bold text-slate-800">{score}%</span>
    </div>
    <h4 className="font-bold text-slate-800 mb-2">{bidder}</h4>
    <p className="text-sm text-slate-500 leading-relaxed mb-6">{reason}</p>
    <div className="flex gap-3">
      <button className="flex-1 text-xs font-bold py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Details</button>
      <button className="flex-1 text-xs font-bold py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">Flag Bidder</button>
    </div>
  </div>
);

const FraudDetection = () => {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Fraud & Collusion Detection</h2>
        <p className="text-slate-500">Cross-bidder relationship analysis and suspicious activity monitoring.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Network Graph Placeholder */}
        <div className="lg:col-span-2 glass-card p-8 border-slate-100 relative min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-800 text-lg">Relationship Network Graph</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Bidder</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase"><div className="w-2 h-2 rounded-full bg-red-500"></div> Linked Director</span>
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-center opacity-20">
                <Share2 size={200} className="mx-auto text-blue-600 mb-4" />
                <p className="font-bold text-2xl">Network Visualization Area</p>
                <p>Interactive graph showing shared directors and addresses</p>
             </div>
          </div>
          
          {/* Mock Nodes */}
          <div className="relative z-1 h-full">
            <div className="absolute top-1/4 left-1/4 p-4 bg-white border border-blue-100 rounded-xl shadow-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-blue"></div>
              <span className="text-sm font-bold">ABC Corp</span>
            </div>
            <div className="absolute bottom-1/4 left-1/3 p-4 bg-white border border-blue-100 rounded-xl shadow-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-blue"></div>
              <span className="text-sm font-bold">XYZ Ltd</span>
            </div>
            <div className="absolute top-1/2 right-1/4 p-4 bg-white border border-red-100 rounded-xl shadow-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500"></div>
              <span className="text-sm font-bold text-red-600">Common Director</span>
            </div>
          </div>
        </div>

        {/* Alerts Sidebar */}
        <div className="space-y-6">
          <div className="bg-red-600 rounded-2xl p-6 text-white shadow-xl shadow-red-200">
            <div className="flex justify-between items-start mb-6">
              <ShieldAlert size={32} />
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">2 CRITICAL</span>
            </div>
            <h3 className="text-xl font-bold mb-2">High Risk Detected</h3>
            <p className="text-red-100 text-sm mb-6"> Collusion pattern detected between Bharat Electronics and Garrison Supplies based on shared IP addresses during submission.</p>
            <button className="w-full py-3 bg-white text-red-600 font-bold rounded-xl flex items-center justify-center gap-2">
              <AlertCircle size={18} />
              Review Critical Cases
            </button>
          </div>

          <h3 className="font-bold text-slate-800 text-lg">Active Alerts</h3>
          <FraudAlertCard 
            bidder="Modern Garments Pvt"
            risk="HIGH"
            reason="Multiple bids submitted from same terminal/IP address."
            score={92}
          />
          <FraudAlertCard 
            bidder="Supreme Exports"
            risk="MEDIUM"
            reason="Common board member found in external database check."
            score={68}
          />
        </div>
      </div>

      {/* Global Risk Stats */}
      <div className="mt-8 grid md:grid-cols-4 gap-6">
        {[
          { label: "IP Overlaps", value: "12", icon: Map },
          { label: "Shared Directors", value: "4", icon: Users },
          { label: "Document Similarity", value: "85%", icon: Share2 },
          { label: "External Flags", value: "3", icon: ExternalLink },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default FraudDetection;
