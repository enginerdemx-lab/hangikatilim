
import React, { useState, useRef } from 'react';
import { User, Settings, Save, CreditCard, Bell, LogOut, FileText, ChevronRight, FileDown, Home, Car, Filter, Camera, Upload, Zap, Tag, Info, CheckCircle2, AlertCircle, ChevronDown, Calendar, Building2, Layers } from 'lucide-react';
import { SavedCalculation, AssetType } from '../../types';
import { generatePDF } from '../../services/pdfService';

interface AccountPageProps {
  user: { name: string; email: string; avatarUrl?: string } | null;
  onLogout: () => void;
  savedCalculations: SavedCalculation[];
  onUpdateAvatar: (url: string) => void;
}

// Mock Notifications Data
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "Bahar Kampanyası Başladı!",
    message: "Tüm çekilişli konut edindirme paketlerinde organizasyon ücretinde %20 indirim fırsatı başladı. Son gün 30 Nisan.",
    date: "Bugün",
    type: "CAMPAIGN",
    isRead: false
  },
  {
    id: 2,
    title: "5. Ayda Teslim Garantisi",
    message: "Peşinatlı sistemlerde beklemek yok! %40 peşinat ile sisteme dahil olun, 5. ayda evinizi teslim alın.",
    date: "Dün",
    type: "CAMPAIGN",
    isRead: false
  },
  {
    id: 3,
    title: "Peşinatsız Araç Finansmanı",
    message: "Hiç peşinat ödemeden, sadece aylık taksitlerle araba sahibi olmak ister misiniz? Yeni kampanyamız yayında.",
    date: "2 Gün Önce",
    type: "CAMPAIGN",
    isRead: true
  },
  {
    id: 4,
    title: "Sistem Güncellemesi",
    message: "Uygulamamızın hesaplama motoru güncellendi. Artık yıllık artışlı modelleri daha detaylı hesaplayabilirsiniz.",
    date: "1 Hafta Önce",
    type: "SYSTEM",
    isRead: true
  }
];

type TabType = 'DASHBOARD' | 'SAVED' | 'NOTIFICATIONS' | 'APPLICATIONS' | 'SETTINGS' | 'PROFILE';
type FilterType = 'ALL' | 'HOME' | 'CAR' | 'WORKPLACE';

