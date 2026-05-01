import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Zap, CheckCircle, BarChart3, Users, Lock } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-blue rounded flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold text-slate-800">SHAKTI AI</span>
        </div>
        <div className="hidden md:flex gap-8 text-slate-600 font-medium">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
          <a href="#security" className="hover:text-blue-600 transition-colors">Security</a>
        </div>
        <div className="flex gap-4">
          <Link to="/bidder/login" className="btn-secondary py-2">Bidder Login</Link>
          <Link to="/admin/dashboard" className="btn-primary py-2">Admin Portal</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 inline-block"
          >
            Revolutionizing Government Procurement
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight"
          >
            AI-Powered <span className="text-blue-600">Tender Evaluation</span> for CRPF
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-3xl mx-auto mb-10"
          >
            Automated eligibility analysis, OCR-driven document verification, and fraud detection. 
            Ensure transparency, speed, and accuracy in every procurement cycle.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/admin/dashboard" className="btn-primary text-lg">Get Started as Admin</Link>
            <Link to="/bidder/apply" className="btn-secondary text-lg">Apply for Tenders</Link>
          </motion.div>
        </div>

        {/* Hero Image / Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-20 max-w-6xl mx-auto relative"
        >
          <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-[3rem] -z-10"></div>
          <div className="glass-card overflow-hidden border-slate-200 shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" 
              alt="Dashboard Preview" 
              className="w-full h-auto opacity-90"
            />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-slate-500">Built for the specific needs of government procurement and CRPF standards.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Instant OCR", desc: "Extract data from scanned PDFs, handwritten certificates, and images instantly." },
              { icon: Shield, title: "AI Evaluation", desc: "Automated PASS/FAIL decisions based on complex eligibility criteria." },
              { icon: BarChart3, title: "Fraud Detection", desc: "Detect collusion, duplicate bidders, and suspicious patterns using network analysis." },
              { icon: CheckCircle, title: "Explainability", desc: "Clear reasoning for every AI decision with source document evidence." },
              { icon: Users, title: "Multi-Panel", desc: "Separate workspaces for government officials and industrial bidders." },
              { icon: Lock, title: "Audit Trail", desc: "Complete timestamped logs of every action for full accountability." }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 gradient-blue rounded-xl flex items-center justify-center text-white mb-6">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-blue rounded flex items-center justify-center text-white font-bold">S</div>
            <span className="text-xl font-bold text-slate-800">SHAKTI AI</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 SHAKTI AI. Secure Government Procurement Platform.</p>
          <div className="flex gap-6 text-slate-400 text-sm">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
            <a href="#" className="hover:text-blue-600">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
