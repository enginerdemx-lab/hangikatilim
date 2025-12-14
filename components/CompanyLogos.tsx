
import React, { useState, useEffect } from 'react';
import { ExternalLink, ShieldCheck, Building2 } from 'lucide-react';
import { homeContentApi } from '../src/services/api/homeContent';

interface CompanyLogo {
  id: string;
  company_name: string;
  logo_url: string;
  order_index: number;
}

// Fallback data in case Supabase fetch fails
const fallbackCompanies: CompanyLogo[] = [
  { id: '1', company_name: "EMİNEVİM TASARRUF", logo_url: "https://hangikatilim.com/images/1-eminevim.png", order_index: 0 },
  { id: '2', company_name: "FUZUL TASARRUF", logo_url: "https://hangikatilim.com/images/2-fzlev.png", order_index: 1 },
  { id: '3', company_name: "EMLAK KATILIM", logo_url: "https://hangikatilim.com/images/3-emlak.png", order_index: 2 },
  { id: '4', company_name: "KATILIMEVİM", logo_url: "https://hangikatilim.com/images/4-katilimevim.png", order_index: 3 },
  { id: '5', company_name: "SİNPAŞ YAPI", logo_url: "https://hangikatilim.com/images/5-simpas.png", order_index: 4 },
  { id: '6', company_name: "BİREVİM", logo_url: "https://hangikatilim.com/images/6-birevim.png", order_index: 5 },
  { id: '7', company_name: "İMECE", logo_url: "https://hangikatilim.com/images/7-imece.png", order_index: 6 },
  { id: '8', company_name: "ALBAYRAK", logo_url: "https://hangikatilim.com/images/8-albayrak.png", order_index: 7 },
  { id: '9', company_name: "İYİ FİNANS", logo_url: "https://hangikatilim.com/images/9-iyifinans.png", order_index: 8 }
];

export const CompanyLogos: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyLogo[]>(fallbackCompanies);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await homeContentApi.getCompanyLogos();
      if (data && data.length > 0) {
        setCompanies(data);
      }
    } catch (error) {
      console.error('Failed to load company logos from Supabase:', error);
      // Keep fallback data on error
    } finally {
      setLoading(false);
    }
  };

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

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {companies.map((company, index) => (
              <div
                key={company.id || index}
                className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-gold-400 dark:hover:border-gold-500 hover:shadow-lg hover:shadow-gold-500/5 hover:-translate-y-1 transition-all duration-300 group h-32"
              >
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.company_name}
                    className="max-h-12 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 dark:brightness-0 dark:invert dark:opacity-70 dark:group-hover:opacity-100"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="text-gray-400 group-hover:text-primary-600 transition-colors" size={24} />
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xs leading-relaxed group-hover:text-primary-800 dark:group-hover:text-primary-300 transition-colors line-clamp-2">
                      {company.company_name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
