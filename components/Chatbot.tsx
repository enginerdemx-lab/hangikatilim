
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { MessageCircle, X, Send, Sparkles, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Merhaba! Ben Hangi Katılım asistanıyım. Size ödeme planları, tasarruf modelleri veya sistemin işleyişi hakkında nasıl yardımcı olabilirim?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    if (!chatSessionRef.current && process.env.API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatSessionRef.current = ai.chats.create({
          model: 'gemini-3-pro-preview',
          config: {
            systemInstruction: `Sen "Hangi Katılım" web sitesi için çalışan yardımsever, profesyonel ve bilgili bir yapay zeka asistanısın. 
            
            Görevlerin:
            1. Kullanıcılara Tasarruf Finansman (Evim) sistemleri hakkında bilgi vermek (Çekilişli sistem, Peşinatlı sistem vb.).
            2. Faizsiz finansman mantığını açıklamak.
            3. Kullanıcıların ödeme gücüne göre genel tavsiyeler vermek (Yatırım tavsiyesi değildir uyarısı ile).
            4. Türkçe dilinde, nazik ve kurumsal bir dille yanıt vermek.
            5. Sitedeki hesaplama aracı ile ilgili sorular gelirse onları hesaplama bölümüne yönlendirmek.
            
            Kısa, net ve okunabilir cevaplar ver. Kullanıcıyı sıkmadan bilgilendir.`,
          },
        });
      } catch (error) {
        console.error("Chat başlatılamadı:", error);
      }
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (chatSessionRef.current) {
        const result = await chatSessionRef.current.sendMessage({ message: userMessage.text });
        const responseText = result.text;

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText || "Üzgünüm, şu an yanıt veremiyorum."
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Fallback if API key is missing or init failed
        setTimeout(() => {
           setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "Asistan bağlantısı şu anda kurulamadı. Lütfen daha sonra tekrar deneyin."
           }]);
           setIsLoading(false);
        }, 1000);
        return;
      }
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Bir hata oluştu. Lütfen tekrar deneyiniz."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4 font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 w-[350px] h-[500px] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-left transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4DC9E6] to-[#210CAE] p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Asistan</h3>
                <p className="text-[10px] text-primary-50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Çevrimiçi
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-950 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                    : 'bg-[#4DC9E6]/20 dark:bg-[#4DC9E6]/10 text-[#210CAE] dark:text-[#4DC9E6]'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                </div>
                
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#210CAE] text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-slate-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-2.5">
                 <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} />
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-700">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Sorunuzu buraya yazın..."
                className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 border border-transparent text-sm"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-[#210CAE] hover:bg-[#1a098e] disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors shadow-md"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              Gemini AI tarafından desteklenmektedir.
            </p>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 h-14 px-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-[linear-gradient(90deg,#4DC9E6,#210CAE)] hover:opacity-90 text-white'
        }`}
      >
        {isOpen ? (
          <>
            <X size={24} />
            <span className="font-bold text-sm pr-2">Kapat</span>
          </>
        ) : (
          <>
            <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-sm pr-2">Asistana Sor</span>
          </>
        )}
      </button>
    </div>
  );
};
