import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileUp, 
  UserCheck, 
  ShieldAlert, 
  FileSearch, 
  ClipboardList, 
  History,
  LogOut,
  Bell
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Upload Tender', path: '/admin/upload', icon: FileUp },
    { name: 'Criteria Analysis', path: '/admin/criteria', icon: FileSearch },
    { name: 'Bidder Evaluation', path: '/admin/evaluations', icon: UserCheck },
    { name: 'Fraud Detection', path: '/admin/fraud', icon: ShieldAlert },
    { name: 'Audit Trail', path: '/admin/audit', icon: History },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-10 p-4 flex flex-col">
      <div className="flex items-center gap-3 px-2 py-6 mb-8">
        <div className="w-10 h-10 gradient-blue rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">SHAKTI AI</h1>
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
                ? 'bg-blue-50 text-blue-600 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const Header = () => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 right-0 left-64 z-10 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 text-slate-400">
        <span className="text-sm font-medium">Pages</span>
        <span className="text-xs">/</span>
        <span className="text-sm font-medium text-slate-800">Dashboard</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative">
          <Bell className="text-slate-400 cursor-pointer hover:text-slate-600" size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">Admin User</p>
            <p className="text-xs text-slate-400">CRPF Officer</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=1e3a8a&color=fff" alt="Avatar" />
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64 pt-20">
        <Header />
        <main className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
