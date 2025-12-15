import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useCasino } from '../context/CasinoContext';
import { getCasinoHostResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

const PitBoss: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou o Pit Boss. Precisa de ajuda ou dicas?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useCasino();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // If not logged in, do not render
  if (!user.isLoggedIn) return null;

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await getCasinoHostResponse(input, user.balance);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Bot className="text-yellow-500" size={20} />
              <span className="font-bold text-sm">Pit Boss AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="h-64 overflow-y-auto p-3 flex flex-col gap-3 bg-slate-800/90">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] text-sm p-2 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white self-end rounded-br-none' 
                    : 'bg-slate-700 text-gray-100 self-start rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="self-start text-xs text-gray-400 animate-pulse">Digitando...</div>
            )}
          </div>

          {/* Input */}
          <div className="p-2 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Fale com o Boss..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm focus:outline-none focus:border-yellow-500 text-white"
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-500 text-white p-1.5 rounded disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center font-bold"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default PitBoss;