
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { homeContentApi } from '../src/services/api/homeContent';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

// Fallback FAQ data in case Supabase fetch fails
const fallbackFaqs: FAQItem[] = [
  {
    id: '1',
    question: "Evim sistemi nedir ve güvenilir midir?",
    answer: "Evim sistemleri (Tasarruf Finansmanı), faizsiz bir şekilde ev veya araç sahibi olmanızı sağlayan dayanışma temelli bir finansman modelidir. Bankacılık Düzenleme ve Denetleme Kurumu (BDDK) tarafından denetlenmekte olup, lisanslı şirketler tarafından yürütülmektedir.",
    order_index: 0
  },
  {
    id: '2',
    question: "Teslimat tarihi nasıl belirlenir?",
    answer: "Teslimat tarihi seçtiğiniz sisteme göre değişir. Çekilişli sistemde her ay noter huzurunda yapılan çekilişle belirlenir. Çekilişsiz sistemde ise genellikle toplam tutarın %40'ı veya belirli bir kısmı ödendiğinde teslimat garanti edilir.",
    order_index: 1
  },
  {
    id: '3',
    question: "Taksitleri ödemekte zorlanırsam ne olur?",
    answer: "Ödeme güçlüğü çektiğiniz durumlarda taksitlerinizi dondurabilir veya yeniden yapılandırabilirsiniz. Bu esneklik, faizsiz sistemlerin en büyük avantajlarından biridir.",
    order_index: 2
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<FAQItem[]>(fallbackFaqs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const data = await homeContentApi.getFAQs();
      if (data && data.length > 0) {
        setFaqs(data);
      }
    } catch (error) {
      console.error('Failed to load FAQs from Supabase:', error);
      // Keep fallback data on error
    } finally {
      setLoading(false);
    }
  };

  // Inject FAQ JSON-LD for Google rich results
  useEffect(() => {
    if (faqs.length === 0) return;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };

    const oldScript = document.querySelector('script[data-seo="faq-jsonld"]');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'faq-jsonld');
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const el = document.querySelector('script[data-seo="faq-jsonld"]');
      if (el) el.remove();
    };
  }, [faqs]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4 text-primary-600 dark:text-primary-400">
          <HelpCircle size={24} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sıkça Sorulan Sorular</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Sistem hakkında merak edilenler ve önemli detaylar.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={faq.id || index}
            className={`border rounded-xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-white dark:bg-slate-800 shadow-md ring-1 ring-primary-100 dark:ring-primary-900 border-gray-200 dark:border-slate-700' : 'bg-gray-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 border-gray-200 dark:border-slate-800'}`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
            >
              <span className={`font-semibold text-lg ${openIndex === index ? 'text-primary-800 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>
                {faq.question}
              </span>
              {openIndex === index ? <ChevronUp className="text-primary-500" /> : <ChevronDown className="text-gray-400" />}
            </button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="p-5 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-slate-700 mt-2">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
