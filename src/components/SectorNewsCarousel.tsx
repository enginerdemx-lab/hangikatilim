import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const [currentPage, setCurrentPage] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
    const [isAnimating, setIsAnimating] = useState(false);
    const [visibleCount, setVisibleCount] = useState(3);
    const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadNews();
    }, [maxItems]);

    // Update visible count on resize
    useEffect(() => {
        const updateVisibleCount = () => {
            if (window.innerWidth < 640) setVisibleCount(1);
            else if (window.innerWidth < 1024) setVisibleCount(2);
            else setVisibleCount(3);
        };
        updateVisibleCount();
        window.addEventListener('resize', updateVisibleCount);
        return () => window.removeEventListener('resize', updateVisibleCount);
    }, []);

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

    const totalPages = Math.ceil(news.length / visibleCount);

    const goToPage = useCallback((page: number, direction: 'left' | 'right') => {
        if (isAnimating) return;
        if (autoSlideRef.current) clearInterval(autoSlideRef.current);
        setSlideDirection(direction);
        setIsAnimating(true);
        // Small delay so the direction class is applied before animation starts
        requestAnimationFrame(() => {
            setCurrentPage(page);
        });
    }, [isAnimating]);

    const handleNext = useCallback(() => {
        const nextPage = currentPage + 1 < totalPages ? currentPage + 1 : 0;
        goToPage(nextPage, 'right');
    }, [currentPage, totalPages, goToPage]);

    const handlePrev = useCallback(() => {
        const prevPage = currentPage - 1 >= 0 ? currentPage - 1 : totalPages - 1;
        goToPage(prevPage, 'left');
    }, [currentPage, totalPages, goToPage]);

    const handleDotClick = useCallback((pageIndex: number) => {
        if (pageIndex === currentPage) return;
        const direction = pageIndex > currentPage ? 'right' : 'left';
        goToPage(pageIndex, direction);
    }, [currentPage, goToPage]);

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (news.length <= 0 || loading || totalPages <= 1) return;

        const startAutoSlide = () => {
            autoSlideRef.current = setInterval(() => {
                setSlideDirection('right');
                setIsAnimating(true);
                requestAnimationFrame(() => {
                    setCurrentPage((prev) => (prev + 1 < totalPages ? prev + 1 : 0));
                });
            }, 5000);
        };

        startAutoSlide();

        return () => {
            if (autoSlideRef.current) {
                clearInterval(autoSlideRef.current);
            }
        };
    }, [news.length, loading, totalPages]);

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

    const startIndex = currentPage * visibleCount;
    const visibleNews = news.slice(startIndex, startIndex + visibleCount);

    return (
        <section className="bg-slate-50 dark:bg-slate-900 py-10 md:py-14">
            {/* Inline styles for the slide + scale animation */}
            <style>{`
                .carousel-track {
                    display: grid;
                    grid-template-columns: repeat(${visibleCount}, 1fr);
                    gap: 1.25rem;
                }
                @media (min-width: 768px) {
                    .carousel-track {
                        gap: 1.5rem;
                    }
                }

                .carousel-card {
                    animation-duration: 0.55s;
                    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    animation-fill-mode: both;
                }

                .slide-right .carousel-card {
                    animation-name: slideInFromRight;
                }

                .slide-left .carousel-card {
                    animation-name: slideInFromLeft;
                }

                .carousel-card:nth-child(1) { animation-delay: 0ms; }
                .carousel-card:nth-child(2) { animation-delay: 70ms; }
                .carousel-card:nth-child(3) { animation-delay: 140ms; }

                @keyframes slideInFromRight {
                    0% {
                        opacity: 0;
                        transform: translateX(60px) scale(0.92);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                @keyframes slideInFromLeft {
                    0% {
                        opacity: 0;
                        transform: translateX(-60px) scale(0.92);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
            `}</style>

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
                    {totalPages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                disabled={isAnimating}
                                className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-10 p-2.5 md:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Önceki haberler"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={isAnimating}
                                className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-10 p-2.5 md:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Sonraki haberler"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </>
                    )}

                    {/* Cards - Sliding Carousel */}
                    <div
                        key={currentPage}
                        className={`carousel-track ${slideDirection === 'right' ? 'slide-right' : 'slide-left'}`}
                        onAnimationEnd={() => setIsAnimating(false)}
                    >
                        {visibleNews.map((item) => (
                            <Link
                                key={item.id}
                                to={`/sektor-haberleri/${item.slug || item.id}`}
                                className="carousel-card group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1"
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
