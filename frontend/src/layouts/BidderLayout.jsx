import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  Send, 
  FileCheck, 
  MessageSquare, 
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const BidderSidebar = ({ isOpen, toggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { name: 'Dashboard', path: '/bidder/dashboard', icon: Home },
    { name: 'Browse Tenders', path: '/bidder/tenders', icon: Briefcase },
    { name: 'My Applications', path: '/bidder/applications', icon: Send },
    { name: 'Verification', path: '/bidder/status', icon: FileCheck },
    { name: 'Clarifications', path: '/bidder/messages', icon: MessageSquare },
  ];

  const handleLogout = () => {
    localStorage.removeItem('bidderUser');
    navigate('/');
  };

  return (
    <div className={`w-72 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-50 p-6 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-between mb-10 px-2">
        <Link to="/bidder/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2 group-hover:bg-blue-100 transition-all">
            <img 
              src="/shakti_icon.png" 
              alt="Shakti AI" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-slate-900 leading-none">SHAKTI AI</h1>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Bidder Hub</span>
          </div>
        </Link>
        <button onClick={toggle} className="lg:hidden text-slate-400">
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Application Hub</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 transition-colors'} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-100 space-y-2">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm">
          <Settings size={20} />
          <span>Profile Settings</span>
        </button>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 mt-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-1">
            <ShieldCheck size={12} />
            Verified Profile
          </div>
          <p className="text-[9px] text-blue-500 font-medium leading-tight">Your company profile is 85% complete. Add GST details.</p>
        </div>
      </div>
    </div>
  );
};

const Header = ({ toggle }) => {
  const [user, setUser] = useState({ username: 'Bharat Electronics', city: 'Defense Sector', email: 'contact@bel-india.com' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('bidderUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    // Fetch real tenders to create dynamic notifications
    const fetchLatestAlerts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/tenders');
        const tenders = await response.json();
        
        // Transform all tenders into notifications
        const dynamicNotifications = tenders.map(t => ({
          id: `tender-${t.id}`,
          type: 'tender',
          title: 'New Tender Uploaded',
          desc: `${t.title} is now available for bidding.`,
          time: 'Recently',
          icon: Briefcase,
          color: 'blue'
        }));

        // Add some mock ones for diversity (simulating other events)
        dynamicNotifications.push(
          { id: 'mock-1', type: 'approval', title: 'Application Approved', desc: 'Your technical bid for "Coastal Security" has passed.', time: '5h ago', icon: CheckCircle2, color: 'emerald' },
          { id: 'mock-2', type: 'rejection', title: 'Action Required', desc: 'Please resubmit your GST certificate.', time: '1d ago', icon: AlertTriangle, color: 'amber' }
        );

        setNotifications(dynamicNotifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchLatestAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLatestAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-24 bg-white/70 backdrop-blur-md border-b border-slate-100 fixed top-0 right-0 left-0 lg:left-72 z-40 px-6 lg:px-10 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-600">
            <Menu size={24} />
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all shadow-sm active:scale-90 flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            Bidder Intelligence
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Applications</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-4 pr-6 border-r border-slate-100">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization</p>
            <p className="text-sm font-black text-slate-900 tracking-tighter uppercase">{user.username}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative">
          {/* Notifications Toggle */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className={`p-2.5 rounded-xl transition-all ${showNotifications ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              <Bell size={20} />
            </button>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-14 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Recent Alerts</h3>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{notifications.length} Total</span>
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.map((n) => {
                      const Icon = n.icon || Bell;
                      return (
                        <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-${n.color}-50 text-${n.color}-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                              <Icon size={18} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-black text-slate-900 leading-none">{n.title}</p>
                              <p className="text-[11px] text-slate-500 leading-tight line-clamp-2 font-medium">{n.desc}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <button className="w-full py-4 text-center text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-colors border-t border-slate-50">
                    View All Notifications
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Toggle */}
          <div className="relative">
            <button 
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border-2 transition-all overflow-hidden flex items-center justify-center ${showProfile ? 'border-blue-600 shadow-lg scale-105' : 'border-white bg-blue-50 text-blue-600 shadow-sm hover:border-blue-200'}`}
            >
              <User size={24} />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-14 right-0 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-6 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
                    <button 
                      onClick={() => setShowProfile(false)}
                      className="absolute top-4 left-4 p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors z-10"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute top-4 right-4 text-white/20"><ShieldCheck size={40} /></div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/30">
                      <User size={32} className="text-white" />
                    </div>
                    <h3 className="font-black text-lg leading-tight mb-1">{user.username}</h3>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-[0.2em]">Verified Organization</p>
                  </div>
                  
                  <div className="p-4 space-y-1">
                    <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                        <MessageSquare size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email Support</p>
                        <p className="text-xs font-bold text-slate-700">{user.email || 'contact@bel.gov.in'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                        <Home size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">HQ Location</p>
                        <p className="text-xs font-bold text-slate-700">{user.city || 'Bengaluru, India'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 border-t border-slate-50 bg-slate-50/50">
                    <button 
                      onClick={() => navigate('/bidder/profile')}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-slate-600 text-[11px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-600 hover:text-white transition-all group"
                    >
                      <Settings size={14} className="group-hover:rotate-90 transition-transform" />
                      Manage Account
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

const BidderLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BidderSidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(false)} />
      <div className="lg:pl-72 transition-all duration-300">
        <Header toggle={() => setSidebarOpen(true)} />
        <main className="pt-32 pb-12 px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default BidderLayout;
