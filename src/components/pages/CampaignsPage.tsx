
import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronRight, Calculator, Star, Zap, Building2, Filter, Home, Car, Calendar, Wallet, BadgeCheck, Shuffle, Lock } from 'lucide-react';
import { AssetType, SystemType } from '../../types';
import { campaignsApi } from '../../services/api/campaigns';
import type { Campaign } from '../../types/database';

interface CampaignsPageProps {
   onNavigate: (page: string) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate }) => {
   const [amount, setAmount] = useState(1000000);
   const [months, setMonths] = useState(24);
   const [assetType, setAssetType] = useState<AssetType>(AssetType.HOME);
   const [campaigns, setCampaigns] = useState<Campaign[]>([]);
   const [loading, setLoading] = useState(true);

   // Popular Search Tabs State
   const [popularTab, setPopularTab] = useState<'HOME' | 'CAR'>('HOME');

   // Fetch campaigns from API
   useEffect(() => {
      const loadCampaigns = async () => {
         try {
            setLoading(true);
            const data = await campaignsApi.getActiveCampaigns();
            setCampaigns(data);
         } catch (error) {
            console.error('Error loading campaigns:', error);
         } finally {
            setLoading(false);
         }
      };
      loadCampaigns();
   }, []);

   // Detailed Popular Plans Data
   const popularHomePlans = [
      {
         id: 'h1',
         title: 'Uzun Vadeli Ev Planı',
         amount: 1500000,
         months: 120,
         systemType: SystemType.LOTTERY,
         estInstallment: 13750, // Approx (Amount + ~10% Fee) / Months
         totalPayment: 1650000, // Amount + Fee
         badge: 'Çekilişli'
      },
      {
         id: 'h2',
         title: 'Peşinatlı Hızlı Teslim',
         amount: 2500000,
         months: 60,
         systemType: SystemType.NON_LOTTERY,
         estInstallment: 45800,
         totalPayment: 2750000,
         badge: 'Çekilişsiz'
      },
      {
         id: 'h3',
         title: 'Standart Tasarruf',
         amount: 1000000,
         months: 80,
         systemType: SystemType.LOTTERY,
         estInstallment: 13750,
         totalPayment: 1100000,
         badge: 'Çekilişli'
      }
   ];

   const popularCarPlans = [
      {
         id: 'c1',
         title: 'Peşinatsız Araç',
         amount: 800000,
         months: 48,
         systemType: SystemType.LOTTERY,
         estInstallment: 18500,
         totalPayment: 888000,
         badge: 'Çekilişli'
      },
      {
         id: 'c2',
         title: 'Model Yükseltme',
         amount: 1200000,
         months: 36,
         systemType: SystemType.NON_LOTTERY,
         estInstallment: 36600,
         totalPayment: 1320000,
         badge: 'Çekilişsiz'
      },
      {
         id: 'c3',
         title: 'Ekonomik Plan',
         amount: 500000,
         months: 60,
         systemType: SystemType.LOTTERY,
         estInstallment: 9100,
         totalPayment: 550000,
         badge: 'Çekilişli'
      }
   ];

   const handleCalculate = () => {
      // Save to local storage for the Calculator component to pick up
      const prefillData = {
         amount,
         months,
         assetType,
         downPayment: 0
      };
      localStorage.setItem('CALC_PREFILL', JSON.stringify(prefillData));

      // Scroll to calculator on home page
      onNavigate('home');
      setTimeout(() => {
         const element = document.getElementById('calculator');
         if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
         }
      }, 100);
   };

   const handlePopularPlanClick = (plan: any) => {
      const prefillData = {
         amount: plan.amount,
         months: plan.months,
         assetType: popularTab === 'HOME' ? AssetType.HOME : AssetType.CAR,
         systemType: plan.systemType,
         downPayment: 0 // Default to 0 for popular searches
      };
      localStorage.setItem('CALC_PREFILL', JSON.stringify(prefillData));
      onNavigate('home');
      setTimeout(() => {
         const element = document.getElementById('calculator');
         if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
         }
      }, 100);
   };

   // Format currency
   const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR').format(val);

   return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 animate-fade-in pb-12">

         {/* HEADER SECTION - Calculator Style */}
         <div className="bg-gradient-to-r from-slate-800 to-[#1e3a8a] py-10 md:py-16 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            <div className="container mx-auto px-4 relative z-10">
               <div className="flex flex-col items-center justify-center text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                     Tasarruf Finansman Kampanyaları
                  </h1>
                  <p className="text-blue-200 text-sm md:text-base">
                     {formatMoney(amount)} TL {months} Ay Vadeli Konut ve Araç Finansmanı Fırsatları
                  </p>
               </div>

               {/* Calculator Bar */}
               <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-end border border-gray-200 dark:border-slate-700">

                  {/* Asset Type Tabs */}
                  <div className="w-full md:w-auto flex-shrink-0">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Finansman Türü</label>
                     <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg p-1">
                        <button
                           onClick={() => setAssetType(AssetType.HOME)}
                           className={`flex-1 px-4 py-2.5 rounded-md text-sm font-bold transition-all ${assetType === AssetType.HOME ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                           Konut
                        </button>
                        <button
                           onClick={() => setAssetType(AssetType.CAR)}
                           className={`flex-1 px-4 py-2.5 rounded-md text-sm font-bold transition-all ${assetType === AssetType.CAR ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                           Araç
                        </button>
                     </div>
                  </div>

                  {/* Amount Input */}
                  <div className="w-full flex-1">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">İhtiyaç Tutarı (TL)</label>
                     <div className="relative">
                        <input
                           type="text"
                           className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                           value={formatMoney(amount)}
                           onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                              setAmount(val);
                           }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">TL</span>
                     </div>
                  </div>

                  {/* Months Input */}
                  <div className="w-full md:w-48">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Vade (Ay)</label>
                     <div className="relative">
                        <select
                           className="w-full pl-3 pr-8 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none"
                           value={months}
                           onChange={(e) => setMonths(Number(e.target.value))}
                        >
                           {[12, 24, 36, 48, 60, 80, 100, 120].map(m => (
                              <option key={m} value={m}>{m} Ay</option>
                           ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" size={16} />
                     </div>
                  </div>

                  {/* Button */}
                  <div className="w-full md:w-auto">
                     <button
                        onClick={handleCalculate}
                        className="w-full md:w-auto bg-[#ff6f00] hover:bg-[#e65100] text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-orange-500/20 transition-all transform hover:scale-105 whitespace-nowrap"
                     >
                        Ödeme Planı Hesapla
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <div className="container mx-auto px-4 max-w-6xl mt-8 mb-6 relative z-20">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-200 dark:border-slate-700 animate-fade-in">
               <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
               </span>
               <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} güncel kampanyalar listeleniyor.
               </span>
            </div>
         </div>

         <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 gap-6">

               {/* CAMPAIGN LIST */}
               <div className="space-y-4">

                  {campaigns.map((camp) => {
                     // Map badge_type to badge display
                     const badgeMap = {
                        'faizsiz_firsat': { text: 'Faizsiz Fırsat', color: 'text-orange-600 border-orange-200 bg-orange-50' },
                        'ozel_kampanya': { text: 'Özel Kampanya', color: 'text-blue-600 border-blue-200 bg-blue-50' },
                        'sponsorlu': { text: 'Sponsorlu', color: 'text-purple-600 border-purple-200 bg-purple-50' }
                     };
                     const badge = camp.badge_type ? badgeMap[camp.badge_type] : { text: 'Kampanya', color: 'text-gray-600 border-gray-200 bg-gray-50' };

                     return (
                        <div key={camp.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                           {/* Card Header */}
                           <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${badge.color}`}>
                                 <Zap size={12} /> {badge.text}
                              </div>
                              <div className="text-xs text-gray-400">Son Güncelleme: Bugün</div>
                           </div>

                           <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
                              {/* Logo Section */}
                              <div className="w-full md:w-32 flex-shrink-0 flex flex-col items-center justify-center text-center">
                                 <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center mb-2 shadow-sm border border-gray-100 dark:border-slate-700 p-1">
                                    <img
                                       src={camp.company?.logo_url || 'https://via.placeholder.com/80x80?text=Logo'}
                                       alt={camp.company?.name || 'Company'}
                                       className="w-full h-full object-contain"
                                    />
                                 </div>
                                 <h3 className="font-bold text-xs text-gray-800 dark:text-gray-200">
                                    {camp.company?.name?.split(' ')[0] || 'Şirket'}
                                 </h3>
                              </div>

                              {/* Campaign Image Section - Responsive */}
                              <div className="w-full md:w-40 h-32 md:h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 group-hover:shadow-md transition-all">
                                 {/* Desktop image - shown on md+ screens */}
                                 <img
                                    src={camp.image_url || 'https://via.placeholder.com/800x400?text=No+Image'}
                                    alt={camp.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 hidden md:block"
                                 />
                                 {/* Mobile image - shown on small screens */}
                                 <img
                                    src={camp.mobile_image_url || camp.image_url || 'https://via.placeholder.com/400x600?text=No+Image'}
                                    alt={camp.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 md:hidden"
                                 />
                              </div>

                              {/* Content */}
                              <div className="flex-1 flex flex-col gap-3">
                                 <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{camp.title}</h3>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                       <span className="text-xs text-gray-500 dark:text-gray-400">Vade</span>
                                       <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{camp.vade_months} Ay</span>
                                       <span className="text-gray-300 dark:text-gray-600">|</span>
                                       <span className="text-xs text-gray-500 dark:text-gray-400">Tutar</span>
                                       <span className="text-xs font-bold text-green-600 dark:text-green-400">{camp.amount_tl.toLocaleString('tr-TR')} TL</span>
                                    </div>
                                 </div>

                                 {camp.bullet_points && camp.bullet_points.length > 0 && (
                                    <ul className="flex flex-wrap gap-2">
                                       {camp.bullet_points.map((feature, idx) => (
                                          <li key={idx} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center md:justify-start">
                                             <Check size={12} className="text-green-500" />
                                             {feature}
                                          </li>
                                       ))}
                                    </ul>
                                 )}
                              </div>

                              {/* Button Section */}
                              <div className="w-full md:w-auto flex-shrink-0 flex flex-col gap-2">
                                 {camp.application_link && (
                                    <a
                                       href={camp.application_link}
                                       target="_blank"
                                       rel="noreferrer"
                                       className="w-full bg-white dark:bg-white/10 border-2 border-[#ff6f00] dark:border-orange-400 text-[#ff6f00] dark:text-orange-400 hover:bg-[#ff6f00] hover:text-white dark:hover:bg-orange-500 dark:hover:text-white dark:hover:border-orange-500 font-bold py-2.5 px-6 rounded-lg transition-all text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                                    >
                                       {camp.application_button_text || 'Hemen Başvur'}
                                    </a>
                                 )}
                                 {camp.terms_link && (
                                    <a
                                       href={camp.terms_link}
                                       target="_blank"
                                       rel="noreferrer"
                                       className="block text-center text-xs font-semibold text-slate-600 dark:text-white/70 hover:text-blue-600 dark:hover:text-white hover:underline underline-offset-4 transition-colors"
                                    >
                                       {camp.terms_button_text || 'Koşulları İncele'}
                                    </a>
                                 )}
                              </div>
                           </div>
                        </div>
                     );
                  })}

                  {/* Info Banner */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                     <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 p-2 rounded-lg">
                        <Filter size={20} />
                     </div>
                     <div>
                        <h5 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Doğru Karşılaştırma</h5>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                           Listelenen kampanyalar şirketlerin genel verilerine dayanmaktadır. Size özel ödeme planı ve kesin organizasyon ücreti için lütfen "Ödeme Planı Hesapla" butonunu kullanın veya şirketle iletişime geçin.
                        </p>
                     </div>
                  </div>

               </div>


               {/* Enhanced Popular Searches Widget */}
               <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-gray-50 dark:bg-slate-900 p-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                     <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        Popüler Aramalar
                     </h4>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 dark:border-slate-700">
                     <button
                        onClick={() => setPopularTab('HOME')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${popularTab === 'HOME' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                     >
                        <Home size={16} /> Ev
                     </button>
                     <button
                        onClick={() => setPopularTab('CAR')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 ${popularTab === 'CAR' ? 'border-[#ff6f00] text-[#ff6f00] dark:text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                     >
                        <Car size={16} /> Araba
                     </button>
                  </div>

                  {/* List Content */}
                  <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
                     {(popularTab === 'HOME' ? popularHomePlans : popularCarPlans).map((plan) => (
                        <div
                           key={plan.id}
                           className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                           onClick={() => handlePopularPlanClick(plan)}
                        >
                           <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-gray-800 dark:text-white text-sm group-hover:text-primary-600 transition-colors">
                                 {plan.title}
                              </h5>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${plan.systemType === SystemType.LOTTERY
                                 ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                                 : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                                 }`}>
                                 {plan.badge}
                              </span>
                           </div>

                           <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-xs">
                              <div className="flex flex-col">
                                 <span className="text-gray-400 flex items-center gap-1"><Wallet size={10} /> Tutar</span>
                                 <span className="font-bold text-gray-700 dark:text-gray-300">{formatMoney(plan.amount)} TL</span>
                              </div>
                              <div className="flex flex-col text-right">
                                 <span className="text-gray-400 flex items-center justify-end gap-1"><Calendar size={10} /> Vade</span>
                                 <span className="font-bold text-gray-700 dark:text-gray-300">{plan.months} Ay</span>
                              </div>
                              <div className="flex flex-col col-span-2 mt-1 pt-2 border-t border-gray-100 dark:border-slate-700 border-dashed">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-500 dark:text-gray-400">Taksit:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">~{formatMoney(plan.estInstallment)} TL</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Top. Geri Ödeme:</span>
                                    <span className="font-bold text-primary-700 dark:text-primary-400">{formatMoney(plan.totalPayment)} TL</span>
                                 </div>
                              </div>
                           </div>

                           <div className="mt-3 text-center">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 Hesapla <ChevronRight size={12} />
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Side Banner */}
               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                  <BadgeCheck className="mx-auto mb-3 text-yellow-300" size={32} />
                  <h4 className="font-bold text-lg mb-2">Size Özel Teklif</h4>
                  <p className="text-blue-100 text-xs mb-4">
                     Müşteri temsilcilerimiz bütçenize en uygun planı hazırlasın.
                  </p>
                  <button className="bg-white text-blue-700 font-bold py-2 px-4 rounded-lg text-sm w-full hover:bg-blue-50 transition-colors">
                     Sizi Arayalım
                  </button>
               </div>

            </div>
         </div>
      </div>
    </div >
  );
};
