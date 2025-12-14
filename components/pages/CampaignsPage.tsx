
import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronRight, Calculator, Star, Zap, Building2, Filter, Home, Car, Calendar, Wallet, BadgeCheck, Shuffle, Lock } from 'lucide-react';
import { AssetType, SystemType } from '../../types';
import { campaignsApi } from '../../src/services/api/campaigns';
import type { Campaign } from '../../src/types/database';

interface CampaignsPageProps {
   onNavigate: (page: string) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate }) => {
   const [amount, setAmount] = useState(1000000);
   const [months, setMonths] = useState(24);
   const [assetType, setAssetType] = useState<AssetType>(AssetType.HOME);

   // Popular Search Tabs State
   const [popularTab, setPopularTab] = useState<'HOME' | 'CAR'>('HOME');

   // Campaigns State - Load from Supabase
   const [campaigns, setCampaigns] = useState<Campaign[]>([]);
   const [loading, setLoading] = useState(true);

   // Load campaigns
   useEffect(() => {
      loadCampaigns();
   }, []);

   const loadCampaigns = async () => {
      try {
         setLoading(true);
         const data = await campaignsApi.getActiveCampaigns();
         setCampaigns(data);
      } catch (error) {
         console.error('Failed to load campaigns:', error);
      } finally {
         setLoading(false);
      }
   };

   const getBadgeColor = (badgeType: string | null) => {
      switch (badgeType) {
         case 'faizsiz_firsat': return 'text-orange-600 border-orange-200 bg-orange-50';
         case 'ozel_kampanya': return 'text-blue-600 border-blue-200 bg-blue-50';
         case 'sponsorlu': return 'text-purple-600 border-purple-200 bg-purple-50';
         default: return 'text-green-600 border-green-200 bg-green-50';
      }
   };

   const getBadgeLabel = (badgeType: string | null) => {
      switch (badgeType) {
         case 'faizsiz_firsat': return 'Faizsiz Fırsat';
         case 'ozel_kampanya': return 'Özel Kampanya';
         case 'sponsorlu': return 'Sponsorlu';
         default: return 'Fırsat';
      }
   };

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
                     {formatMoney(amount)} TL {months} Ay Vadeli Konut, Araç ve İş Yeri Finansmanı Fırsatları
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
                        className="w-full md:w-auto bg-gradient-to-r from-[#4DC9E6] to-[#210CAE] hover:from-[#3ab5d3] hover:to-[#1a0987] text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 whitespace-nowrap"
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

                  {campaigns.map((camp) => (
                     <div
                        key={camp.id}
                        className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                     >
                        {/* Shine Effect Overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[2500ms]"></div>
                        </div>
                        {/* Card Header */}
                        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                           <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getBadgeColor(camp.badge_type)}`}>
                              <Zap size={12} /> {getBadgeLabel(camp.badge_type)}
                           </div>
                           <div className="text-xs text-gray-400">Son Güncelleme: Bugün</div>
                        </div>

                        <div className="p-5 flex flex-col md:flex-row gap-4 items-center">
                           {/* Campaign Image and Logo Section - Side by Side */}
                           <div className="w-full md:w-auto flex-shrink-0 flex flex-row gap-3 items-center">
                              {/* Campaign Banner Image (if exists) */}
                              {camp.image_url && (
                                 <div className="w-72 h-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-slate-600">
                                    <img src={camp.image_url} alt={camp.title} className="w-full h-full object-cover" />
                                 </div>
                              )}

                              {/* Company Logo */}
                              <div className="flex flex-col items-center justify-center text-center gap-2">
                                 <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700 p-1">
                                    {camp.company?.logo_url ? (
                                       <img src={camp.company.logo_url} alt={camp.company?.name || 'Company'} className="w-full h-full object-contain" />
                                    ) : (
                                       <Building2 size={28} className="text-gray-400" />
                                    )}
                                 </div>
                                 <h3 className="font-bold text-xs text-gray-800 dark:text-gray-200 max-w-[80px] truncate">{camp.company?.name?.split(' ')[0] || 'Kampanya'}</h3>
                              </div>
                           </div>

                           {/* Content Section */}
                           <div className="flex-1 text-center md:text-left border-l-0 md:border-l border-gray-100 dark:border-slate-700 md:pl-6 w-full">
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                                 {camp.title}
                              </h4>
                              <div className="flex items-center justify-center md:justify-start gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                                 {camp.vade_months > 0 && (
                                    <>
                                       <div className="flex flex-col">
                                          <span className="text-xs text-gray-400">Vade</span>
                                          <span className="font-bold text-gray-900 dark:text-white">{camp.vade_months} Ay</span>
                                       </div>
                                       {camp.amount_tl > 0 && <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>}
                                    </>
                                 )}
                                 {camp.amount_tl > 0 && (
                                    <div className="flex flex-col">
                                       <span className="text-xs text-gray-400">Tutar</span>
                                       <span className="font-bold text-gray-900 dark:text-white">{formatMoney(camp.amount_tl)} TL</span>
                                    </div>
                                 )}
                              </div>

                              <ul className="space-y-1">
                                 {camp.bullet_points?.map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 justify-center md:justify-start">
                                       <Check size={12} className="text-green-500" />
                                       {feature}
                                    </li>
                                 ))}
                              </ul>
                           </div>

                           {/* Button Section */}
                           <div className="w-full md:w-auto flex-shrink-0 flex flex-col gap-2">
                              <button
                                 className="w-full bg-white dark:bg-slate-700 border-2 border-[#210CAE] text-[#210CAE] hover:bg-gradient-to-r hover:from-[#4DC9E6] hover:to-[#210CAE] hover:text-white font-bold py-2.5 px-6 rounded-lg transition-all text-sm"
                                 onClick={() => window.open(camp.application_link, '_blank')}
                              >
                                 {camp.application_button_text || 'Hemen Başvur'}
                              </button>
                              <a
                                 href={camp.terms_link}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="block text-center text-xs font-semibold text-gray-500 hover:text-blue-600 hover:underline"
                              >
                                 {camp.terms_button_text || 'Koşulları İncele'}
                              </a>
                           </div>
                        </div>
                     </div>
                  ))}

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
            </div>
         </div>
      </div>
   );
};
