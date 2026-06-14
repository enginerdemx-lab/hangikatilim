import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, BookOpen, Clock, Send, CheckCircle, Loader2, LayoutGrid, List } from 'lucide-react';
import { blogApi, blogCategoryApi } from '../../src/services/api/blog';
import emailService from '../../src/services/api/emailService';
import type { BlogPost } from '../../src/types/database';

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'newest' | 'popular'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      const [data, cats] = await Promise.all([
        blogApi.getActivePosts(),
        blogCategoryApi.getNames(),
      ]);
      setPosts(data);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const getReadTime = (content: string) => {
    const wordCount = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  const getPostUrl = (post: BlogPost) => `/blog/${post.slug || post.id}`;

  // Derived data
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of categories) counts[c] = 0;
    for (const p of posts) {
      if (p.category && counts[p.category] !== undefined) counts[p.category]++;
    }
    return counts;
  }, [posts, categories]);

  const filtered = useMemo(
    () => (selectedCategory === 'all' ? posts : posts.filter((p) => p.category === selectedCategory)),
    [posts, selectedCategory]
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortMode === 'popular') {
      arr.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    } else {
      arr.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    }
    return arr;
  }, [filtered, sortMode]);

  const featuredPost = sorted[0];
  const gridPosts = sorted.slice(1);

  const popularPosts = useMemo(
    () => [...posts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 4),
    [posts]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Yazilar yukleniyor...</p>
        </div>
      </div>
    );
  }

  const categoryList = [
    { label: 'Tümü', value: 'all', count: posts.length },
    ...categories.map((c) => ({ label: c, value: c, count: categoryCounts[c] })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header — sade, ince mavi çizgi vurgusu */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-7xl py-10 md:py-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Blog</h1>
          <span className="block h-0.5 w-12 bg-primary-600 mt-3 mb-4 rounded-full"></span>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Tasarruf finansman hakkında güncel bilgiler, uzman görüşleri ve pratik rehberler.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-10">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henuz yazi yok</h2>
            <p className="text-gray-500 dark:text-gray-400">Blog yazilari yakinda burada olacak.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN COLUMN */}
            <div className="lg:col-span-2 space-y-10">
              {/* Öne Çıkan Yazı */}
              {featuredPost && (
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="h-4 w-0.5 bg-primary-600 rounded-full"></span>
                    Öne Çıkan Yazı
                  </h2>
                  <Link
                    to={getPostUrl(featuredPost)}
                    className="group block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:border-primary-300 hover:shadow-lg transition-all"
                    aria-label={`${featuredPost.title} yazisini oku`}
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="relative h-56 md:h-full md:min-h-[260px] overflow-hidden">
                        {featuredPost.cover_image_url ? (
                          <img
                            src={featuredPost.cover_image_url}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center min-h-[220px]">
                            <BookOpen size={48} className="text-gray-300 dark:text-slate-500" />
                          </div>
                        )}
                        <span className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm">
                          Öne Çıkan
                        </span>
                      </div>

                      <div className="p-6 md:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          {featuredPost.category && (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600">
                              {featuredPost.category}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} /> {getReadTime(featuredPost.content || '')} dk okuma
                          </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                          {featuredPost.title}
                        </h3>
                        {featuredPost.excerpt && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-5 line-clamp-3">
                            {featuredPost.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-bold">
                              {featuredPost.author?.charAt(0).toUpperCase() || 'K'}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white block leading-tight">{featuredPost.author}</span>
                              <span className="text-xs text-gray-400">Yazar</span>
                            </div>
                          </div>
                          <span className="text-primary-600 font-semibold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                            Devamını Oku <ArrowRight size={15} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </section>
              )}

              {/* Tüm Yazılar */}
              <section>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="h-4 w-0.5 bg-primary-600 rounded-full"></span>
                    Tüm Yazılar
                    <span className="text-xs font-normal text-gray-400">({gridPosts.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as 'newest' | 'popular')}
                      className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                    >
                      <option value="newest">En Yeni</option>
                      <option value="popular">Popüler</option>
                    </select>
                    <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-2 transition ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600 dark:bg-slate-700' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                        title="Izgara görünüm"
                        aria-label="Izgara görünüm"
                      >
                        <LayoutGrid size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`p-2 transition ${viewMode === 'list' ? 'bg-primary-50 text-primary-600 dark:bg-slate-700' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                        title="Liste görünüm"
                        aria-label="Liste görünüm"
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {gridPosts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Bu kategoride başka yazı bulunmuyor.
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {gridPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={getPostUrl(post)}
                        className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:border-primary-300 hover:shadow-lg transition-all"
                        aria-label={`${post.title} yazisini oku`}
                      >
                        <div className="relative h-44 overflow-hidden">
                          {post.cover_image_url ? (
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                              <BookOpen size={36} className="text-gray-300 dark:text-slate-500" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                            <Clock size={10} /> {getReadTime(post.content || '')} dk
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          {post.category && (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 mb-2">{post.category}</span>
                          )}
                          <h3 className="font-bold text-gray-900 dark:text-white leading-snug mb-2 line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">{post.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700 mt-auto text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(post.published_at)}</span>
                            <span className="text-primary-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Oku <ArrowRight size={13} /></span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gridPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={getPostUrl(post)}
                        className="group flex gap-4 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 hover:border-primary-300 hover:shadow-lg transition-all"
                        aria-label={`${post.title} yazisini oku`}
                      >
                        <div className="relative w-32 sm:w-48 shrink-0 overflow-hidden">
                          {post.cover_image_url ? (
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[120px] bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                              <BookOpen size={28} className="text-gray-300 dark:text-slate-500" />
                            </div>
                          )}
                        </div>
                        <div className="py-4 pr-5 flex flex-col flex-1 min-w-0">
                          {post.category && (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600 mb-1.5">{post.category}</span>
                          )}
                          <h3 className="font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5 mb-3 flex-1">{post.excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 mt-auto text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(post.published_at)}</span>
                            <span className="flex items-center gap-1.5"><Clock size={12} /> {getReadTime(post.content || '')} dk</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              {/* Kategoriler */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="h-4 w-0.5 bg-primary-600 rounded-full"></span>
                  Kategoriler
                </h3>
                <ul className="space-y-1">
                  {categoryList.map((cat) => {
                    const active = selectedCategory === cat.value;
                    return (
                      <li key={cat.value}>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(cat.value)}
                          className={`w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2 rounded-lg text-sm border-l-2 transition ${active
                            ? 'border-primary-600 bg-primary-50/70 dark:bg-slate-700/50 text-primary-700 dark:text-primary-300 font-semibold'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/40'}`}
                        >
                          <span className="truncate">{cat.label}</span>
                          <span className={`text-xs ${active ? 'text-primary-600' : 'text-gray-400'}`}>{cat.count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Popüler Yazılar */}
              {popularPosts.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="h-4 w-0.5 bg-primary-600 rounded-full"></span>
                    Popüler Yazılar
                  </h3>
                  <ul className="space-y-4">
                    {popularPosts.map((post) => (
                      <li key={post.id}>
                        <Link to={getPostUrl(post)} className="group flex gap-3 items-center">
                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                            {post.cover_image_url ? (
                              <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen size={18} className="text-gray-300 dark:text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                              {post.title}
                            </h4>
                            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Clock size={10} /> {getReadTime(post.content || '')} dk okuma
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Newsletter — sade kart, ince mavi üst çizgi */}
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 border-t-2 border-t-primary-600 p-8 md:p-10 text-center">
          <div className="max-w-xl mx-auto">
            <div className="w-12 h-12 bg-primary-50 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Send size={20} className="text-primary-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">E-Bültenimize Abone Olun</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              Yeni yazilar, kampanyalar ve firsatlardan haberdar olun.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                required
                className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 text-sm"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300 font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
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
              <div className={`mt-4 flex items-center justify-center gap-2 text-sm ${newsletterResult.success ? 'text-green-600' : 'text-red-500'}`}>
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
