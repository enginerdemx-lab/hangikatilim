import React, { useState, useEffect, useMemo } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronUp, Tag, MessageCircle, BookOpen } from 'lucide-react';
import { homeContentApi } from '../../services/api/homeContent';
import type { FAQItem } from '../../types/database';

// Kategori tanımları
const CATEGORY_MAP: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  genel: { label: 'Genel', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800/30' },
  sistem: { label: 'Sistem & Süreç', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800/30' },
  odeme: { label: 'Ödeme & Taksit', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800/30' },
  teslimat: { label: 'Teslimat & Çekiliş', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800/30' },
  guvenlik: { label: 'Güvenlik & Yasal', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800/30' },
};

const FAQPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const data = await homeContentApi.getFAQItems();
      setFaqs(data);
      // İlk soruyu otomatik aç
      if (data.length > 0) {
        setOpenIds(new Set([data[0].id]));
      }
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kategorileri FAQ verilerinden çıkar
  const categories = useMemo(() => {
    const cats = new Set<string>();
    faqs.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }, [faqs]);

  // Filtreleme
  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const matchesSearch = !searchTerm ||
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeCategory, searchTerm]);

  // Accordion toggle
  const toggleFaq = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Tümünü aç/kapa
  const toggleAll = () => {
    if (openIds.size === filteredFaqs.length) {
      setOpenIds(new Set());
    } else {
      setOpenIds(new Set(filteredFaqs.map(f => f.id)));
    }
  };

  const getCategoryInfo = (cat?: string) => {
    if (!cat || !CATEGORY_MAP[cat]) return CATEGORY_MAP['genel'];
    return CATEGORY_MAP[cat];
  };

  // SEO: JSON-LD
  useEffect(() => {
    if (filteredFaqs.length === 0) return;

    document.title = 'Sıkça Sorulan Sorular | Katılım Uzmanı';

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    const descText = 'Tasarruf finansmanı, evim sistemi, çekiliş ve taksit hakkında sıkça sorulan sorular ve cevapları.';
    if (metaDesc) { metaDesc.content = descText; }
    else { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; metaDesc.content = descText; document.head.appendChild(metaDesc); }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': filteredFaqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer,
        },
      })),
    };

    const oldScript = document.querySelector('script[data-seo="faq-page-jsonld"]');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'faq-page-jsonld');
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      document.title = 'Katılım Uzmanı';
      const el = document.querySelector('script[data-seo="faq-page-jsonld"]');
      if (el) el.remove();
    };
  }, [filteredFaqs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-10 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-5 text-primary-600 dark:text-primary-400">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Tasarruf finansmanı hakkında merak ettiğiniz her şey. Aradığınızı bulamadıysanız bize ulaşın.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Soru veya anahtar kelime ara..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-medium"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Category Filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              Tümü ({faqs.length})
            </button>
            {categories.map(cat => {
              const info = getCategoryInfo(cat);
              const count = faqs.filter(f => f.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    activeCategory === cat
                      ? `${info.bgColor} ${info.color} ${info.borderColor}`
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {info.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Toggle All + Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredFaqs.length} soru {searchTerm && `"${searchTerm}" için`}
          </p>
          {filteredFaqs.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors"
            >
              {openIds.size === filteredFaqs.length ? 'Tümünü Kapat' : 'Tümünü Aç'}
            </button>
          )}
        </div>

        {/* FAQ List */}
        {filteredFaqs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-12 text-center">
            <Search size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Sonuç Bulunamadı</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aramanızla eşleşen soru bulunamadı. Farklı bir anahtar kelime deneyin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isOpen = openIds.has(faq.id);
              const catInfo = getCategoryInfo(faq.category);

              return (
                <div
                  key={faq.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden transition-all duration-200 ${
                    isOpen
                      ? 'border-primary-200 dark:border-primary-800/40 shadow-md ring-1 ring-primary-100 dark:ring-primary-900/30'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm'
                  }`}
                >
                  {/* Question */}
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-start gap-4 p-5 text-left focus:outline-none group"
                  >
                    {/* Number/Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-slate-900 text-gray-400 dark:text-slate-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-500'
                    }`}>
                      <MessageCircle size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {faq.category && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${catInfo.bgColor} ${catInfo.color} ${catInfo.borderColor}`}>
                            {catInfo.label}
                          </span>
                        )}
                      </div>
                      <h3 className={`font-semibold text-base leading-snug transition-colors ${
                        isOpen ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {faq.question}
                      </h3>
                    </div>

                    <div className={`flex-shrink-0 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown size={20} className={isOpen ? 'text-primary-500' : 'text-gray-400'} />
                    </div>
                  </button>

                  {/* Answer */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5 pl-[76px]">
                      <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-100 dark:border-primary-800/30 rounded-2xl p-8 text-center">
          <BookOpen size={32} className="text-primary-600 dark:text-primary-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Aradığınızı bulamadınız mı?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">
            Sorularınız için bizimle iletişime geçebilirsiniz. En kısa sürede yanıt vereceğiz.
          </p>
          <a
            href="/iletisim"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            Bize Ulaşın
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
