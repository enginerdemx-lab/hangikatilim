import React, { useEffect, useState } from 'react';
import { Calendar, User, ArrowRight, TrendingUp, BookOpen } from 'lucide-react';
import { blogApi } from '../../src/services/api/blog';
import type { BlogPost } from '../../src/types/database';

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 animate-fade-in">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen size={14} />
            Kurumsal Blog
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Finans ve Yaşam Blogu</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            Sektörden haberler, finansal ipuçları ve uzman görüşleriyle geleceğinizi planlarken yanınızdayız.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Henüz blog yazısı yayınlanmamış.
          </div>
        ) : (
          <>
            {/* Featured Post (First one) */}
            {featuredPost && (
              <div className="mb-16">
                <div className="group relative rounded-3xl overflow-hidden shadow-2xl h-[400px] md:h-[500px]">
                  {featuredPost.cover_image_url ? (
                    <>
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${featuredPost.cover_image_url})` }}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600"></div>
                  )}

                  <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-4xl">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-gray-200 text-lg mb-6 line-clamp-2 md:line-clamp-none">
                        {featuredPost.excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-300 font-medium">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gold-500" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gold-500" />
                        {formatDate(featuredPost.published_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {otherPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherPosts.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all group flex flex-col h-full">
                    <div className="h-56 overflow-hidden relative">
                      {post.cover_image_url ? (
                        <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.published_at)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between mt-auto">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <User size={12} /> {post.author}
                        </span>
                        <button className="text-primary-600 dark:text-primary-400 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                          Oku <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Newsletter */}
        <div className="mt-20 bg-primary-900 dark:bg-slate-950 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500 rounded-full blur-3xl opacity-20 -ml-20 -mb-20"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Ekonomi Bültenine Abone Olun</h2>
            <p className="text-primary-200 mb-8">
              Sektörel gelişmeler, kampanya haberleri ve finansal analizler her hafta e-posta kutunuzda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="email" placeholder="E-posta adresiniz" className="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-gold-500" />
              <button className="bg-gold-500 hover:bg-gold-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-gold-500/20 transition-all">
                Abone Ol
              </button>
            </div>
            <p className="text-xs text-primary-300/60 mt-4">
              Spam yok, dilediğiniz zaman ayrılabilirsiniz.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
