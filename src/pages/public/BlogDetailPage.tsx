import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, Tag, Clock } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import type { BlogPost } from '../../types/database';

const BlogDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            loadPost();
        }
    }, [slug]);

    // Update page title for SEO
    useEffect(() => {
        if (post) {
            document.title = `${post.title} | Hangi Katılım Blog`;

            // Update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', post.excerpt || post.title);
            } else {
                const meta = document.createElement('meta');
                meta.name = 'description';
                meta.content = post.excerpt || post.title;
                document.head.appendChild(meta);
            }
        }

        return () => {
            document.title = 'Hangi Katılım';
        };
    }, [post]);

    const loadPost = async () => {
        try {
            setLoading(true);

            // Try finding by slug first, then by id
            let query = supabase
                .from('blog_posts')
                .select('*')
                .eq('is_active', true);

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
                setError('Blog yazısı bulunamadı');
            } else {
                setPost(data);
            }
        } catch (err: any) {
            console.error('Error loading blog post:', err);
            setError('Blog yazısı yüklenirken bir hata oluştu');
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

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share && post) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.excerpt || '',
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

    // Reading time estimate (approx 200 words per minute)
    const getReadingTime = (content: string) => {
        const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const minutes = Math.ceil(wordCount / 200);
        return `${minutes} dk okuma`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📝</div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            İçerik Bulunamadı
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Aradığınız blog yazısı mevcut değil veya kaldırılmış olabilir.
                        </p>
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                        >
                            <ArrowLeft size={20} />
                            Blog'a Dön
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header Image */}
            {post.cover_image_url && (
                <div className="relative h-[300px] md:h-[400px] bg-gray-900">
                    <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                {/* Back button */}
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6 focus:outline-none focus-visible:underline"
                >
                    <ArrowLeft size={20} />
                    Blog'a Dön
                </Link>

                <article className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 md:p-12">
                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary-500" />
                            {formatDate(post.published_at)}
                        </div>
                        {post.author && (
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-primary-500" />
                                {post.author}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary-500" />
                            {getReadingTime(post.content)}
                        </div>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                            aria-label="Yazıyı paylaş"
                        >
                            <Share2 size={16} />
                            Paylaş
                        </button>
                    </div>

                    {/* Excerpt */}
                    {post.excerpt && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed font-medium border-l-4 border-primary-500 pl-4">
                            {post.excerpt}
                        </p>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none
                            prose-headings:text-gray-900 dark:prose-headings:text-white
                            prose-p:text-gray-600 dark:prose-p:text-gray-300
                            prose-a:text-primary-600 dark:prose-a:text-primary-400
                            prose-strong:text-gray-900 dark:prose-strong:text-white
                            prose-img:rounded-xl prose-img:shadow-lg"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                                <User size={24} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{post.author}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Yazar</p>
                            </div>
                        </div>

                        <Link
                            to="/blog"
                            className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
                        >
                            Diğer Yazıları Keşfet
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default BlogDetailPage;
