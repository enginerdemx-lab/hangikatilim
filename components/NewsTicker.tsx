import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsTickerProps {
  onNavigate?: (page: string) => void;
}

export const NewsTicker: React.FC<NewsTickerProps> = () => {
  const headlines = [
    "SON DAKİKA: Konut kredisi faizleri %3.50 seviyesini aştı, Tasarruf Finansman'a talep %45 arttı.",
    "BDDK RAPORU: Tasarruf Finansman şirketlerinin aktif büyüklüğü 2024'te rekor seviyeye ulaştı.",
    "SEKTÖR: İnşaat maliyet endeksindeki artış nedeniyle 'Sabit Taksitli' paketlere ilgi yoğunlaşıyor.",
    "GÜNDEM: 2025 yılında 'Peşinatsız Konut' ediniminde yeni yasal düzenlemeler bekleniyor.",
    "ANALİZ: Banka kredilerine erişim zorlaşırken, Faizsiz Finansman tek alternatif haline geldi."
  ];

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Combined ticker text for seamless loop
  const tickerText = headlines.join('  •  ');

  return (
    <div
      className="bg-black text-white"
      role="marquee"
      aria-label="Sektör haberleri"
    >
      <div className="container mx-auto">
        <div className="flex items-center h-9 md:h-10">

          {/* Sol - Label */}
          <div className="flex items-center gap-2 px-3 md:px-4 h-full flex-shrink-0 bg-white/5">
            <span className="font-bold tracking-wide uppercase text-[11px] md:text-xs">
              <span className="hidden sm:inline">SEKTÖR GÜNDEMİ</span>
              <span className="sm:hidden">GÜNDEM</span>
            </span>
          </div>

          {/* Ticker Content */}
          <div
            ref={tickerRef}
            className="flex-1 overflow-hidden relative mx-3"
          >
            {prefersReducedMotion ? (
              // Reduced motion: horizontal scroll or truncate
              <div
                className="overflow-x-auto scrollbar-hide whitespace-nowrap py-1"
                title={tickerText}
              >
                <span className="text-xs md:text-sm text-white/90">
                  {tickerText}
                </span>
              </div>
            ) : (
              // Animated ticker
              <div className="ticker-wrapper flex items-center">
                <div className="ticker-content animate-ticker whitespace-nowrap">
                  <span className="text-xs md:text-sm text-white/90 inline-block">
                    {tickerText}
                  </span>
                  <span className="text-xs md:text-sm text-white/90 inline-block ml-16">
                    {tickerText}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tüm Haberler Link */}
          <Link
            to="/sektor-haberleri"
            className="flex items-center gap-1 px-3 md:px-4 h-full flex-shrink-0 
                       text-white hover:text-white/80 hover:bg-white/5
                       transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            aria-label="Tüm sektör haberlerini görüntüle"
          >
            <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wide">
              TÜM HABERLER
            </span>
            <ChevronRight size={14} className="opacity-70" />
          </Link>
        </div>
      </div>

      {/* Ticker Animation Styles */}
      <style>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        
        .animate-ticker:hover {
          animation-play-state: paused;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-ticker {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};