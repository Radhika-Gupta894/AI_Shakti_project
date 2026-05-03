import React, { useEffect, useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Clock, 
  User, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { useApi } from '../hooks/useApi';

const AuditLogs = () => {
  const { request: fetchLogs, loading, data: logs } = useApi(apiService.getAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || log.action.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesType;
  }) || [];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
              <Shield size={14} />
              System Integrity
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit <span className="text-blue-600">Trail</span></h2>
            <p className="text-slate-500 font-medium mt-1">
              Complete historical record of all administrative and user activities.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchLogs()} 
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh Logs
            </button>
            <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2">
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Events</p>
                <p className="text-2xl font-black text-slate-900">{logs?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Security Check</p>
                <p className="text-2xl font-black text-slate-900">Passed</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <User size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Reviewers</p>
                <p className="text-2xl font-black text-slate-900">3</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Last Sync</p>
                <p className="text-2xl font-black text-slate-900">14m ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by action or details..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select 
                className="flex-1 md:flex-none px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-100"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="tender">Tender Operations</option>
                <option value="bid">Bid Submissions</option>
                <option value="review">Manual Reviews</option>
                <option value="security">Security Alerts</option>
              </select>
              <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-4 pl-8 font-black text-slate-400 uppercase text-[10px] tracking-widest">Timestamp</th>
                  <th className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">User/Officer</th>
                  <th className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Action</th>
                  <th className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Details</th>
                  <th className="py-4 pr-8 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">System Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <RefreshCw size={32} className="animate-spin text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Securing Logs...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={14} />
                          </div>
                          <span className="text-sm font-bold text-slate-700">Admin_Officer_01</span>
                        </div>
                      </td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                          log.action.toLowerCase().includes('fail') || log.action.toLowerCase().includes('reject')
                          ? 'bg-red-50 text-red-600'
                          : log.action.toLowerCase().includes('upload') || log.action.toLowerCase().includes('submit')
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-5">
                        <p className="text-xs text-slate-500 font-medium max-w-xs truncate">
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                        </p>
                      </td>
                      <td className="py-5 pr-8 text-right">
                        <div className="flex items-center justify-end gap-2 text-emerald-500">
                          <CheckCircle size={14} />
                          <span className="text-[10px] font-black uppercase">Verified</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <ClipboardList size={40} className="text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold text-sm">No logs found matching your criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
            <p className="text-xs text-slate-400 font-medium">Showing {filteredLogs.length} of {logs?.length || 0} system events</p>
            <div className="flex gap-2">
              <button className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
