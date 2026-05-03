import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileUp, 
  UserCheck, 
  ShieldAlert, 
  FileSearch, 
  ClipboardList, 
  History,
  LogOut,
  Bell,
  Search,
  Settings,
  ChevronRight,
  ShieldCheck,
  Zap,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggle }) => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Tender Analysis', path: '/admin/upload', icon: FileUp },
    { name: 'Criteria Analysis', path: '/admin/criteria', icon: FileSearch },
    { name: 'Bidder Evaluation', path: '/admin/evaluations', icon: UserCheck },
    { name: 'Fraud Detection', path: '/admin/fraud', icon: ShieldAlert },
    { name: 'Reports & Audit', path: '/admin/audit', icon: History },
  ];

  return (
    <div className={`w-72 h-screen bg-slate-900 fixed left-0 top-0 z-50 p-6 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-between mb-10 px-2">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center p-2 shadow-inner group-hover:bg-blue-600/10 transition-all">
            <img 
              src="/shakti_icon.png" 
              alt="Shakti AI Icon" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-white leading-none uppercase">SHAKTI AI</h1>
            <span className="text-[8px] font-black text-blue-400 tracking-[0.2em] uppercase">Intelligence Portal</span>
          </div>
        </Link>
        <button onClick={toggle} className="lg:hidden text-slate-400">
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 space-y-1">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-4">Main Navigation</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 font-bold' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'} />
                <span className="text-sm">{item.name}</span>
              </div>
              {isActive && <motion.div layoutId="pill" className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5 space-y-2">
        <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-tight">AI Status</p>
              <p className="text-[9px] text-slate-500 font-bold">Llama 3 Operational</p>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-sm">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const Header = ({ toggle }) => {
  const [user, setUser] = useState({ username: 'Admin User', city: 'CRPF Officer' });
  const location = useLocation();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('adminUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === 'object') {
          setUser(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
    }
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'System Overview';
    if (path.includes('upload')) return 'Tender Processing';
    if (path.includes('criteria')) return 'Intelligence Analysis';
    if (path.includes('evaluations')) return 'Bidder Matrix';
    if (path.includes('fraud')) return 'Risk Monitor';
    return 'Intelligence Portal';
  };

  return (
    <header className="h-24 bg-white/70 backdrop-blur-md border-b border-slate-100 fixed top-0 right-0 left-0 lg:left-72 z-40 px-6 lg:px-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={toggle} className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-600">
          <Menu size={24} />
        </button>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            <ShieldCheck size={12} className="text-blue-600" />
            Command Center
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{getPageTitle()}</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-4 lg:gap-8">
        <div className="hidden md:flex items-center relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search Intelligence..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-xs focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none w-48 lg:w-64 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4 pl-4 lg:pl-8 border-l border-slate-100">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 cursor-pointer transition-all">
              <Bell size={20} />
            </div>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{user?.username || 'Admin'}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{user?.city || 'Officer'}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=1e293b&color=fff&bold=true`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(false)} />
      <div className="lg:pl-72 transition-all duration-300">
        <Header toggle={() => setSidebarOpen(true)} />
        <main className="pt-32 pb-12 px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
