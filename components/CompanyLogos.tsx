
import React from 'react';
import { ExternalLink, ShieldCheck, Building2 } from 'lucide-react';

export const CompanyLogos: React.FC = () => {
  const companies = [
    { name: "EMİNEVİM TASARRUF FİNANSMAN A.Ş.", url: "https://www.eminevim.com", logo: "https://hangikatilim.com/images/1-eminevim.png" },
    { name: "FUZUL TASARRUF FİNANSMAN A.Ş.", url: "https://www.fuzul.com.tr", logo: "https://hangikatilim.com/images/2-fzlev.png" },
    { name: "EMLAK KATILIM TASARRUF FİNANSMAN A.Ş.", url: "https://www.emlakkatilim.com.tr", logo: "https://hangikatilim.com/images/3-emlak.png" },
    { name: "KATILIMEVİM TASARRUF FİNANSMAN A.Ş.", url: "https://www.katilimevim.com.tr", logo: "https://hangikatilim.com/images/4-katilimevim.png" },
    { name: "SİNPAŞ YAPI TASARRUF SANDIĞI A.Ş.", url: "https://www.sinpasyts.com/?utm_source=adwords&utm_campaign=searchtextev|gorselyok|duyarlimetin|offeryok|turkiye|search|brandinghgp|ev&utm_medium=search", logo: "https://hangikatilim.com/images/5-simpas.png" },
    { name: "BİREVİM TASARRUF FİNANSMAN A.Ş.", url: "https://www.birevim.com", logo: "https://hangikatilim.com/images/6-birevim.png" },
    { name: "İMECE TASARRUF FİNANSMAN A.Ş.", url: "https://www.imecetasarruf.com", logo: "https://hangikatilim.com/images/7-imece.png" },
    { name: "ALBAYRAK TASARRUF FİNANSMAN A.Ş.", url: "https://www.albayrak.com.tr", logo: "https://hangikatilim.com/images/8-albayrak.png" },
    { name: "İYİ FİNANS TASARRUF FİNANSMAN A.Ş.", url: "https://iyifinans.com.tr/", logo: "https://hangikatilim.com/images/9-iyifinans.png" }
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-850 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={14} />
            Devlet Denetiminde
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">BDDK Lisanslı Tasarruf Finansman Şirketleri</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto text-sm">
            Aşağıdaki kuruluşlar Bankacılık Düzenleme ve Denetleme Kurumu (BDDK) tarafından lisanslanmış ve denetlenmektedir.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {companies.map((company, index) => (
            <a 
              key={index}
              href={company.url}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-gold-400 dark:hover:border-gold-500 hover:shadow-lg hover:shadow-gold-500/5 hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-32"
            >
              {company.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="max-h-12 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 dark:brightness-0 dark:invert dark:opacity-70 dark:group-hover:opacity-100" 
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                   <Building2 className="text-gray-400 group-hover:text-primary-600 transition-colors" size={24} />
                   <span className="font-bold text-gray-800 dark:text-gray-200 text-xs leading-relaxed group-hover:text-primary-800 dark:group-hover:text-primary-300 transition-colors line-clamp-2">
                    {company.name.split(' ')[0]}
                  </span>
                </div>
              )}
              
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-2">
                Web Sitesi <ExternalLink size={10} />
              </span>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a 
            href="https://www.bddk.org.tr/Kurulus/Liste/89" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Resmi BDDK Listesini Görüntüle
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </section>
  );
};
