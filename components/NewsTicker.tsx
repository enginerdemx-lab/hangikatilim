import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../src/services/supabaseClient';
import { tickerApi } from '../src/services/api/ticker';
import type { TickerItem } from '../src/types/database';

interface NewsTickerProps {
  onNavigate?: (page: string) => void;
}

// Loading skeleton component
const TickerSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 animate-pulse">
    <div className="h-3 bg-white/20 rounded w-64"></div>
    <div className="h-3 bg-white/20 rounded w-48"></div>
    <div className="h-3 bg-white/20 rounded w-56"></div>
  </div>
);

export const NewsTicker: React.FC<NewsTickerProps> = () => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Fetch active ticker items using the existing API
  const fetchTickerItems = useCallback(async () => {
    try {
      console.log('[NewsTicker] Fetching ticker items...');
      const data = await tickerApi.getActiveTickerItems();
      console.log('[NewsTicker] Fetched items:', data?.length || 0, data);
      setTickerItems(data || []);
      setError(null);
    } catch (err) {
      console.error('[NewsTicker] Fetch error:', err);
      setError('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + Realtime subscription + Polling
  useEffect(() => {
    // Initial fetch
    fetchTickerItems();

    // Supabase Realtime subscription for ticker_items table
    const channel = supabase
      .channel('ticker_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ticker_items',
        },
        (payload) => {
          console.log('[NewsTicker] Realtime event:', payload.eventType, payload);
          // Refetch on any change to ensure consistency
          fetchTickerItems();
        }
      )
      .subscribe((status) => {
        console.log('[NewsTicker] Realtime subscription status:', status);
      });

    // Polling fallback: refetch every 60 seconds
    const pollingInterval = setInterval(() => {
      console.log('[NewsTicker] Polling refetch...');
      fetchTickerItems();
    }, 60000);

    // Cleanup
    return () => {
      console.log('[NewsTicker] Cleaning up subscription...');
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [fetchTickerItems]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Build ticker text from items
  const tickerText = tickerItems.length > 0
    ? tickerItems.map(item => {
      // Format: LABEL: Title — Message (if label/title exist)
      const labelPart = item.label ? `${item.label}: ` : '';
      const titlePart = item.title ? `${item.title} — ` : '';
      return `${labelPart}${titlePart}${item.text}`;
    }).join('  •  ')
    : '';

  // Show minimal fallback if no items (but keep structure visible for debugging)
  const showFallback = !loading && (tickerItems.length === 0 || error);

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
            {loading ? (
              <TickerSkeleton />
            ) : error ? (
              <span className="text-xs text-yellow-400">⚠️ Gündem yüklenemedi</span>
            ) : tickerItems.length === 0 ? (
              <span className="text-xs text-white/50">Henüz gündem içeriği yok</span>
            ) : prefersReducedMotion ? (
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