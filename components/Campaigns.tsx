
import React from 'react';
import { Star, Zap, TrendingUp, ArrowRight, Clock, BadgePercent } from 'lucide-react';

export const Campaigns: React.FC = () => {
  return (
    <section id="campaigns" className="py-12 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 dark:bg-gold-900/20 text-gold-600 dark:text-gold-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Star size={14} className="fill-gold-500 text-gold-500" />
              Sınırlı Süreli Fırsatlar
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Evim Sistemleri Kampanyaları</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl text-sm">
              Size en uygun tasarruf modelini seçin, avantajlı kampanyalarla hayalinizdeki eve daha hızlı ulaşın.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Campaign Card 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary-50 to-white dark:from-slate-800 dark:to-slate-900">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-2xl group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors"></div>
            
            <div className="p-6 md:p-8 relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 bg-primary-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 shadow-sm">
                <BadgePercent size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                Çalışan & Emekli Paketi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                Kamu ve özel sektör çalışanları ile emeklilere özel <strong className="text-primary-700 dark:text-primary-300">indirimli organizasyon ücreti</strong> avantajı.
              </p>
              
              <a href="#calculator" className="inline-flex items-center text-sm font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                Hemen Hesapla <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </div>

          {/* Campaign Card 2 (Featured) */}
          <div className="group relative overflow-hidden rounded-2xl border border-gold-100 dark:border-gold-900/30 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gold-50 to-white dark:from-slate-800 dark:to-slate-900 transform md:-translate-y-2">
            <div className="absolute top-0 right-0 bg-gold-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              POPÜLER
            </div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-gold-100 dark:bg-gold-900/20 rounded-full blur-3xl group-hover:bg-gold-200 dark:group-hover:bg-gold-800/40 transition-colors"></div>

            <div className="p-6 md:p-8 relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 bg-gold-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gold-600 dark:text-gold-400 mb-6 shadow-sm">
                <Zap size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                5. Ayda Kesin Teslim
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                Peşinatlı sistemlerde beklemek yok. %40 peşinat ile <strong className="text-gold-600 dark:text-gold-400">5. ayda teslimat garantisi</strong> veriyoruz.
              </p>
              
              <a href="#calculator" className="inline-flex items-center text-sm font-bold text-gold-600 dark:text-gold-400 group-hover:translate-x-1 transition-transform">
                Detayları Gör <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </div>

          {/* Campaign Card 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-2xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors"></div>
            
            <div className="p-6 md:p-8 relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 bg-blue-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shadow-sm">
                <TrendingUp size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Peşinatsız Araç Sistemi
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                Hiç peşinat ödemeden sadece <strong className="text-blue-600 dark:text-blue-400">aylık taksitlerle</strong> arabanızı yenileyin. Kura ile erken teslim fırsatı.
              </p>
              
              <a href="#calculator" className="inline-flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                Plan Oluştur <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </div>

        </div>
        
        <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          <Clock size={14} />
          <span>Kampanya koşulları, seçilen vadeye ve tutara göre değişiklik gösterebilir. Son güncelleme: Mart 2024</span>
        </div>

      </div>
    </section>
  );
};
