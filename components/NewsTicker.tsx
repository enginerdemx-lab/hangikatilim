import React, { useState, useEffect } from 'react';
import { TrendingUp, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

interface NewsTickerProps {
  onNavigate?: (page: string) => void;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ onNavigate }) => {
  // Güncel Sektör Haberleri
  const headlines = [
    "SON DAKİKA: Konut kredisi faizleri %3.50 seviyesini aştı, Tasarruf Finansman'a talep %45 arttı.",
    "BDDK RAPORU: Tasarruf Finansman şirketlerinin aktif büyüklüğü 2024'te rekor seviyeye ulaştı.",
    "SEKTÖR: İnşaat maliyet endeksindeki artış nedeniyle 'Sabit Taksitli' paketlere ilgi yoğunlaşıyor.",
    "GÜNDEM: 2025 yılında 'Peşinatsız Konut' ediniminde yeni yasal düzenlemeler bekleniyor.",
    "ANALİZ: Banka kredilerine erişim zorlaşırken, Faizsiz Finansman tek alternatif haline geldi."
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, headlines.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + headlines.length) % headlines.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % headlines.length);
  };

  return (
    <div className="bg-[#210CAE] text-white border-b border-[#1a0890] relative overflow-hidden">
      <div className="container mx-auto">
        <div className="flex items-center h-10 md:h-12">

          {/* Sol - Label */}
          <div className="flex items-center gap-2 px-3 md:px-4 h-full flex-shrink-0">
            <TrendingUp size={16} className="animate-pulse hidden md:block" />
            <AlertCircle size={14} className="md:hidden" />
            <span className="font-bold tracking-wide uppercase text-xs md:text-sm">
              <span className="hidden md:inline">SEKTÖR GÜNDEMİ</span>
              <span className="md:hidden">GÜNDEM</span>
            </span>
          </div>

          {/* Sol Ok */}
          <button
            onClick={handlePrev}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex items-center justify-center w-8 h-full hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Önceki haber"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Haber İçeriği */}
          <div
            className="flex-1 px-4 flex items-center overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative w-full">
              {headlines.map((headline, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 absolute inset-0 flex items-center ${index === currentIndex
                      ? 'opacity-100 translate-x-0'
                      : index < currentIndex
                        ? 'opacity-0 -translate-x-full'
                        : 'opacity-0 translate-x-full'
                    }`}
                  style={{ position: index === currentIndex ? 'relative' : 'absolute' }}
                >
                  <span className="w-1.5 h-1.5 bg-[#4DC9E6] rounded-full mr-3 flex-shrink-0"></span>
                  <span className="text-xs md:text-sm text-white/95 line-clamp-1">
                    {headline}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ Ok */}
          <button
            onClick={handleNext}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex items-center justify-center w-8 h-full hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Sonraki haber"
          >
            <ChevronRight size={18} />
          </button>

          {/* Tüm Haberler Butonu (Desktop) */}
          <button
            onClick={() => onNavigate && onNavigate('news')}
            className="hidden md:flex items-center px-4 h-full bg-white/5 hover:bg-white/10 transition-colors border-l border-white/10"
          >
            <span className="text-xs font-bold uppercase mr-1.5">TÜM HABERLER</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-[#4DC9E6] transition-all"
          style={{
            width: isPaused ? '100%' : '0%',
            animation: isPaused ? 'none' : 'progress 5s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};