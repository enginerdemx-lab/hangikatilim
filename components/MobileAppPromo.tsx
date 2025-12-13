
import React from 'react';
import { Apple, Play, Smartphone, Star, Shield, Zap, Home } from 'lucide-react';

export const MobileAppPromo: React.FC = () => {
  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#210CAE] rounded-full blur-[120px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4DC9E6] rounded-full blur-[120px] opacity-10 -translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
              <Smartphone size={14} className="text-[#4DC9E6]" />
              Hangi Katılım Cebinizde
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Tasarruf Planlarınız <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4DC9E6] to-white">Her An Yanınızda</span>
            </h2>
            
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Mobil uygulamamızı indirin, dilediğiniz yerden ödeme planı oluşturun, kampanyalardan anında haberdar olun ve uzmanlarımızla canlı görüşün.
            </p>

            {/* Feature List (Mobile friendly) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="bg-[#4DC9E6]/20 p-2 rounded-lg text-[#4DC9E6]"><Zap size={18} /></div>
                    <span className="text-sm text-gray-300 font-medium">Hızlı Hesaplama</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="bg-gold-500/20 p-2 rounded-lg text-gold-500"><Star size={18} /></div>
                    <span className="text-sm text-gray-300 font-medium">Özel Fırsatlar</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="bg-green-500/20 p-2 rounded-lg text-green-500"><Shield size={18} /></div>
                    <span className="text-sm text-gray-300 font-medium">Güvenli Takip</span>
                </div>
            </div>

            {/* Store Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="flex items-center gap-3 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl border border-gray-700 transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[#4DC9E6]/20 w-48 justify-center sm:justify-start">
                <Apple size={32} className="fill-current" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-medium text-gray-400">App Store'dan</div>
                  <div className="text-base font-bold leading-none mt-0.5">İndirin</div>
                </div>
              </button>

              <button className="flex items-center gap-3 bg-black hover:bg-gray-900 text-white px-5 py-3 rounded-xl border border-gray-700 transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[#4DC9E6]/20 w-48 justify-center sm:justify-start">
                 {/* Custom Play Store Shape or Icon */}
                <div className="relative w-8 h-8">
                    <Play size={32} className="fill-current text-white relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-green-500 to-yellow-500 opacity-0 blur-sm"></div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-medium text-gray-400">Google Play'den</div>
                  <div className="text-base font-bold leading-none mt-0.5">Edinin</div>
                </div>
              </button>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="flex-1 relative flex justify-center lg:justify-end mt-12 lg:mt-0">
             <div className="relative w-[280px] md:w-[320px] h-[580px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden z-20">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-30"></div>
                
                {/* Screen Content */}
                <div className="w-full h-full bg-white dark:bg-slate-900 overflow-hidden relative">
                    {/* Header in Phone */}
                    <div className="bg-[#210CAE] h-32 pt-10 px-6 flex flex-col justify-center">
                        <div className="text-white/80 text-xs">Merhaba,</div>
                        <div className="text-white font-bold text-xl">Ahmet Yılmaz</div>
                    </div>
                    
                    {/* App Content Simulation */}
                    <div className="p-4 space-y-4">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-slate-700">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500">Kayıtlı Planım</span>
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">Aktif</span>
                             </div>
                             <div className="text-lg font-bold text-gray-900 dark:text-gray-200">1.500.000 ₺</div>
                             <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                                 <div className="bg-[#4DC9E6] h-full w-1/3"></div>
                             </div>
                             <div className="text-[10px] text-gray-400 mt-1 text-right">%33 Tamamlandı</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex flex-col items-center justify-center gap-2 aspect-square">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><Zap size={20} /></div>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Hesapla</span>
                            </div>
                            <div className="bg-gold-50 dark:bg-gold-900/20 p-3 rounded-xl flex flex-col items-center justify-center gap-2 aspect-square">
                                <div className="bg-gold-100 text-gold-600 p-2 rounded-full"><Star size={20} /></div>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Kampanya</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Nav in Phone */}
                    <div className="absolute bottom-0 w-full bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 py-3 px-6 flex justify-between items-center">
                         <div className="text-[#210CAE]"><Home size={24} /></div>
                         <div className="text-gray-300"><Zap size={24} /></div>
                         <div className="text-gray-300"><Shield size={24} /></div>
                    </div>
                </div>
             </div>

             {/* Decorative Elements behind phone */}
             <div className="absolute top-20 -right-10 w-40 h-40 bg-gold-500 rounded-full blur-[60px] opacity-30 z-10"></div>
             <div className="absolute bottom-20 -left-10 w-40 h-40 bg-[#4DC9E6] rounded-full blur-[60px] opacity-30 z-10"></div>
          </div>

        </div>
      </div>
    </section>
  );
};
