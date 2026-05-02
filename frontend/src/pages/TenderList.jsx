import React, { useEffect, useState } from 'react';
import BidderLayout from '../layouts/BidderLayout';
import { Search, Filter, Calendar, ArrowRight, FileText, Loader2, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { Link } from 'react-router-dom';

const TenderList = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTenders();
      setTenders(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch tenders. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const filteredTenders = tenders.filter(tender => 
    tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tender.tender_number && tender.tender_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <BidderLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Available Tenders</h2>
            <p className="text-slate-500">Find and apply for government procurement opportunities.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl w-full md:w-80 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading opportunities...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button onClick={fetchTenders} className="btn-primary">Try Again</button>
          </div>
        ) : filteredTenders.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-6">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No tenders found</h3>
            <p className="text-slate-500 mb-8">There are no tenders matching your search or currently available.</p>
            <button onClick={() => setSearchTerm('')} className="text-blue-600 font-bold hover:underline">Clear Search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenders.map((tender) => (
              <div 
                key={tender.id} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      tender.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {tender.status || 'Active'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
                    {tender.title}
                  </h3>
                  
                  <p className="text-slate-400 text-xs mb-6">
                    ID: {tender.tender_number || `TNDR-${tender.id.toString().padStart(4, '0')}`}
                  </p>
                  
                  <div className="flex items-center gap-4 text-slate-500 text-sm mb-6 border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{new Date(tender.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/bidder/apply/${tender.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all"
                  >
                    Apply Now
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BidderLayout>
  );
};

export default TenderList;
