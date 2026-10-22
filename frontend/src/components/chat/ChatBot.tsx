import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import axios from 'axios';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:8000/chat/', { message: userMsg,session_id: "hackathon-demo-user" });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the AI core. Check your API key." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-nidaan-accent text-nidaan-bg rounded-full shadow-lg flex items-center justify-center z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-nidaan-card border border-nidaan-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-nidaan-border bg-white/5 flex items-center gap-2">
              <Bot className="w-5 h-5 text-nidaan-accent" />
              <span className="font-semibold text-sm">NIDAAN-X AI Assistant</span>
              <span className="ml-auto text-xs text-green-400">● Grok Online</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <p className="text-gray-500 text-sm text-center mt-10">Ask me to analyze a specimen, explain an anomaly, or generate a summary report.</p>
              )}
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-nidaan-accent text-nidaan-bg' : 'bg-white/10 text-gray-200'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && <div className="text-gray-500 text-xs flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Thinking...</div>}
              <div ref={scrollRef} />
            </div>

            <div className="p-3 border-t border-nidaan-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about S-2026-1047..."
                className="flex-1 bg-nidaan-bg border border-nidaan-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-nidaan-accent"
              />
              <button onClick={handleSend} className="p-2 bg-nidaan-accent text-nidaan-bg rounded-lg"><Send className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}