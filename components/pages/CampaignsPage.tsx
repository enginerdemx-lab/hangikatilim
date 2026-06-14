
import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronRight, Calculator, Star, Zap, Building2, Filter, Home, Car, Calendar, Wallet, BadgeCheck, Shuffle, Lock, Truck, Clock, Shield } from 'lucide-react';
import { AssetType, SystemType } from '../../types';
import { campaignsApi } from '../../src/services/api/campaigns';
import type { Campaign } from '../../src/types/database';
import { CampaignBannerSlider } from '../CampaignBannerSlider';
import { useNavigate, Link } from 'react-router-dom';

interface CampaignsPageProps {
   onNavigate: (page: string) => void;
}

const ASSET_TYPE_URL_MAP: Record<AssetType, string> = {
   [AssetType.HOME]: 'ev',
   [AssetType.CAR]: 'arac',
   [AssetType.WORKPLACE]: 'isyeri',
   [AssetType.ALL]: 'tumu',
};

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate }) => {
   const routerNavigate = useNavigate();
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
         case 'hemen_teslim': return 'text-red-600 border-red-200 bg-red-50';
         default: return 'text-green-600 border-green-200 bg-green-50';
      }
   };

   const getBadgeLabel = (badgeType: string | null) => {
      switch (badgeType) {
         case 'faizsiz_firsat': return 'Faizsiz Fırsat';
         case 'ozel_kampanya': return 'Özel Kampanya';
         case 'sponsorlu': return 'Sponsorlu';
         case 'hemen_teslim': return 'Hemen Teslim';
         default: return 'Fırsat';
      }
   };

   // Kampanyaları ayır: Hemen Teslim vs Standart
   const hemenTeslimCampaigns = campaigns.filter(c => c.badge_type === 'hemen_teslim');
   const standardCampaigns = campaigns.filter(c => c.badge_type !== 'hemen_teslim');

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
      // Navigate to home page with URL params so Calculator picks them up
      const params = new URLSearchParams({
         tip: ASSET_TYPE_URL_MAP[assetType] || 'ev',
         tutar: String(amount),
         vade: String(months),
         pesinat: '0',
      });
      routerNavigate(`/?${params.toString()}#calculator`);
   };

   const handlePopularPlanClick = (plan: any) => {
      const planAssetType = popularTab === 'HOME' ? AssetType.HOME : AssetType.CAR;
      const params = new URLSearchParams({
         tip: ASSET_TYPE_URL_MAP[planAssetType] || 'ev',
         sistem: plan.systemType === SystemType.LOTTERY ? 'cekilisli' : 'cekilissiz',
         tutar: String(plan.amount),
         vade: String(plan.months),
         pesinat: '0',
      });
      routerNavigate(`/?${params.toString()}#calculator`);
   };

   // Format currency
   const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR').format(val);

   return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 animate-fade-in pb-12 overflow-x-hidden">

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
               <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-2xl max-w-5xl mx-auto flex flex-col md:flex-row flex-wrap gap-4 items-end border border-gray-200 dark:border-slate-700">

                  {/* Asset Type Tabs */}
                  <div className="w-full md:w-auto flex-shrink-0">
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Finansman Türü</label>
                     <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg p-1 gap-0.5">
                        <button
                           onClick={() => setAssetType(AssetType.HOME)}
                           className={`flex-1 px-4 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${assetType === AssetType.HOME ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                           <Home size={14} /> Konut
                        </button>
                        <button
                           onClick={() => setAssetType(AssetType.CAR)}
                           className={`flex-1 px-4 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${assetType === AssetType.CAR ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                           <Car size={14} /> Araç
                        </button>
                        <button
                           onClick={() => setAssetType(AssetType.WORKPLACE)}
                           className={`flex-1 px-4 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${assetType === AssetType.WORKPLACE ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                           <Building2 size={14} /> İş Yeri
                        </button>
                     </div>
                  </div>

                  {/* Amount Input */}
                  <div className="w-full flex-1 min-w-[240px]">
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
                  <div className="w-full md:w-32 flex-shrink-0">
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
                        className="w-full md:w-auto bg-[#0855f8] hover:bg-[#0645d0] text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 whitespace-nowrap"
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

               {/* HEMEN TESLİM ARAÇ FIRSATLARI BÖLÜMÜ */}
               {!loading && hemenTeslimCampaigns.length > 0 && (
                  <div className="mb-10">
                     {/* Section Header */}
                     <div className="relative mb-6">
                        <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-2xl p-5 md:p-6 shadow-xl overflow-hidden">
                           <div className="absolute inset-0 opacity-10">
                              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3"></div>
                              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/4"></div>
                           </div>
                           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                 <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                                    <Truck className="text-white" size={28} />
                                 </div>
                                 <div>
                                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                       Hemen Teslim Araç Fırsatları
                                    </h2>
                                    <p className="text-white/80 text-xs mt-0.5">
                                       Beklemeden, hemen teslim araç kampanyaları
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-bold">
                                    <Clock size={14} />
                                    <span>Sınırlı Süre</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-bold">
                                    <Shield size={14} />
                                    <span>Faizsiz</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Hemen Teslim Poster Cards — Tam boy afiş görselli */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hemenTeslimCampaigns.map((camp) => (
                           <div
                              key={camp.id}
                              className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                           >
                              {/* Shine Effect Overlay — alttaki kartlarla aynı ışık geçişi */}
                              <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[2500ms]"></div>
                              </div>
                              {/* Full-size campaign poster image */}
                              {(camp.image_url || camp.mobile_image_url) && (
                                 <div className="relative w-full overflow-hidden cursor-pointer bg-white dark:bg-slate-800" onClick={() => camp.slug && routerNavigate(`/kampanyalar/${camp.slug}`)}>
                                    {/* Desktop image */}
                                    <img
                                       src={camp.image_url || camp.mobile_image_url}
                                       alt={camp.title}
                                       className="w-full h-auto block hidden md:block"
                                    />
                                    {/* Mobile image (prioritize mobile_image_url if exists) */}
                                    <img
                                       src={camp.mobile_image_url || camp.image_url}
                                       alt={camp.title}
                                       className="w-full h-auto block md:hidden"
                                    />
                                 </div>
                              )}

                              {/* Bottom info bar */}
                              <div className="p-4 md:p-5 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                                 <div className="flex flex-col gap-3">
                                    {/* Left: Company + Title */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                       {camp.company?.logo_url && (
                                          <div className="w-11 h-11 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700 p-1.5 flex-shrink-0">
                                             <img src={camp.company.logo_url} alt={camp.company?.name || ''} className="w-full h-full object-contain" />
                                          </div>
                                       )}
                                       <div className="min-w-0">
                                          <h4
                                             className={`text-sm md:text-base font-bold text-gray-900 dark:text-white truncate ${camp.slug ? 'hover:text-red-600 cursor-pointer' : ''}`}
                                             onClick={() => camp.slug && routerNavigate(`/kampanyalar/${camp.slug}`)}
                                          >
                                             {camp.title}
                                          </h4>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">{camp.company?.name}</span>
                                       </div>
                                    </div>

                                    {/* Center: Stats chips */}
                                    <div className="flex flex-wrap items-center gap-2">
                                       {(camp.vade_months || 0) > 0 && (
                                          <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-lg">
                                             <Calendar size={12} className="text-orange-500" />
                                             <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300">{camp.vade_months} Ay</span>
                                          </div>
                                       )}
                                       {(camp.amount_tl || 0) > 0 && (
                                          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg">
                                             <Wallet size={12} className="text-green-500" />
                                             <span className="text-[11px] font-bold text-green-700 dark:text-green-300">{formatMoney(camp.amount_tl || 0)} TL</span>
                                          </div>
                                       )}
                                       <div className="flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-[11px] font-bold">
                                          <Truck size={12} />
                                          Hemen Teslim
                                       </div>
                                    </div>

                                    {/* Right: CTA Button */}
                                    <div className="flex gap-2 w-full">
                                       <button
                                          className="flex-1 md:flex-none bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all text-sm shadow-lg shadow-red-500/20"
                                          onClick={() => camp.slug ? routerNavigate(`/kampanyalar/${camp.slug}`) : window.open(camp.application_link, '_blank')}
                                       >
                                          {camp.application_button_text || 'Detaylı Bilgi Al'}
                                       </button>
                                       {camp.terms_link && (
                                          <a
                                             href={camp.terms_link}
                                             target="_blank"
                                             rel="noreferrer"
                                             className="flex items-center justify-center px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                                          >
                                             Koşullar
                                          </a>
                                       )}
                                    </div>
                                 </div>

                                 {/* Bullet points (if any) */}
                                 {camp.bullet_points && camp.bullet_points.length > 0 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                       {camp.bullet_points.map((feature: string, idx: number) => (
                                          <span key={idx} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                             <Check size={11} className="text-green-500 flex-shrink-0" />
                                             {feature}
                                          </span>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* STANDART KAMPANYA LİSTESİ */}
               <div className="space-y-4">

                  {/* Skeleton Loader */}
                  {loading && (
                     <>
                        {[1, 2, 3].map((i) => (
                           <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden animate-pulse">
                              {/* Card Header Skeleton */}
                              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                                 <div className="h-5 w-24 bg-gray-200 dark:bg-slate-700 rounded"></div>
                                 <div className="h-3 w-32 bg-gray-100 dark:bg-slate-600 rounded"></div>
                              </div>
                              <div className="p-5 flex flex-col md:flex-row gap-4 items-center">
                                 {/* Image and Logo Skeleton */}
                                 <div className="flex flex-row gap-3 items-center">
                                    <div className="w-72 h-32 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
                                    <div className="flex flex-col items-center gap-2">
                                       <div className="w-20 h-20 bg-gray-100 dark:bg-slate-600 rounded-xl"></div>
                                       <div className="h-3 w-16 bg-gray-100 dark:bg-slate-600 rounded"></div>
                                    </div>
                                 </div>
                                 {/* Content Skeleton */}
                                 <div className="flex-1 space-y-3 md:pl-6">
                                    <div className="h-6 w-64 bg-gray-200 dark:bg-slate-700 rounded"></div>
                                    <div className="flex gap-4">
                                       <div className="h-10 w-20 bg-gray-100 dark:bg-slate-600 rounded"></div>
                                       <div className="h-10 w-28 bg-gray-100 dark:bg-slate-600 rounded"></div>
                                    </div>
                                    <div className="space-y-2">
                                       <div className="h-3 w-48 bg-gray-100 dark:bg-slate-600 rounded"></div>
                                       <div className="h-3 w-40 bg-gray-100 dark:bg-slate-600 rounded"></div>
                                    </div>
                                 </div>
                                 {/* Button Skeleton */}
                                 <div className="flex flex-col gap-2">
                                    <div className="w-32 h-10 bg-blue-200 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="w-24 h-4 bg-gray-100 dark:bg-slate-600 rounded mx-auto"></div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </>
                  )}

                  {!loading && standardCampaigns.map((camp) => (
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
                           <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getBadgeColor((camp.badge_type as string) || '')}`}>
                              <Zap size={12} /> {getBadgeLabel((camp.badge_type as string) || '')}
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
                              <h4
                                 className={`text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors ${camp.slug ? 'cursor-pointer' : ''}`}
                                 onClick={() => camp.slug && routerNavigate(`/kampanyalar/${camp.slug}`)}
                              >
                                 {camp.title}
                              </h4>
                              <div className="flex items-center justify-center md:justify-start gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                                 {(camp.vade_months || 0) > 0 && (
                                    <>
                                       <div className="flex flex-col">
                                          <span className="text-xs text-gray-400">Vade</span>
                                          <span className="font-bold text-gray-900 dark:text-white">{camp.vade_months} Ay</span>
                                       </div>
                                       {(camp.amount_tl || 0) > 0 && <div className="w-px h-8 bg-gray-200 dark:bg-slate-600"></div>}
                                    </>
                                 )}
                                 {(camp.amount_tl || 0) > 0 && (
                                    <div className="flex flex-col">
                                       <span className="text-xs text-gray-400">Tutar</span>
                                       <span className="font-bold text-gray-900 dark:text-white">{formatMoney(camp.amount_tl || 0)} TL</span>
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
                                 className="w-full bg-[#0855f8] hover:bg-[#0645d0] text-white font-bold py-2.5 px-6 rounded-lg transition-all text-sm"
                                 onClick={() => camp.slug ? routerNavigate(`/kampanyalar/${camp.slug}`) : window.open(camp.application_link, '_blank')}
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
                  {/* Info Banner */}
                  <div className="bg-blue-50/30 dark:bg-blue-900/5 p-3 rounded-lg border border-blue-100/50 dark:border-blue-900/20 flex items-start gap-2">
                     <div className="text-blue-400 dark:text-blue-500 mt-0.5">
                        <Filter size={14} />
                     </div>
                     <div>
                        <h5 className="font-semibold text-blue-700 dark:text-blue-300 text-xs">Doğru Karşılaştırma</h5>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 leading-relaxed mt-0.5">
                           Listelenen kampanyalar şirketlerin genel verilerine dayanmaktadır. Size özel ödeme planı ve kesin organizasyon ücreti için lütfen "Ödeme Planı Hesapla" butonunu kullanın veya şirketle iletişime geçin.
                        </p>
                     </div>
                  </div>

                  {/* Campaign Banner Slider */}
                  <CampaignBannerSlider />

               </div>
            </div>
         </div>
      </div>
   );
};
