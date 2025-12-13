
import React from 'react';
import { Calculator, Wallet, Key, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <Calculator size={32} />,
      title: "Planını Oluştur",
      description: "Bütçene uygun tutarı ve taksit miktarını belirle. Peşinatlı veya peşinatsız seçeneklerden dilediğini seç.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      icon: <Wallet size={32} />,
      title: "Tasarrufa Başla",
      description: "Belirlediğin taksitleri faizsiz olarak her ay öde. Ödemelerin her kuruşu kendi evin veya aracın için birikir.",
      color: "text-gold-500",
      bg: "bg-gold-50 dark:bg-gold-900/20"
    },
    {
      icon: <Key size={32} />,
      title: "Teslimatını Al",
      description: "Belirlenen tarihte veya yapılan çekilişte sıran geldiğinde, biriken paranı ve finansman tutarını teslim al.",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20"
    }
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Sistem Nasıl İşliyor?</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Hayalinizdeki eve veya arabaya ulaşmak Evim Sistemleri ile sadece 3 adım.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Connecting Line (Visible on Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-gold-200 to-gray-200 dark:from-slate-700 dark:via-gold-900/50 dark:to-slate-700 z-0"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center text-center group">
              <div className={`w-24 h-24 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-6 shadow-lg shadow-gray-200/50 dark:shadow-none transition-transform duration-300 group-hover:scale-110 border border-white dark:border-slate-700`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {index + 1}. {step.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
                {step.description}
              </p>
              
              {index < steps.length - 1 && (
                <div className="md:hidden mt-6 text-gray-300 dark:text-slate-700">
                  <ArrowRight size={24} className="rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
