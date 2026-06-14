import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Share2, Tag, Building2, TrendingUp } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { newsApi } from '../../services/api/news';
import { BlogContent } from '../../components/BlogContent';
import { FavoriteButton } from '../../components/FavoriteButton';
import type { NewsPost } from '../../types/database';
import { buildSeoTitle } from '../../data/pageSeo';

const NewsDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [news, setNews] = useState<NewsPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            loadNews();
        }
    }, [slug]);

    // Update page title, meta, OG tags, canonical, and JSON-LD for SEO
    useEffect(() => {
        if (news) {
            const pageTitle = buildSeoTitle(news.title, 'Katılım Uzmanı Haberler');
            const pageDesc = news.summary || news.title;
            const pageUrl = `https://katilimuzmani.com/sektor-haberleri/${news.slug || news.id}/`;
            const publishDate = news.published_at || news.created_at;

            // Title
            document.title = pageTitle;

            // Meta description
            let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
            if (metaDesc) { metaDesc.content = pageDesc; }
            else { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; metaDesc.content = pageDesc; document.head.appendChild(metaDesc); }

            // Canonical
            let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
            if (canonical) { canonical.href = pageUrl; }
            else { canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = pageUrl; document.head.appendChild(canonical); }

            // OG Tags
            const ogTags: Record<string, string> = {
                'og:title': pageTitle,
                'og:description': pageDesc,
                'og:url': pageUrl,
                'og:type': 'article',
                'og:image': news.cover_image_url || '',
                'article:published_time': publishDate,
            };
            Object.entries(ogTags).forEach(([prop, content]) => {
                if (!content) return;
                let tag = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
                if (tag) { tag.content = content; }
                else { tag = document.createElement('meta'); tag.setAttribute('property', prop); tag.content = content; document.head.appendChild(tag); }
            });

            // NewsArticle JSON-LD (critical for Google News)
            const jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'NewsArticle',
                'headline': news.title,
                'description': pageDesc,
                'url': pageUrl,
                'datePublished': publishDate,
                'dateModified': news.updated_at || publishDate,
                'image': news.cover_image_url ? [news.cover_image_url] : [],
                'author': {
                    '@type': 'Organization',
                    'name': 'Katılım Uzmanı',
                    'url': 'https://katilimuzmani.com'
                },
                'publisher': {
                    '@type': 'Organization',
                    'name': 'Katılım Uzmanı',
                    'url': 'https://katilimuzmani.com',
                    'logo': {
                        '@type': 'ImageObject',
                        'url': 'https://katilimuzmani.com/logo.png'
                    }
                },
                'mainEntityOfPage': {
                    '@type': 'WebPage',
                    '@id': pageUrl
                },
                'inLanguage': 'tr-TR',
            };

            // Remove old JSON-LD if exists
            const oldScript = document.querySelector('script[data-seo="news-jsonld"]');
            if (oldScript) oldScript.remove();

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo', 'news-jsonld');
            script.textContent = JSON.stringify(jsonLd);
            document.head.appendChild(script);
        }

        return () => {
            document.title = 'Katılım Uzmanı';
            // Clean up JSON-LD
            const script = document.querySelector('script[data-seo="news-jsonld"]');
            if (script) script.remove();
        };
    }, [news]);

    const loadNews = async () => {
        try {
            setLoading(true);

            // Try finding by slug first, then by id
            let query = supabase
                .from('news_posts')
                .select('*')
                .eq('status', 'published');

            // Check if slug looks like a UUID (id) or a regular slug
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug!);

            if (isUUID) {
                query = query.eq('id', slug);
            } else {
                query = query.eq('slug', slug);
            }

            const { data, error: fetchError } = await query.maybeSingle();

            if (fetchError) throw fetchError;

            if (!data) {
                setError('Haber bulunamadı');
            } else {
                setNews(data);

                // Increment view count in the background
                newsApi.incrementViewCount(data.id).catch(err => {
                    console.error('Failed to increment view count:', err);
                });
            }
        } catch (err: any) {
            console.error('Error loading news:', err);
            setError('Haber yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const dateStr = date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${dateStr} - ${timeStr}`;
    };

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share && news) {
            try {
                await navigator.share({
                    title: news.title,
                    text: news.summary || '',
                    url: url
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            await navigator.clipboard.writeText(url);
            alert('Bağlantı kopyalandı!');
        }
    };

    // Reading time estimate
    const getReadingTime = (content: string) => {
        const wordCount = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return `${minutes} dk okuma`;
    };

    // Category badge
    const getCategoryBadge = (category?: string) => {
        switch (category) {
            case 'COMPANY':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                        <Building2 size={14} /> Şirket Haberi
                    </span>
                );
            case 'REGULATION':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                        <TrendingUp size={14} /> Mevzuat
                    </span>
                );
            case 'SECTOR':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                        <TrendingUp size={14} /> Sektör
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !news) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📰</div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Haber Bulunamadı
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Aradığınız haber mevcut değil veya kaldırılmış olabilir.
                        </p>
                        <Link
                            to="/sektor-haberleri"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500"
                        >
                            <ArrowLeft size={20} />
                            Haberlere Dön
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header Image */}
            {news.cover_image_url && (
                <div className="relative h-[300px] md:h-[450px] bg-gray-900">
                    <img
                        src={news.cover_image_url}
                        alt={news.title}
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                    {/* Title overlay on hero */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                        <div className="container mx-auto max-w-4xl">
                            {getCategoryBadge(news.category)}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4 leading-tight">
                                {news.title}
                            </h1>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                {/* Back button */}
                <Link
                    to="/sektor-haberleri"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-6 focus:outline-none focus-visible:underline"
                >
                    <ArrowLeft size={20} />
                    Haberlere Dön
                </Link>

                <article className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 md:p-12">
                    {/* Title (if no cover image) */}
                    {!news.cover_image_url && (
                        <>
                            {getCategoryBadge(news.category)}
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 mt-4 leading-tight">
                                {news.title}
                            </h1>
                        </>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-red-500" />
                            {formatDateTime(news.published_at || news.created_at)}
                        </div>
                        {news.content && (
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-red-500" />
                                {getReadingTime(news.content)}
                            </div>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            <FavoriteButton itemType="news" itemId={news.id} size={18} />
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                                aria-label="Haberi paylaş"
                            >
                                <Share2 size={16} />
                                Paylaş
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    {news.summary && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium border-l-4 border-red-500 pl-4">
                            {news.summary}
                        </p>
                    )}

                    {/* Content */}
                    {news.content ? (
                        <BlogContent html={news.content} />
                    ) : (
                        <p className="text-gray-600 dark:text-gray-400">
                            {news.summary}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Yayınlanma: {formatDateTime(news.published_at || news.created_at)}
                            </div>
                        </div>

                        <Link
                            to="/sektor-haberleri"
                            className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
                        >
                            Diğer Haberleri Gör
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default NewsDetailPage;
