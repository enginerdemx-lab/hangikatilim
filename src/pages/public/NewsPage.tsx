import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Building2, TrendingUp, Newspaper, Filter } from 'lucide-react';
import { newsApi } from '../../services/api/news';
import type { NewsPost } from '../../types/database';

// Category filter types
type CategoryFilter = 'all' | 'sirket' | 'mevzuat';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    sirket: {
        label: 'Şirket',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: <Building2 size={14} />
    },
    mevzuat: {
        label: 'Mevzuat',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        icon: <TrendingUp size={14} />
    },
    sektor: {
        label: 'Sektör',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: <Newspaper size={14} />
    },
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

// Estimate read time based on content length
const estimateReadTime = (content?: string): number => {
    if (!content) return 2;
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

const NewsPage: React.FC = () => {
    const [news, setNews] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        try {
            setLoading(true);
            const data = await newsApi.getPublishedNews();
            setNews(data);
        } catch (error) {
            console.error('Failed to load news:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter news by category
    const filteredNews = activeFilter === 'all'
        ? news
        : news.filter(item => item.category === activeFilter);

    // Get featured news (first item that's featured or just the first item)
    const featuredNews = filteredNews.find(n => n.is_featured) || filteredNews[0];
    const regularNews = filteredNews.filter(n => n.id !== featuredNews?.id);

    // Filter buttons config
    const filterButtons: { key: CategoryFilter; label: string; icon: React.ReactNode }[] = [
        { key: 'all', label: 'Tümü', icon: <Filter size={16} /> },
        { key: 'sirket', label: 'Şirket Haberleri', icon: <Building2 size={16} /> },
        { key: 'mevzuat', label: 'Mevzuat', icon: <TrendingUp size={16} /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold mb-2">
                            📰 BASINDA SEKTÖR
                        </span>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Sektör Haberleri
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Katılım firmalarından son gelişmeler, şirket haberleri ve yasal düzenlemeler.
                        </p>
                    </div>

                    {/* Category Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {filterButtons.map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => setActiveFilter(btn.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeFilter === btn.key
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {btn.icon}
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredNews.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📰</div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Haber Bulunamadı
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {activeFilter === 'all'
                                ? 'Henüz haber eklenmemiş.'
                                : 'Bu kategoride henüz haber yok.'}
                        </p>
                        {activeFilter !== 'all' && (
                            <button
                                onClick={() => setActiveFilter('all')}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Tüm Haberleri Göster
                            </button>
                        )}
                    </div>
                )}

                {/* News Content */}
                {!loading && filteredNews.length > 0 && (
                    <>
                        {/* Featured News */}
                        {featuredNews && (
                            <Link
                                to={`/sektor-haberleri/${featuredNews.slug || featuredNews.id}`}
                                className="block mb-8 group"
                            >
                                <div className="relative rounded-2xl overflow-hidden shadow-xl h-[400px] md:h-[500px]">
                                    {featuredNews.cover_image_url ? (
                                        <img
                                            src={featuredNews.cover_image_url}
                                            alt={featuredNews.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                                        {/* Featured Badge */}
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold mb-4">
                                            MANŞET
                                        </span>

                                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight group-hover:text-blue-200 transition-colors">
                                            {featuredNews.title}
                                        </h2>

                                        {featuredNews.summary && (
                                            <p className="text-gray-200 text-lg mb-4 max-w-3xl line-clamp-2">
                                                {featuredNews.summary}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                            {featuredNews.category && CATEGORY_CONFIG[featuredNews.category] && (
                                                <span className="flex items-center gap-1">
                                                    {CATEGORY_CONFIG[featuredNews.category].icon}
                                                    {CATEGORY_CONFIG[featuredNews.category].label}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {formatDate(featuredNews.published_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {estimateReadTime(featuredNews.content)} dk okuma
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* News Grid */}
                        {regularNews.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {regularNews.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/sektor-haberleri/${item.slug || item.id}`}
                                        className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                    >
                                        {/* Image */}
                                        <div className="relative h-48 overflow-hidden">
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
                                            {item.category && CATEGORY_CONFIG[item.category] && (
                                                <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 ${CATEGORY_CONFIG[item.category].bgColor} ${CATEGORY_CONFIG[item.category].color} rounded-full text-xs font-semibold`}>
                                                    {CATEGORY_CONFIG[item.category].icon}
                                                    {CATEGORY_CONFIG[item.category].label}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            {/* Date */}
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                <Calendar size={12} />
                                                {formatDate(item.published_at)}
                                            </div>

                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                                                {item.title}
                                            </h3>

                                            {item.summary && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {item.summary}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NewsPage;
