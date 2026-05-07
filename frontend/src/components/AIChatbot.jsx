import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles, ShieldCheck, Database, BrainCircuit } from 'lucide-react';
import { apiService } from '../services/api';

const AIChatbot = ({ role = "admin" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [aiMsg, setAiMsg] = useState('');
  const [aiChat, setAiChat] = useState([
    { sender: 'ai', text: `Hello! I am SHAKTI AI, your procurement intelligence assistant. How can I help you today with ${role === 'admin' ? 'tender analysis or bidder evaluations' : 'your application status and compliance requirements'}?` }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiChat]);

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiMsg.trim() || aiLoading) return;

    const q = aiMsg;
    setAiChat(p => [...p, { sender: 'user', text: q }]);
    setAiMsg('');
    setAiLoading(true);

    try {
      const res = await apiService.askAi(q, role);
      // The backend now returns a structured object: { answer, confidence, source, context_used }
      setAiChat(p => [...p, { 
        sender: 'ai', 
        text: res.data.answer,
        confidence: res.data.confidence,
        source: res.data.source,
        context_used: res.data.context_used
      }]);
    } catch (err) {
      console.error("AI Error:", err);
      setAiChat(p => [...p, { 
        sender: 'ai', 
        text: 'Connection to the SHAKTI Intelligence Core was interrupted. Please try again.',
        isError: true
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-[100] border-4 border-white ${
          role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
        } text-white shadow-indigo-500/20`}
      >
        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity rounded-full" />
        {isOpen ? <BrainCircuit size={28} /> : <MessageSquare size={28} />}
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"
        />
      </motion.button>

      {/* AI Assistant Slide-over Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: 400, opacity: 0 }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-96 h-screen bg-white shadow-[-20px_0_50px_-15px_rgba(0,0,0,0.1)] z-[110] flex flex-col border-l border-slate-100"
          >
            {/* Header */}
            <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${
                role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
            } text-white`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 text-white rounded-xl backdrop-blur-md">
                    <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-black tracking-tight">SHAKTI Intelligence</h3>
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck size={10} /> {role.toUpperCase()} CORE ACTIVE
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 custom-scrollbar">
              {aiChat.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user' 
                      ? `${role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'} text-white rounded-br-sm` 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
                    } ${msg.isError ? 'border-red-100 bg-red-50 text-red-600' : ''}`}>
                      {msg.text}
                      
                      {/* AI Metadata Tags */}
                      {msg.sender === 'ai' && msg.confidence && (
                        <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                           <span className="text-[9px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">
                             Conf: {Math.round(msg.confidence * 100)}%
                           </span>
                           <span className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                             Source: {msg.source}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-sm flex gap-2 shadow-sm items-center">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Analyzing System Data</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleAskAI} className="relative flex items-center">
                <input
                  type="text"
                  value={aiMsg}
                  onChange={(e) => setAiMsg(e.target.value)}
                  placeholder="Ask about tenders, scores, or compliance..."
                  className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!aiMsg.trim() || aiLoading}
                  className={`absolute right-2 p-2.5 rounded-xl transition-all shadow-md ${
                    !aiMsg.trim() || aiLoading 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : `${role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'} text-white hover:scale-105 active:scale-95`
                  }`}
                >
                  {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
              <div className="mt-3 flex justify-center gap-4">
                 <div className="flex items-center gap-1 opacity-50">
                    <Database size={10} className="text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Connected to System DB</span>
                 </div>
                 <div className="flex items-center gap-1 opacity-50">
                    <BrainCircuit size={10} className="text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Gemini 1.5 Flash</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
