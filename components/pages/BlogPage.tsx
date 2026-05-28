import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, BookOpen, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import { blogApi } from '../../src/services/api/blog';
import emailService from '../../src/services/api/emailService';
import type { BlogPost } from '../../src/types/database';

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterLoading(true);
    setNewsletterResult(null);

    try {
      const result = await emailService.subscribeNewsletter(newsletterEmail);
      if (result.success) {
        setNewsletterResult({ success: true, message: result.message || 'Basariyla abone oldunuz!' });
        setNewsletterEmail('');
      } else {
        setNewsletterResult({ success: false, message: result.error || 'Bir hata olustu' });
      }
    } catch (error) {
      setNewsletterResult({ success: false, message: 'Bir hata olustu' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await blogApi.getActivePosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
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

  const getReadTime = (content: string) => {
    const wordCount = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const getPostUrl = (post: BlogPost) => {
    return `/blog/${post.slug || post.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Yazilar yukleniyor...</p>
        </div>
      </div>
    );
  }

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pt-16 pb-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        </div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-xs font-semibold uppercase tracking-wider mb-6">
              <BookOpen size={14} />
              Blog & Rehber
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
              Finans <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Rehberi</span>
            </h1>
            <p className="text-blue-200/70 max-w-2xl mx-auto text-lg leading-relaxed">
              Tasarruf finansmani, katilim bankaciligi ve yatirim hakkinda guncel bilgiler, uzman gorusleri ve pratik rehberler.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl -mt-8 relative z-20">

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henuz yazi yok</h2>
            <p className="text-gray-500 dark:text-gray-400">Blog yazilari yakinda burada olacak.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Link
                to={getPostUrl(featuredPost)}
                className="group block mb-12"
                aria-label={`${featuredPost.title} yazisini oku`}
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-2xl transition-all duration-500">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="relative h-64 md:h-[420px] overflow-hidden">
                      {featuredPost.cover_image_url ? (
                        <img
                          src={featuredPost.cover_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center">
                          <BookOpen size={64} className="text-white/30" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg">
                          One Cikan
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-5">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-blue-500" />
                          {formatDate(featuredPost.published_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-blue-500" />
                          {getReadTime(featuredPost.content || '')} dk okuma
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {featuredPost.title}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-6 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            {featuredPost.author?.charAt(0).toUpperCase() || 'K'}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white block">{featuredPost.author}</span>
                            <span className="text-xs text-gray-500">Yazar</span>
                          </div>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                          Devamini Oku <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}




            {/* Section Title */}
            {otherPosts.length > 0 && (
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tum Yazilar</h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{otherPosts.length} yazi</span>
              </div>
            )}

            {/* Articles Grid - Magazine Style */}
            {otherPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {otherPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    to={getPostUrl(post)}
                    className={`group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full ${index === 0 && otherPosts.length > 2 ? 'md:col-span-2 md:flex-row' : ''}`}
                    aria-label={`${post.title} yazisini oku`}
                  >
                    {/* Image */}
                    <div className={`overflow-hidden relative ${index === 0 && otherPosts.length > 2 ? 'md:w-1/2 h-56 md:h-auto' : 'h-52'}`}>
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center min-h-[200px]">
                          <BookOpen size={40} className="text-white/30" />
                        </div>
                      )}
                      {/* Reading time badge */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                        <Clock size={10} />
                        {getReadTime(post.content || '')} dk
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`p-5 flex flex-col flex-1 ${index === 0 && otherPosts.length > 2 ? 'md:w-1/2 md:p-8 md:justify-center' : ''}`}>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-blue-500" />
                          {formatDate(post.published_at)}
                        </span>
                      </div>
                      <h3 className={`font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug ${index === 0 && otherPosts.length > 2 ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className={`text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow leading-relaxed ${index === 0 && otherPosts.length > 2 ? 'line-clamp-4' : 'line-clamp-2'}`}>
                          {post.excerpt}
                        </p>
                      )}
                      <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {post.author?.charAt(0).toUpperCase() || 'K'}
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{post.author}</span>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                          Oku <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Newsletter */}
        <div className="mb-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
          </div>

          <div className="relative z-10 max-w-xl mx-auto">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Send size={24} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">E-Bultenimize Abone Olun</h2>
            <p className="text-blue-200/80 mb-8 text-sm">
              Yeni yazilar, kampanyalar ve firsatlardan haberdar olun.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                required
                className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm text-sm"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="bg-white text-blue-700 hover:bg-blue-50 disabled:bg-gray-300 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                {newsletterLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Abone Ol
                  </>
                )}
              </button>
            </form>
            {newsletterResult && (
              <div className={`mt-4 flex items-center justify-center gap-2 text-sm ${newsletterResult.success ? 'text-green-300' : 'text-red-300'}`}>
                {newsletterResult.success && <CheckCircle className="w-4 h-4" />}
                {newsletterResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
