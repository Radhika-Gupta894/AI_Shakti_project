import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Lock, 
  FileText, 
  Search, 
  Cpu, 
  Database, 
  History, 
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Globe,
  Settings,
  ShieldAlert,
  FileSearch,
  MessageSquare,
  Award
} from 'lucide-react';

const LandingPage = () => {
  const [loginType, setLoginType] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', city: '' });
  const navigate = useNavigate();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginType === 'admin') {
      localStorage.setItem('adminUser', JSON.stringify(formData));
      navigate('/admin/dashboard');
    } else {
      localStorage.setItem('bidderUser', JSON.stringify(formData));
      navigate('/bidder/dashboard');
    }
  };

  const steps = [
    { icon: FileText, title: "Upload Documents", desc: "PDFs, Scans, & Images" },
    { icon: Cpu, title: "AI Processing", desc: "OCR & Text Extraction" },
    { icon: FileSearch, title: "Criteria Extraction", desc: "Eligibility Analysis" },
    { icon: ShieldAlert, title: "Bidder Evaluation", desc: "Risk & Compliance Check" },
    { icon: MessageSquare, title: "Explainable Results", desc: "AI-Generated Reasoning" },
    { icon: Users, title: "Human in the Loop", desc: "Final Officer Approval" }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-600/20">
      
      {/* --- PREMIUM NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 group-hover:scale-105 transition-transform duration-300">
            <img 
              src="/shakti_full_logo.png" 
              alt="SHAKTI AI Logo" 
              className="h-full w-auto object-contain"
            />
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-10">
          {['Challenge', 'Workflow', 'Technology', 'Impact'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-all uppercase tracking-widest">{item}</a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setLoginType('bidder')} className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 py-2 transition-all">Bidder Portal</button>
          <button onClick={() => setLoginType('admin')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2">
            Admin Login
            <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            <Shield size={14} className="animate-pulse" />
            Official CRPF Tender Intel Platform
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]"
          >
            AI-Powered <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Tender Analysis</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
          >
            The enterprise-grade platform for automated eligibility evaluation, 
            intelligent document OCR, and fraud detection. Ensuring <span className="text-slate-900 font-bold">Transparency. Intelligence. Trust.</span>
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={() => setLoginType('admin')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all">Start Evaluation</button>
            <button onClick={() => setLoginType('bidder')} className="px-8 py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl font-black text-lg shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              Apply for Tenders
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* LOGIN MODAL OVERLAY */}
        <AnimatePresence>
          {loginType && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[32px] p-10 w-full max-w-md shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-slate-900">{loginType === 'admin' ? 'Admin Portal' : 'Bidder Portal'}</h2>
                  <p className="text-slate-500 font-medium">Enter your credentials to continue</p>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <input 
                    type="text" name="username" placeholder="Username" 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    onChange={handleInputChange} required 
                  />
                  <input 
                    type="email" name="email" placeholder="Email Address" 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    onChange={handleInputChange} required 
                  />
                  {loginType === 'admin' && (
                    <input 
                      type="password" name="password" placeholder="Access Code" 
                      className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                      onChange={handleInputChange} required 
                    />
                  )}
                  <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all mt-4">Login Now</button>
                  <button type="button" onClick={() => setLoginType(null)} className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors py-2">Go Back</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* --- THE CHALLENGE SECTION --- */}
      <section id="challenge" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-black text-xs uppercase tracking-widest mb-4 block">The Problem Statement</span>
              <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tighter">Procurement is broken. <br /> We fixed it.</h2>
              <div className="space-y-4">
                {[
                  { icon: FileText, title: "Complex Documents", text: "Multi-thousand page tenders take weeks to analyze." },
                  { icon: Globe, title: "Format Fragmentation", text: "Scans, images, and various PDF standards cause chaos." },
                  { icon: History, title: "Evaluation Delays", text: "Manual review leads to month-long processing times." },
                  { icon: ShieldAlert, title: "Compliance Risk", text: "High chance of human error in mandatory checks." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                      <item.icon size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{item.title}</h4>
                      <p className="text-sm text-slate-500">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 rounded-[48px] p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />
              <div className="relative z-10">
                <AlertTriangle className="text-amber-400 mb-6" size={48} />
                <h3 className="text-3xl font-black mb-6">Traditional methods are 80% slower.</h3>
                <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
                  Manual evaluation is vulnerable to lack of transparency, collusion, and extreme inefficiency. SHAKTI AI brings intelligence to the process.
                </p>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold">Manual Review Error Rate</span>
                    <span className="text-2xl font-black text-red-400">18%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '70%' }} className="h-full bg-red-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW SHAKTI AI WORKS (WORKFLOW) --- */}
      <section id="workflow" className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tighter">The Intelligent Workflow</h2>
            <p className="text-slate-500 font-medium">6 steps to total procurement transparency.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative">
            <div className="hidden lg:block absolute top-10 left-0 w-full h-px bg-slate-200 -z-10" />
            {steps.map((step, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 bg-white border-4 border-[#F8FAFC] ring-1 ring-slate-200 rounded-3xl flex items-center justify-center text-blue-600 mb-6 shadow-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <step.icon size={32} />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{step.desc}</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={16} className="text-blue-500 animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- IMPACT METRICS --- */}
      <section id="impact" className="py-24 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,_#3b82f6_0%,_transparent_70%)] blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="text-5xl font-black mb-20 tracking-tighter">Engineered for Massive Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { val: "80%", label: "Faster Evaluation", sub: "Weeks to Minutes" },
              { val: "95%+", label: "OCR Accuracy", sub: "Multilingual Support" },
              { val: "100%", label: "Audit Compliance", sub: "Blockchain Ready" },
              { val: "15x", label: "Scale Efficiency", sub: "More Tenders Processed" }
            ].map((m, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-2">{m.val}</span>
                <span className="text-xl font-bold mb-1 tracking-tight">{m.label}</span>
                <span className="text-blue-400 text-xs font-black uppercase tracking-widest">{m.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TECHNOLOGY STACK --- */}
      <section id="technology" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-4 text-center lg:text-left">
            <div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">The Modern Stack</h2>
              <p className="text-slate-500 font-medium">Enterprise security meets bleeding-edge AI.</p>
            </div>
            <div className="flex gap-2">
              {[FileText, Globe, Search].map((Icon, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 text-slate-400"><Icon size={20} /></div>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "AI/NLP Models", icon: Cpu, desc: "Llama 3 & Gemini Pro based extraction." },
              { title: "OCR Engine", icon: Search, desc: "Intelligent layout analysis for scans." },
              { title: "Secure Cloud", icon: Lock, desc: "End-to-end encrypted procurement data." },
              { title: "Rule Engine", icon: Settings, desc: "Dynamic eligibility policy builder." }
            ].map((t, i) => (
              <div key={i} className="p-10 rounded-[32px] bg-[#F8FAFC] border border-slate-100 hover:shadow-2xl hover:shadow-blue-600/5 transition-all">
                <t.icon size={40} className="text-blue-600 mb-6" />
                <h3 className="text-xl font-black text-slate-800 mb-2">{t.title}</h3>
                <p className="text-slate-500 text-sm font-medium">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <a href="#" className="flex items-center gap-3 group mb-6">
                <div className="h-10">
                  <img 
                    src="/shakti_full_logo.png" 
                    alt="SHAKTI AI Logo" 
                    className="h-full w-auto object-contain brightness-0 invert group-hover:brightness-100 group-hover:invert-0 transition-all duration-500"
                  />
                </div>
              </a>
              <p className="text-slate-500 max-w-sm leading-relaxed font-medium">
                Empowering government procurement with artificial intelligence. 
                Ensuring security, integrity, and absolute transparency in every tender evaluation.
              </p>
            </div>
            <div>
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">Quick Links</h4>
              <div className="flex flex-col gap-4 text-sm font-bold text-slate-500">
                <a href="#" className="hover:text-blue-600 transition-colors">Admin Dashboard</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Bidder Portal</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              </div>
            </div>
            <div>
              <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">Support</h4>
              <div className="flex flex-col gap-4 text-sm font-bold text-slate-500">
                <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
                <a href="#" className="hover:text-blue-600 transition-colors">API Reference</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Technical Support</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-slate-100">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic">SHAKTI AI – Ensuring Security with Integrity.</span>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">System Status: Optimal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
