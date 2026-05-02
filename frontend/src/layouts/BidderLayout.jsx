import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
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
  CreditCard
} from 'lucide-react';

const BidderSidebar = ({ isOpen, toggle }) => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', path: '/bidder/dashboard', icon: Home },
    { name: 'Browse Tenders', path: '/bidder/tenders', icon: Briefcase },
    { name: 'My Applications', path: '/bidder/applications', icon: Send },
    { name: 'Verification', path: '/bidder/status', icon: FileCheck },
    { name: 'Clarifications', path: '/bidder/messages', icon: MessageSquare },
  ];

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
      
      <nav className="flex-1 space-y-1.5">
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
  const [user, setUser] = useState({ username: 'Bharat Electronics', city: 'Defense Sector' });

  useEffect(() => {
    const storedUser = localStorage.getItem('bidderUser');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <header className="h-24 bg-white/70 backdrop-blur-md border-b border-slate-100 fixed top-0 right-0 left-0 lg:left-72 z-40 px-6 lg:px-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={toggle} className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-600">
          <Menu size={24} />
        </button>
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
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 cursor-pointer">
              <Bell size={20} />
            </div>
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
          </div>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-blue-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-blue-600">
            <User size={24} />
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
