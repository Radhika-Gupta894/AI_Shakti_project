import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ClipboardCheck, 
  ShieldAlert, 
  BarChart, 
  Settings,
  Bell,
  Search
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tender Analysis', href: '/tender-analysis', icon: FileText },
  { name: 'Bidder Evaluation', href: '/evaluation', icon: Users },
  { name: 'Manual Review', href: '/manual-review', icon: ClipboardCheck },
  { name: 'Explainable AI', href: '/explainable-ai', icon: Search },
  { name: 'Fraud Detection', href: '/fraud-detection', icon: ShieldAlert },
  { name: 'Reports', href: '/reports', icon: BarChart },
];

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f172a] text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">S</div>
            <span className="font-bold text-xl tracking-wide">SHAKTI AI</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white w-full transition-colors">
            <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tender, bidder, or document..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium border-2 border-white shadow-sm">
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
