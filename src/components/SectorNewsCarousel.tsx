import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Calendar, Clock } from 'lucide-react';
import { newsApi } from '../services/api/news';
import type { NewsPost } from '../types/database';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
    sirket: { label: 'Şirket', color: 'bg-blue-600' },
    mevzuat: { label: 'Mevzuat', color: 'bg-violet-600' },
    sektor: { label: 'Sektör', color: 'bg-emerald-600' },
};

// Estimate read time based on content length
const estimateReadTime = (content?: string): number => {
    if (!content) return 2;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// Format date in Turkish
const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

interface SectorNewsCarouselProps {
    maxItems?: number;
}

export const SectorNewsCarousel: React.FC<SectorNewsCarouselProps> = ({ maxItems = 9 }) => {
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadNews();
    }, [maxItems]);

    const loadNews = async () => {
        try {
            const data = await newsApi.getPublishedNewsLimit(maxItems);
            setNews(data);
        } catch (error) {
            console.error('Failed to load sector news:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (news.length <= 0 || loading) return;

        const startAutoSlide = () => {
            autoSlideRef.current = setInterval(() => {
                setIsTransitioning(true);
                setTimeout(() => {
                    setCurrentIndex((prev) => {
                        const visibleCount = getVisibleCount();
                        const nextIndex = prev + visibleCount;
                        if (nextIndex < news.length) {
                            return nextIndex;
                        }
                        return 0;
                    });
                    setIsTransitioning(false);
                }, 300);
            }, 5000);
        };

        startAutoSlide();

        return () => {
            if (autoSlideRef.current) {
                clearInterval(autoSlideRef.current);
            }
        };
    }, [news.length, loading]);

    // Number of visible items based on screen size
    const getVisibleCount = () => {
        if (typeof window === 'undefined') return 3;
        if (window.innerWidth < 640) return 1;
        if (window.innerWidth < 1024) return 2;
        return 3;
    };

    const visibleCount = getVisibleCount();
    const totalPages = Math.ceil(news.length / visibleCount);
    const currentPage = Math.floor(currentIndex / visibleCount);

    const handleNext = () => {
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        setIsTransitioning(true);
        setTimeout(() => {
            const nextIndex = currentIndex + visibleCount;
            if (nextIndex < news.length) {
                setCurrentIndex(nextIndex);
            } else {
                setCurrentIndex(0);
            }
            setIsTransitioning(false);
        }, 300);
    };

    const handlePrev = () => {
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        setIsTransitioning(true);
        setTimeout(() => {
            const prevIndex = currentIndex - visibleCount;
            if (prevIndex >= 0) {
                setCurrentIndex(prevIndex);
            } else {
                setCurrentIndex(Math.max(0, news.length - visibleCount));
            }
            setIsTransitioning(false);
        }, 300);
    };

    const handleDotClick = (pageIndex: number) => {
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(pageIndex * visibleCount);
            setIsTransitioning(false);
        }, 300);
    };

    // Don't render if no news
    if (!loading && news.length === 0) {
        return null;
    }

    // Loading skeleton
    if (loading) {
        return (
            <section className="bg-slate-50 dark:bg-slate-900 py-10 md:py-14">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md">
                                <div className="h-48 bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                <div className="p-5 space-y-3">
                                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                    <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    const visibleNews = news.slice(currentIndex, currentIndex + visibleCount);

    return (
        <section className="bg-slate-50 dark:bg-slate-900 py-10 md:py-14">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 md:mb-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Sektör Haberleri
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 hidden sm:block">
                            Tasarruf finansmanı sektöründen son gelişmeler
                        </p>
                    </div>
                    <Link
                        to="/sektor-haberleri"
                        className="group flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm hover:shadow"
                    >
                        Tüm Haberler
                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                    {/* Navigation Arrows */}
                    {news.length > visibleCount && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-10 p-2.5 md:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 text-slate-600 dark:text-slate-300"
                                aria-label="Önceki haberler"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-10 p-2.5 md:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 text-slate-600 dark:text-slate-300"
                                aria-label="Sonraki haberler"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </>
                    )}

                    {/* Cards Grid */}
                    <div
                        ref={scrollRef}
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                    >
                        {visibleNews.map((item) => (
                            <Link
                                key={item.id}
                                to={`/sektor-haberleri/${item.slug || item.id}`}
                                className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Image */}
                                <div className="relative h-44 md:h-48 overflow-hidden bg-slate-100 dark:bg-slate-700">
                                    {item.cover_image_url ? (
                                        <img
                                            src={item.cover_image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Gradient overlay for readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Category Badge */}
                                    {item.category && CATEGORY_LABELS[item.category] && (
                                        <span className={`absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold text-white rounded-lg ${CATEGORY_LABELS[item.category].color} shadow-sm`}>
                                            {CATEGORY_LABELS[item.category].label}
                                        </span>
                                    )}

                                    {/* Featured Badge */}
                                    {item.is_featured && (
                                        <span className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-lg shadow-sm">
                                            Öne Çıkan
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-base md:text-[17px] font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.title}
                                    </h3>

                                    {item.summary && (
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {item.summary}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 text-xs text-slate-400 dark:text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {formatDate(item.published_at)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {estimateReadTime(item.content)} dk okuma
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Pagination Dots */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleDotClick(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentPage
                                    ? 'w-7 bg-slate-800 dark:bg-white'
                                    : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                                    }`}
                                aria-label={`Sayfa ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default SectorNewsCarousel;