export const AccountPage: React.FC<AccountPageProps> = ({ user, onLogout, savedCalculations, onUpdateAvatar }) => {
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [openPlanId, setOpenPlanId] = useState<string | null>(null); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Calculations Filter Logic
  const filteredPlans = savedCalculations.filter(plan => {
    if (filterType === 'ALL') return true;
    if (filterType === 'HOME') return plan.params.assetType === AssetType.HOME;
    if (filterType === 'CAR') return plan.params.assetType === AssetType.CAR;
    if (filterType === 'WORKPLACE') return plan.params.assetType === AssetType.WORKPLACE;
    return true;
  });
  
  const totalSavings = savedCalculations.reduce((acc, curr) => acc + curr.params.targetAmount, 0);
  const unreadNotifications = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePlanDetails = (id: string) => {
    if (openPlanId === id) {
      setOpenPlanId(null);
    } else {
      setOpenPlanId(id);
    }
  };

  // --- SUB-COMPONENTS FOR TABS ---

  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
       {/* Welcome Stats */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-primary-500/20">
             <p className="text-primary-100 text-sm mb-1">Toplam Tasarruf Hedefi</p>
             <h3 className="text-2xl font-bold">{new Intl.NumberFormat('tr-TR', {style: 'currency', currency: 'TRY', maximumFractionDigits: 0}).format(totalSavings)}</h3>
             <div className="mt-4 text-xs bg-white/20 inline-block px-2 py-1 rounded">{savedCalculations.length} Plan</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Son Hesaplama</p>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                     {savedCalculations.length > 0 ? savedCalculations[0].title : 'Yok'}
                   </h3>
                </div>
                <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                   <Save size={20} />
                </div>
             </div>
             <button 
                onClick={() => {
                    if(savedCalculations.length > 0) {
                        setActiveTab('SAVED');
                        setOpenPlanId(savedCalculations[0].id);
                    }
                }}
                className="mt-4 text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline"
             >
                Detayları Gör
             </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-start">
                 <div>
                   <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Üyelik Durumu</p>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">Aktif</h3>
                 </div>
                 <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                    <User size={20} />
                 </div>
             </div>
             <p className="mt-4 text-xs text-gray-400">Kayıt Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
          </div>
       </div>

       {/* Quick Shortcuts */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setActiveTab('SAVED')}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
              <div className="flex items-center gap-4">
                 <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Hesaplamalarım</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kayıtlı {savedCalculations.length} planını incele</p>
                 </div>
                 <ChevronRight className="ml-auto text-gray-300 group-hover:text-primary-500 transition-colors" />
              </div>
          </div>
          <div 
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
              <div className="flex items-center gap-4">
                 <div className="bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <Bell size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Kampanyalar</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{unreadNotifications} yeni fırsat var</p>
                 </div>
                 <ChevronRight className="ml-auto text-gray-300 group-hover:text-primary-500 transition-colors" />
              </div>
          </div>
       </div>
    </div>
  );

  const SavedCalculationsView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
             <Save size={20} className="text-primary-500"/>
             Kayıtlı Hesaplamalarım
           </h3>
           
           {/* Filter Controls */}
           <div className="flex flex-wrap bg-gray-100 dark:bg-slate-900 p-1 rounded-lg gap-1">
               <button 
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${filterType === 'ALL' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
               >
                  Tümü
               </button>
               <button 
                  onClick={() => setFilterType('HOME')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${filterType === 'HOME' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
               >
                  <Home size={12} /> Ev
               </button>
               <button 
                  onClick={() => setFilterType('WORKPLACE')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${filterType === 'WORKPLACE' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
               >
                  <Building2 size={12} /> İş Yeri
               </button>
               <button 
                  onClick={() => setFilterType('CAR')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${filterType === 'CAR' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
               >
                  <Car size={12} /> Araba
               </button>
           </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-700">
           {filteredPlans.length > 0 ? (
               filteredPlans.map((plan) => (
                  <div key={plan.id} className="bg-white dark:bg-slate-800 transition-colors">
                    {/* Row Header */}
                    <div 
                        onClick={() => togglePlanDetails(plan.id)}
                        className="p-6 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <div className={`p-3 rounded-xl flex-shrink-0 ${
                            plan.params.assetType === AssetType.HOME ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 
                            (plan.params.assetType === AssetType.WORKPLACE ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 
                            (plan.params.assetType === AssetType.CAR ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-50 text-gray-600'))
                        }`}>
                           {plan.params.assetType === AssetType.HOME && <Home size={20} />}
                           {plan.params.assetType === AssetType.WORKPLACE && <Building2 size={20} />}
                           {plan.params.assetType === AssetType.CAR && <Car size={20} />}
                           {plan.params.assetType === AssetType.ALL && <Layers size={20} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white truncate">{plan.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>{plan.date}</span>
                                <span>•</span>
                                <span>{plan.params.systemType === 'LOTTERY' ? 'Çekilişli Sistem' : 'Çekilişsiz Sistem'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:flex gap-4 md:gap-8 items-center">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Hedef Tutar</p>
                                <p className="font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('tr-TR', {style: 'currency', currency: 'TRY', maximumFractionDigits: 0}).format(plan.params.targetAmount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Taksit</p>
                                <p className="font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('tr-TR', {style: 'currency', currency: 'TRY', maximumFractionDigits: 0}).format(plan.result.monthlyInstallment)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto md:ml-4">
                             <button 
                                onClick={(e) => { e.stopPropagation(); generatePDF(plan.params, plan.result, user.name); }}
                                className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                title="PDF İndir"
                             >
                                <FileDown size={20} />
                             </button>
                             <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${openPlanId === plan.id ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {/* Expanded Detail View (Accordion) */}
                    <div className={`border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 overflow-hidden transition-all duration-500 ${openPlanId === plan.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <Calendar size={16} /> Ödeme Takvimi Özeti
                                </h5>
                                <span className="text-xs text-gray-500">Toplam {plan.result.schedule.length} Taksit</span>
                            </div>
                            
                            {/* Mini Schedule Table */}
                            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-100 dark:bg-slate-900 font-bold text-gray-600 dark:text-gray-300">
                                        <tr>
                                            <th className="p-3">Taksit No</th>
                                            <th className="p-3">Tarih</th>
                                            <th className="p-3 text-right">Tutar</th>
                                            <th className="p-3 text-right">Kalan Borç</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {/* Show first 3 and delivery month and last month */}
                                        {plan.result.schedule.filter((row, idx, arr) => idx < 3 || row.isDeliveryMonth || idx === arr.length -1).map((row, i, arr) => (
                                            <tr key={row.month} className={row.isDeliveryMonth ? 'bg-green-50 dark:bg-green-900/10' : ''}>
                                                <td className="p-3 font-medium">
                                                    {row.month}. Taksit
                                                    {row.isDeliveryMonth && <span className="ml-2 text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">TESLİMAT</span>}
                                                </td>
                                                <td className="p-3 text-gray-500">{row.date}</td>
                                                <td className="p-3 text-right font-bold">{new Intl.NumberFormat('tr-TR', {style: 'currency', currency: 'TRY', maximumFractionDigits: 0}).format(row.amount)}</td>
                                                <td className="p-3 text-right text-gray-500">{new Intl.NumberFormat('tr-TR', {style: 'currency', currency: 'TRY', maximumFractionDigits: 0}).format(row.remaining)}</td>
                                            </tr>
                                        ))}
                                        {plan.result.schedule.length > 5 && (
                                             <tr>
                                                 <td colSpan={4} className="p-2 text-center text-gray-400 text-[10px] italic">... Tam liste için PDF indiriniz ...</td>
                                             </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                  </div>
               ))
           ) : (
               <div className="p-12 text-center">
                   <div className="bg-gray-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                       <Save size={24} />
                   </div>
                   <h3 className="text-gray-900 dark:text-white font-bold mb-1">Henüz kayıtlı plan yok</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                       {filterType === 'ALL' 
                           ? 'Hesaplama aracını kullanarak yeni bir plan oluşturup kaydedebilirsiniz.'
                           : `Bu kategoride kayıtlı bir planınız bulunmuyor.`
                       }
                   </p>
               </div>
           )}
        </div>
    </div>
  );

  const NotificationsView = () => (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
             <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
               <Bell size={20} className="text-gold-500"/>
               Bildirimler & Kampanyalar
             </h3>
             <button className="text-xs text-primary-600 dark:text-primary-400 hover:underline">Tümünü Okundu İşaretle</button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
             {MOCK_NOTIFICATIONS.map((notification) => (
                <div key={notification.id} className={`p-6 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors flex gap-4 relative ${!notification.isRead ? 'bg-primary-50/30 dark:bg-primary-900/5' : ''}`}>
                   {/* Icon Based on Type */}
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'CAMPAIGN' 
                        ? 'bg-gold-100 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400' 
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                   }`}>
                      {notification.type === 'CAMPAIGN' ? <Tag size={20} /> : <Info size={20} />}
                   </div>
                   
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                         <h4 className={`font-bold text-base ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            {notification.title}
                         </h4>
                         <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notification.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                         {notification.message}
                      </p>
                      {notification.type === 'CAMPAIGN' && (
                         <button className="mt-3 text-xs font-bold text-primary-700 dark:text-primary-400 flex items-center gap-1 hover:gap-2 transition-all">
                            Kampanyayı İncele <ChevronRight size={14} />
                         </button>
                      )}
                   </div>
                   
                   {!notification.isRead && (
                      <div className="absolute top-6 left-2 w-2 h-2 bg-red-500 rounded-full"></div>
                   )}
                </div>
             ))}
          </div>
      </div>
  );

  const ProfileSettingsView = () => (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 animate-fade-in">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <User size={20} className="text-primary-500"/>
                Profil Ayarları
            </h3>
            <button className="text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 px-4 py-2 rounded-lg transition-colors font-bold">
                Kaydet
            </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex justify-center mb-4">
                 <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                     <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-100 dark:border-slate-700">
                         {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-500 to-teal-400 flex items-center justify-center text-white text-3xl font-bold">
                                 {user.name.charAt(0).toUpperCase()}
                            </div>
                         )}
                     </div>
                     <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 p-2 rounded-full shadow-md border border-gray-200 dark:border-slate-600 text-primary-600 dark:text-primary-400">
                         <Camera size={16} />
                     </div>
                 </div>
            </div>
            
            <div className="space-y-2">
               <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Ad Soyad</label>
               <input type="text" defaultValue={user.name} className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all" />
            </div>
            <div className="space-y-2">
               <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">E-Posta</label>
               <input type="email" defaultValue={user.email} disabled className="w-full p-3 bg-gray-100 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
               <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Telefon</label>
               <input type="tel" placeholder="+90 5XX XXX XX XX" className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all" />
            </div>
            <div className="space-y-2">
               <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Şehir</label>
               <select className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all">
                   <option>İstanbul</option>
                   <option>Ankara</option>
                   <option>İzmir</option>
                   <option>Bursa</option>
               </select>
            </div>
            
            <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-slate-700 mt-2">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Şifre Değiştir</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="password" placeholder="Yeni Şifre" className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all" />
                    <input type="password" placeholder="Yeni Şifre (Tekrar)" className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all" />
                </div>
            </div>
         </div>
      </div>
  );
  
  const ApplicationsView = () => (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-12 text-center animate-fade-in">
          <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz Başvurunuz Yok</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Hesaplama aracını kullanarak oluşturduğunuz planlar için uzmanlarımızdan randevu talep ettiğinizde burada görünecektir.
          </p>
          <button 
            onClick={() => setActiveTab('DASHBOARD')} // Usually would link to calculator
            className="bg-primary-700 hover:bg-primary-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary-700/20 transition-all"
          >
              Yeni Plan Oluştur
          </button>
      </div>
  );

  // --- MAIN RENDER ---

  const renderContent = () => {
    switch (activeTab) {
      case 'SAVED':
        return <SavedCalculationsView />;
      case 'NOTIFICATIONS':
        return <NotificationsView />;
      case 'PROFILE':
      case 'SETTINGS': // Combining for this demo
        return <ProfileSettingsView />;
      case 'APPLICATIONS':
        return <ApplicationsView />;
      case 'DASHBOARD':
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 animate-fade-in">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           
           {/* Sidebar Navigation */}
           <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm sticky top-24">
                 <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-gray-100 dark:border-slate-700">
                    
                    {/* Avatar Upload Area */}
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                         <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shadow-lg shadow-primary-500/20 border-2 border-white dark:border-slate-700">
                             {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-teal-400 flex items-center justify-center text-white text-2xl font-bold">
                                     {user.name.charAt(0).toUpperCase()}
                                </div>
                             )}
                         </div>
                         <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Camera size={20} className="text-white" />
                         </div>
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                         />
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-3">{user.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                 </div>
                 
                 <nav className="space-y-1">
                    <button 
                        onClick={() => setActiveTab('DASHBOARD')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'DASHBOARD' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                       <Zap size={18} /> Özet / Panel
                    </button>
                    <button 
                        onClick={() => setActiveTab('PROFILE')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'PROFILE' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                       <User size={18} /> Profil Bilgilerim
                    </button>
                    <button 
                        onClick={() => setActiveTab('SAVED')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'SAVED' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                       <Save size={18} /> Kayıtlı Hesaplamalar
                    </button>
                    <button 
                        onClick={() => setActiveTab('APPLICATIONS')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'APPLICATIONS' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                       <FileText size={18} /> Başvurularım
                    </button>
                    <button 
                        onClick={() => setActiveTab('NOTIFICATIONS')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'NOTIFICATIONS' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                       <Bell size={18} /> Bildirimler 
                       {unreadNotifications > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadNotifications}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('SETTINGS')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'SETTINGS' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                       <Settings size={18} /> Ayarlar
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-slate-700 my-2"></div>
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
                    >
                       <LogOut size={18} /> Çıkış Yap
                    </button>
                 </nav>
              </div>
           </div>

           {/* Main Content Area */}
           <div className="lg:col-span-3 space-y-6">
              {renderContent()}
           </div>
        </div>
      </div>
    </div>
  );
};
