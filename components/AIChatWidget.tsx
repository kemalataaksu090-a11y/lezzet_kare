
import React, { useState, useRef, useEffect } from 'react';
import { getAIResponse, getProactiveTip } from '../services/geminiService';
import { CartItem, Order, MenuItem } from '../types';

interface AIChatWidgetProps {
  cart: CartItem[];
  tableId: string;
  history: Order[];
  menu: MenuItem[];
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ cart, tableId, history, menu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Merhaba! Ben LezzetKare asistanınız. Size bugün ne önerebilirim? 👨‍🍳' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proactiveTip, setProactiveTip] = useState<string | null>(null);
  const [hasNewTip, setHasNewTip] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastCartSize = useRef(cart.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
        setHasNewTip(false);
    }
  }, [messages, isOpen]);

  // Proaktif öneri mekanizması
  useEffect(() => {
    const triggerProactiveTip = async () => {
        // Yeni ürün eklendiğinde veya sepet değiştiğinde
        if (cart.length !== lastCartSize.current) {
            const tip = await getProactiveTip(cart, history, menu);
            if (tip) {
                setProactiveTip(tip);
                setHasNewTip(true);
                if (isOpen) {
                    setMessages(prev => [...prev, { role: 'model', text: tip }]);
                }
            }
        }
        lastCartSize.current = cart.length;
    };

    const timer = setTimeout(triggerProactiveTip, 1500);
    return () => clearTimeout(timer);
  }, [cart, history, menu, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    const responseText = await getAIResponse(userText, { cart, history, menu });

    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end">
      {/* Proaktif Öneri Balonu */}
      {proactiveTip && !isOpen && (
        <div 
          className="bg-white border-2 border-orange-500 shadow-2xl rounded-3xl p-4 mb-4 max-w-[220px] relative animate-bounce-soft cursor-pointer group hover:scale-105 transition-all" 
          onClick={() => setIsOpen(true)}
        >
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-b-2 border-r-2 border-orange-500 rotate-45"></div>
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <span className="animate-pulse">✨</span> Şefin Önerisi
            </p>
            <p className="text-xs font-bold text-slate-800 leading-tight">{proactiveTip}</p>
        </div>
      )}

      {/* Sohbet Penceresi */}
      {isOpen && (
        <div className="bg-white border border-slate-100 shadow-2xl rounded-[2.5rem] w-[90vw] max-w-[350px] h-[500px] mb-4 flex flex-col overflow-hidden animate-slide-in-right">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-orange-600/20">🤖</div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Lezzet Asistanı</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Canlı Destek</span>
                    </div>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-3xl text-xs font-bold leading-relaxed shadow-sm transition-all animate-message-in ${
                  msg.role === 'user'
                    ? 'bg-orange-600 text-white ml-auto rounded-tr-none'
                    : 'bg-white border border-slate-100 text-slate-800 mr-auto rounded-tl-none'
                } max-w-[85%]`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
                <div className="flex gap-1.5 ml-2 p-3 bg-white border border-slate-100 rounded-2xl w-fit">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-duration:0.6s]"></div>
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]"></div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-300"
              placeholder="Örn: Kebap yanına ne gider?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-orange-600 text-white p-3.5 rounded-2xl hover:bg-orange-700 disabled:opacity-30 transition-all shadow-lg shadow-orange-600/20 active:scale-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Ana Buton */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 font-black border-2 ${isOpen ? 'border-slate-800' : 'border-white/5'}`}
      >
        {hasNewTip && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-slate-900"></span>
            </span>
        )}
        
        {isOpen ? (
          <span className="text-xl">✕</span>
        ) : (
          <>
            <div className="bg-orange-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-orange-600/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] pr-2">Asistana Sor</span>
          </>
        )}
      </button>

      <style>{`
        @keyframes bounceSoft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-bounce-soft { animation: bounceSoft 3s ease-in-out infinite; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px) scale(0.9); } to { opacity: 1; transform: translateX(0) scale(1); } }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes messageIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-message-in { animation: messageIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AIChatWidget;
