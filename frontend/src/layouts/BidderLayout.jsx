import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  Send, 
  FileCheck, 
  MessageSquare, 
  Settings,
  LogOut,
  User
} from 'lucide-react';

const BidderSidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Home', path: '/bidder/dashboard', icon: Home },
    { name: 'Available Tenders', path: '/bidder/tenders', icon: Briefcase },
    { name: 'My Applications', path: '/bidder/applications', icon: Send },
    { name: 'Verification Status', path: '/bidder/status', icon: FileCheck },
    { name: 'Clarifications', path: '/bidder/messages', icon: MessageSquare },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 fixed left-0 top-0 z-10 p-4 flex flex-col text-slate-300">
      <div className="flex items-center gap-3 px-2 py-6 mb-8">
        <div className="w-10 h-10 gradient-blue rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
        <h1 className="text-xl font-bold tracking-tight text-white">SHAKTI AI</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                ? 'bg-blue-600 text-white font-semibold' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
          <Settings size={20} />
          <span>Profile Settings</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const BidderLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <BidderSidebar />
      <div className="pl-64">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
           <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Bidder Portal</h2>
           <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Bharat Electronics Ltd</span>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
           </div>
        </header>
        <main className="p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
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
