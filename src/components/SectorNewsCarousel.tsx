import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Calendar, Clock } from 'lucide-react';
import { newsApi } from '../services/api/news';
import type { NewsPost } from '../types/database';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
    sirket: { label: 'Şirket', color: 'bg-blue-500' },
    mevzuat: { label: 'Mevzuat', color: 'bg-purple-500' },
    sektor: { label: 'Sektör', color: 'bg-green-500' },
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
    const scrollRef = useRef<HTMLDivElement>(null);

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
        const nextIndex = currentIndex + visibleCount;
        if (nextIndex < news.length) {
            setCurrentIndex(nextIndex);
        } else {
            setCurrentIndex(0);
        }
    };

    const handlePrev = () => {
        const prevIndex = currentIndex - visibleCount;
        if (prevIndex >= 0) {
            setCurrentIndex(prevIndex);
        } else {
            setCurrentIndex(Math.max(0, news.length - visibleCount));
        }
    };

    const handleDotClick = (pageIndex: number) => {
        setCurrentIndex(pageIndex * visibleCount);
    };

    // Don't render if no news
    if (!loading && news.length === 0) {
        return null;
    }

    // Loading skeleton
    if (loading) {
        return (
            <section className="bg-gray-50 dark:bg-slate-900 py-8 md:py-12">
                <div className="container mx-auto px-3 md:px-4 max-w-7xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-10 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg">
                                <div className="h-48 bg-gray-200 dark:bg-slate-700 animate-pulse" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                                    <div className="h-6 w-full bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
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
        <section className="bg-gray-50 dark:bg-slate-900 py-8 md:py-12 border-t border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-3 md:px-4 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                            Sektör Haberleri
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                            Tasarruf finansmanı sektöründen son gelişmeler
                        </p>
                    </div>
                    <Link
                        to="/sektor-haberleri"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        Tüm Haberler
                        <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                    {/* Navigation Arrows */}
                    {news.length > visibleCount && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-white dark:bg-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-gray-700 dark:text-gray-200"
                                aria-label="Önceki haberler"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-white dark:bg-slate-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-gray-700 dark:text-gray-200"
                                aria-label="Sonraki haberler"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}

                    {/* Cards Grid */}
                    <div
                        ref={scrollRef}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                    >
                        {visibleNews.map((item) => (
                            <Link
                                key={item.id}
                                to={`/sektor-haberleri/${item.slug || item.id}`}
                                className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Image */}
                                <div className="relative h-44 md:h-48 overflow-hidden">
                                    {item.cover_image_url ? (
                                        <img
                                            src={item.cover_image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white text-4xl">📰</span>
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    {item.category && CATEGORY_LABELS[item.category] && (
                                        <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold text-white rounded-full ${CATEGORY_LABELS[item.category].color}`}>
                                            {CATEGORY_LABELS[item.category].label}
                                        </span>
                                    )}

                                    {/* Featured Badge */}
                                    {item.is_featured && (
                                        <span className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold text-yellow-800 bg-yellow-200 rounded-full">
                                            ⭐ Öne Çıkan
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 md:p-5">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.title}
                                    </h3>

                                    {item.summary && (
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {item.summary}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {formatDate(item.published_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
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
                    <div className="flex justify-center gap-2 mt-6">
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleDotClick(index)}
                                className={`h-2 rounded-full transition-all ${index === currentPage
                                        ? 'w-6 bg-blue-600 dark:bg-blue-400'
                                        : 'w-2 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500'
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
