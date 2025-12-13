
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Evim sistemi nedir ve güvenilir midir?",
      answer: "Evim sistemleri (Tasarruf Finansmanı), faizsiz bir şekilde ev veya araç sahibi olmanızı sağlayan dayanışma temelli bir finansman modelidir. Bankacılık Düzenleme ve Denetleme Kurumu (BDDK) tarafından denetlenmekte olup, lisanslı şirketler tarafından yürütülmektedir."
    },
    {
      question: "Teslimat tarihi nasıl belirlenir?",
      answer: "Teslimat tarihi seçtiğiniz sisteme göre değişir. Çekilişli sistemde her ay noter huzurunda yapılan çekilişle belirlenir. Çekilişsiz sistemde ise genellikle toplam tutarın %40'ı veya belirli bir kısmı ödendiğinde teslimat garanti edilir."
    },
    {
      question: "Taksitleri ödemekte zorlanırsam ne olur?",
      answer: "Ödeme güçlüğü çektiğiniz durumlarda taksitlerinizi dondurabilir veya yeniden yapılandırabilirsiniz. Bu esneklik, faizsiz sistemlerin en büyük avantajlarından biridir. Dondurulan aylar kadar teslimat süresi de ötelenir."
    },
    {
      question: "Sistemden istediğim zaman ayrılabilir miyim?",
      answer: "Evet, sistemden istediğiniz zaman ayrılma hakkınız bulunmaktadır. Ayrılmanız durumunda ödediğiniz taksit tutarları (organizasyon bedeli hariç) yasal süre içerisinde size iade edilir."
    },
    {
      question: "Organizasyon ücreti nedir?",
      answer: "Sistemin organizasyonunu sağlayan şirketin hizmet bedelidir. Bu bedel finansman tutarına, vadeye ve kampanya koşullarına göre değişir ve sisteme girişte veya taksitlendirilerek tahsil edilir."
    }
  ];

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
            key={index} 
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
