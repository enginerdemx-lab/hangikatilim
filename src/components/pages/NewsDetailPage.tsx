import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Tag, Share2, ArrowLeft, Building2, TrendingUp } from 'lucide-react';
import { newsApi } from '../../src/services/api/news';
import type { NewsPost } from '../../src/types/database';

export const NewsDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [news, setNews] = useState<NewsPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNewsDetail() {
            if (!id) return;

            try {
                setLoading(true);
                const data = await newsApi.getNewsById(id);
                setNews(data);
                setError(null);
            } catch (err) {
                console.error('Haber yüklenemedi:', err);
                setError('Haber bulunamadı');
            } finally {
                setLoading(false);
            }
        }
        fetchNewsDetail();
    }, [id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getPlaceholderImage = (category: string) => {
        const images = {
            COMPANY: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80',
            REGULATION: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&q=80',
            SECTOR: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1600&q=80'
        };
        return images[category as keyof typeof images] || images.SECTOR;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Haber yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !news) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Haber bulunamadı'}</p>
                    <button
                        onClick={() => navigate('/news')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Haberlere Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 animate-fade-in">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Geri Dön</span>
                </button>

                {/* Hero Image */}
                <div className="relative h-[400px] rounded-3xl overflow-hidden mb-8">
                    <img
                        src={news.cover_image_url || getPlaceholderImage(news.category || 'SECTOR')}
                        alt={news.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                </div>

                {/* Article Header */}
                <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 md:p-12">
                    {/* Category Badge */}
                    <div className="flex items-center gap-3 mb-6">
                        {news.category === 'COMPANY' && (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 flex items-center gap-1">
                                <Building2 size={12} /> Şirket Haberi
                            </span>
                        )}
                        {news.category === 'REGULATION' && (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                                <TrendingUp size={12} /> Mevzuat
                            </span>
                        )}
                        {news.category === 'SECTOR' && (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                                <TrendingUp size={12} /> Sektör
                            </span>
                        )}
                        {news.is_featured && (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                ⭐ Manşet
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                        {news.title}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            {formatDate(news.published_at || news.created_at)}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            3 dk okuma
                        </div>
                        <button className="flex items-center gap-2 ml-auto hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <Share2 size={16} />
                            Paylaş
                        </button>
                    </div>

                    {/* Summary */}
                    {news.summary && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
                            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                {news.summary}
                            </p>
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: news.content || '' }}
                    />

                    {/* Tags */}
                    {news.category && (
                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Tag size={16} />
                                <span className="font-medium">Etiketler:</span>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-xs font-medium">
                                    {news.category}
                                </span>
                            </div>
                        </div>
                    )}
                </article>

                {/* Back to News Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-colors font-medium"
                    >
                        <ArrowLeft size={20} />
                        Tüm Haberlere Dön
                    </button>
                </div>

            </div>
        </div>
    );
};
