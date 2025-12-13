
import React from 'react';
import { Mail, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 animate-fade-in">
      <div className="container mx-auto px-4 max-w-5xl">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">İletişim</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Sorularınız, önerileriniz veya iş ortaklığı talepleriniz için bizimle iletişime geçin.
          </p>
        </div>

        <div className="flex justify-center mb-12">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm text-center hover:-translate-y-1 transition-transform w-full max-w-md">
                <div className="w-12 h-12 bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={24} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">E-Posta</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">7/24 Bize yazabilirsiniz</p>
                <a href="mailto:info@hangikatilim.com" className="text-lg font-bold text-gold-700 dark:text-gold-300 hover:underline">info@hangikatilim.com</a>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-850 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-lg max-w-3xl mx-auto">
            <div className="p-8 md:p-12 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Bize Mesaj Gönderin</h3>
                <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ad Soyad</label>
                            <input type="text" className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white" placeholder="Adınız" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">E-Posta</label>
                            <input type="email" className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white" placeholder="ornek@email.com" />
                         </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Konu</label>
                        <input type="text" className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white" placeholder="Mesajınızın konusu" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Mesajınız</label>
                        <textarea rows={4} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white" placeholder="Nasıl yardımcı olabiliriz?"></textarea>
                    </div>
                    <button className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary-700/20 transition-all flex items-center justify-center gap-2">
                        <Send size={18} />
                        Mesajı Gönder
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
