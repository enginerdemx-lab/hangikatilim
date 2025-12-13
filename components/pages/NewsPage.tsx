
import React, { useState } from 'react';
import { Calendar, Clock, ArrowRight, Building2, TrendingUp, Tag, Share2, ChevronRight, Newspaper } from 'lucide-react';

export const NewsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COMPANY' | 'REGULATION'>('ALL');

  const featuredNews = {
    id: 1,
    title: "Tasarruf Finansman Sektörü 2025'in İlk Çeyreğinde %35 Büyüdü",
    summary: "Yüksek faiz oranları ve kredi kısıtlamaları vatandaşı alternatif finansmana yöneltti. BDDK verilerine göre sektörün aktif büyüklüğü tarihi zirveyi gördü. 2025 yılı sonu hedefi yukarı yönlü revize edildi.",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    date: "15 Nisan 2025",
    category: "Sektörel",
    source: "Ekonomi Masası"
  };

  const newsList = [
    {
      id: 2,
      title: "BDDK'dan Dijital Sözleşme Devrimi",
      summary: "Artık şubeye gitmeye gerek kalmadan, e-Devlet entegrasyonu ile tasarruf finansman sözleşmeleri dijital ortamda imzalanabilecek. Yeni düzenleme Resmi Gazete'de yayımlandı.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "12 Nisan 2025",
      category: "REGULATION",
      company: "BDDK",
      badgeColor: "bg-red-100 text-red-700"
    },
    {
      id: 3,
      title: "Eminevim 500. Şubesini Törenle Açtı",
      summary: "Sektörün lider kuruluşu Eminevim, Anadolu'daki büyüme stratejisi kapsamında 500. şubesini Sivas'ta hizmete açtı. Açılışta konuşan Yönetim Kurulu Başkanı, 2025 hedeflerini paylaştı.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "10 Nisan 2025",
      category: "COMPANY",
      company: "Eminevim",
      badgeColor: "bg-orange-100 text-orange-700"
    },
    {
      id: 4,
      title: "Konut Kredisi Faizleri %4'ü Aştı, Gözler Faizsiz Sistemde",
      summary: "Merkez Bankası'nın sıkı para politikası devam ederken, konut kredisi faizleri psikolojik sınırı aştı. Ev sahibi olmak isteyenler için tasarruf finansman modelleri tek çıkış yolu haline geldi.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "08 Nisan 2025",
      category: "SECTOR",
      company: "Analiz",
      badgeColor: "bg-blue-100 text-blue-700"
    },
    {
      id: 5,
      title: "Fuzul Ev'den 'Enflasyon Korumalı' Yeni Paket",
      summary: "Fuzul Ev, artan inşaat maliyetlerine karşı tasarruf sahiplerini korumak amacıyla, teslimat tutarının enflasyon oranında güncellendiği yeni paketini duyurdu.",
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "05 Nisan 2025",
      category: "COMPANY",
      company: "Fuzul Ev",
      badgeColor: "bg-red-100 text-red-700"
    },
    {
      id: 6,
      title: "Katılımevim Borsa İstanbul'da Temettü Dağıtacak",
      summary: "Halka açık işlem gören Katılımevim, 2024 yılı kârından yatırımcılarına hisse başına 2.5 TL brüt temettü dağıtma kararı aldı. Ödemeler Mayıs ayında yapılacak.",
      image: "https://images.unsplash.com/photo-1611974765270-ca12586343bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "01 Nisan 2025",
      category: "COMPANY",
      company: "Katılımevim",
      badgeColor: "bg-green-100 text-green-700"
    },
    {
      id: 7,
      title: "Sinpaş YTS'den Dev Kampanya: Organizasyon Ücretine Taksit",
      summary: "Sinpaş Yapı Tasarruf Sandığı, peşinat ödemekte zorlanan vatandaşlar için organizasyon ücretini 12 taksite bölen yeni kampanyasını başlattı.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "28 Mart 2025",
      category: "COMPANY",
      company: "Sinpaş",
      badgeColor: "bg-blue-100 text-blue-700"
    },
    {
      id: 8,
      title: "İmece Tasarruf'tan Çiftçiye Özel Traktör Finansmanı",
      summary: "İmece Tasarruf, tarım sektörünü desteklemek amacıyla çiftçilere özel, hasat zamanı ödemeli traktör ve tarım ekipmanı finansman paketini tanıttı.",
      image: "https://images.unsplash.com/photo-1595111796443-3b10c5115286?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "25 Mart 2025",
      category: "COMPANY",
      company: "İmece",
      badgeColor: "bg-yellow-100 text-yellow-700"
    },
    {
      id: 9,
      title: "Birevim Gençlik Meclisi Kuruldu",
      summary: "Gençlerin tasarruf alışkanlıklarını geliştirmek ve finansal okuryazarlığı artırmak amacıyla Birevim bünyesinde Gençlik Meclisi faaliyete geçti.",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "22 Mart 2025",
      category: "COMPANY",
      company: "Birevim",
      badgeColor: "bg-purple-100 text-purple-700"
    },
    {
      id: 10,
      title: "Tasarruf Finansman Yasası'nda Değişiklik Sinyali",
      summary: "Sektör temsilcilerinin talebi üzerine, teslimat sürelerini kısaltacak ve sermaye yeterlilik rasyolarını güncelleyecek yeni yasa taslağı TBMM'ye sunuldu.",
      image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      date: "20 Mart 2025",
      category: "REGULATION",
      company: "Mevzuat",
      badgeColor: "bg-gray-100 text-gray-700"
    }
  ];

  const filteredNews = activeFilter === 'ALL' 
    ? newsList 
    : newsList.filter(news => news.category === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 animate-fade-in">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
                 <Newspaper size={14} />
                 Basında Sektör
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Sektör Haberleri</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
                 Katılım firmalarından son gelişmeler, şirket haberleri ve yasal düzenlemeler.
              </p>
           </div>

           {/* Filters */}
           <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <button 
                onClick={() => setActiveFilter('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === 'ALL' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Tümü
              </button>
              <button 
                onClick={() => setActiveFilter('COMPANY')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeFilter === 'COMPANY' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                <Building2 size={16} /> Şirket Haberleri
              </button>
              <button 
                onClick={() => setActiveFilter('REGULATION')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeFilter === 'REGULATION' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                <TrendingUp size={16} /> Mevzuat
              </button>
           </div>
        </div>

        {/* Featured News (Hero) */}
        {activeFilter === 'ALL' && (
            <div className="group relative rounded-3xl overflow-hidden shadow-2xl h-[400px] md:h-[500px] mb-12">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${featuredNews.image})` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90"></div>
                
                <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-4xl z-10">
                <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase mb-4 inline-block shadow-lg">
                    Manşet
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    {featuredNews.title}
                </h2>
                <p className="text-gray-200 text-lg mb-6 line-clamp-2 md:line-clamp-none max-w-3xl">
                    {featuredNews.summary}
                </p>
                
                <div className="flex items-center gap-6 text-sm text-gray-300 font-medium">
                    <div className="flex items-center gap-2">
                        <Tag size={16} className="text-red-400" />
                        {featuredNews.category}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-red-400" />
                        {featuredNews.date}
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-red-400" />
                        3 dk okuma
                    </div>
                </div>
                </div>
            </div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredNews.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                    <div className="relative h-48 overflow-hidden">
                        <div className="absolute top-4 left-4 z-10">
                            {item.category === 'COMPANY' && (
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-white dark:bg-slate-900 shadow-sm flex items-center gap-1`}>
                                   <Building2 size={10} /> {item.company}
                                </span>
                            )}
                            {item.category === 'REGULATION' && (
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-red-500 text-white shadow-sm flex items-center gap-1`}>
                                   <TrendingUp size={10} /> BDDK
                                </span>
                            )}
                            {item.category === 'SECTOR' && (
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-500 text-white shadow-sm flex items-center gap-1`}>
                                   <TrendingUp size={10} /> Sektör
                                </span>
                            )}
                        </div>
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                            <Calendar size={12} />
                            {item.date}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {item.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 mb-6 flex-grow">
                            {item.summary}
                        </p>
                        
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between mt-auto">
                            <button className="text-primary-600 dark:text-primary-400 font-bold text-xs flex items-center gap-1 hover:gap-2 transition-all">
                                Haberi Oku <ArrowRight size={14} />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <Share2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};
