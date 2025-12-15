import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Building2, TrendingUp, Tag, Share2, Newspaper } from 'lucide-react';
import { newsApi } from '../../src/services/api/news';
import type { NewsPost } from '../../src/types/database';

export const NewsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COMPANY' | 'REGULATION'>('ALL');
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        const data = await newsApi.getPublishedNews();
        setNews(data);
        setError(null);
      } catch (err) {
        console.error('Haberler yüklenemedi:', err);
        setError('Haberler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  // Generate URL: prefer slug, fallback to id
  const getNewsUrl = (item: NewsPost) => {
    return `/sektor-haberleri/${item.slug || item.id}`;
  };

  // Featured news: is_featured olanı al, yoksa en yeni haber
  const featuredNews = news.find(n => n.is_featured) || news[0];

  // Diğer haberler (featured hariç)
  const otherNews = news.filter(n => n.id !== featuredNews?.id);

  // Filtreleme
  const filteredNews = activeFilter === 'ALL'
    ? otherNews
    : otherNews.filter(n => n.category === activeFilter);

  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Placeholder image
  const getPlaceholderImage = (category: string) => {
    const images = {
      COMPANY: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      REGULATION: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
      SECTOR: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80'
    };
    return images[category as keyof typeof images] || images.SECTOR;
  };

  // Share handler
  const handleShare = async (e: React.MouseEvent, item: NewsPost) => {
    e.preventDefault();
    e.stopPropagation();

    const url = window.location.origin + getNewsUrl(item);

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.summary || '',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Haberler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 flex items-center justify-center">
        <div className="text-center">
          <Newspaper size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Henüz yayınlanmış haber bulunmuyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 animate-fade-in">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Newspaper size={14} />
              Basında Sektör
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Sektör Haberleri</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
              Katılım firmalarından son gelişmeler, şirket haberleri ve yasal düzenlemeler.
            </p>
          </div>

          {/* Filters */}
          <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === 'ALL' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              Tümü
            </button>
            <button
              onClick={() => setActiveFilter('COMPANY')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeFilter === 'COMPANY' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <Building2 size={16} /> Şirket Haberleri
            </button>
            <button
              onClick={() => setActiveFilter('REGULATION')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeFilter === 'REGULATION' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <TrendingUp size={16} /> Mevzuat
            </button>
          </div>
        </div>

        {/* Featured News (Hero) */}
        {activeFilter === 'ALL' && featuredNews && (
          <Link
            to={getNewsUrl(featuredNews)}
            className="group relative rounded-3xl overflow-hidden shadow-2xl h-[400px] md:h-[500px] mb-12 block focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            aria-label={`${featuredNews.title} haberini oku`}
          >
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${featuredNews.cover_image_url || getPlaceholderImage(featuredNews.category || 'SECTOR')})` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90"></div>

            <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-4xl z-10">
              <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase mb-4 inline-block shadow-lg">
                Manşet
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-red-200 transition-colors">
                {featuredNews.title}
              </h2>
              <p className="text-gray-200 text-lg mb-6 line-clamp-2 md:line-clamp-none max-w-3xl">
                {featuredNews.summary}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-300 font-medium">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-red-400" />
                  {featuredNews.category}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-red-400" />
                  {formatDate(featuredNews.published_at || featuredNews.created_at)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-red-400" />
                  3 dk okuma
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredNews.map((item) => (
            <Link
              key={item.id}
              to={getNewsUrl(item)}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label={`${item.title} haberini oku`}
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute top-4 left-4 z-10">
                  {item.category === 'COMPANY' && (
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-white dark:bg-slate-900 shadow-sm flex items-center gap-1">
                      <Building2 size={10} /> Şirket
                    </span>
                  )}
                  {item.category === 'REGULATION' && (
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-red-500 text-white shadow-sm flex items-center gap-1">
                      <TrendingUp size={10} /> BDDK
                    </span>
                  )}
                  {item.category === 'SECTOR' && (
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-500 text-white shadow-sm flex items-center gap-1">
                      <TrendingUp size={10} /> Sektör
                    </span>
                  )}
                </div>
                <img
                  src={item.cover_image_url || getPlaceholderImage(item.category || 'SECTOR')}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <Calendar size={12} />
                  {formatDate(item.published_at || item.created_at)}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 mb-6 flex-grow">
                  {item.summary}
                </p>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between mt-auto">
                  <span className="text-primary-600 dark:text-primary-400 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                    Haberi Oku <ArrowRight size={14} />
                  </span>
                  <button
                    onClick={(e) => handleShare(e, item)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Haberi paylaş"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};
