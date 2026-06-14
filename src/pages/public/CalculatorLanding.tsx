import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ShieldCheck, Clock, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';

type Faq = { q: string; a: string };
type LandingConfig = {
    slug: string;
    brand: string;
    h1: string;
    title: string;
    description: string;
    intro: string;
    howItWorks: string[];
    considerations: string[];
    faqs: Faq[];
};

// Anahtar kelime odaklı hesaplama landing sayfaları.
// Her giriş tek bir yüksek hacimli "X hesaplama" araması içindir.
export const LANDING_CONFIGS: Record<string, LandingConfig> = {
    eminevim: {
        slug: 'eminevim-hesaplama',
        brand: 'Eminevim',
        h1: 'Eminevim Hesaplama: Tasarruf Finansmanı Ödeme Planı',
        title: 'Eminevim Hesaplama 2026 | Tasarruf Finansmanı Ödeme Planı | Katılım Uzmanı',
        description: 'Eminevim tasarruf finansmanı sistemiyle faizsiz ev ve araç planınızı hesaplayın. Aylık taksit, organizasyon ücreti ve teslimat sürelerini anında karşılaştırın.',
        intro: 'Eminevim, tasarruf finansmanı (faizsiz ev ve araç edinme) modeliyle çalışan, BDDK denetimine tabi bir kuruluştur. Bu sayfadaki ücretsiz hesaplayıcı ile kendi tutar ve vadenize göre tahmini aylık ödeme planınızı saniyeler içinde oluşturabilir, çekilişli ve çekilişsiz sistemleri karşılaştırabilirsiniz.',
        howItWorks: [
            'İhtiyaç tutarınızı (ev, araç veya iş yeri) ve vadeyi seçersiniz.',
            'Sistem, tasarruf finansmanı modeline göre tahmini aylık taksidi ve toplam ödemeyi hesaplar.',
            'Çekilişli sistemde teslimat sırası çekilişle, çekilişsiz sistemde ise belirli bir ödeme oranına ulaşınca belirlenir.',
        ],
        considerations: [
            'Organizasyon (hizmet) ücreti oranı toplam maliyeti doğrudan etkiler; mutlaka karşılaştırın.',
            'Teslimat süresi seçtiğiniz sisteme ve ödeme planına göre değişir.',
            'Faizsiz model olduğu için ödeme güçlüğünde yapılandırma esnekliği genellikle daha yüksektir.',
        ],
        faqs: [
            { q: 'Eminevim hesaplama nasıl yapılır?', a: 'İhtiyaç tutarınızı ve vadeyi girerek tahmini aylık taksidi ve toplam ödemeyi anında görürsünüz. Kesin rakam için şirketin güncel organizasyon ücreti oranıyla teyit etmeniz önerilir.' },
            { q: 'Eminevim faizsiz mi?', a: 'Tasarruf finansmanı sistemi faizsiz (katılım esaslı) bir modeldir; maliyet faiz değil, organizasyon/hizmet ücretidir.' },
            { q: 'Çekilişli ve çekilişsiz sistem arasındaki fark nedir?', a: 'Çekilişli sistemde teslimat sırası her ay yapılan çekilişle, çekilişsiz sistemde ise toplam tutarın belirli bir kısmı ödendiğinde belirlenir.' },
        ],
    },
    birevim: {
        slug: 'birevim-hesaplama',
        brand: 'Birevim',
        h1: 'Birevim Hesaplama: Faizsiz Ödeme Planı Aracı',
        title: 'Birevim Hesaplama 2026 | Faizsiz Ev ve Araç Ödeme Planı | Katılım Uzmanı',
        description: 'Birevim tasarruf finansmanı sistemiyle faizsiz ev/araç ödeme planınızı hesaplayın. Aylık taksit ve toplam maliyeti anında görün, sistemleri karşılaştırın.',
        intro: 'Birevim, tasarruf finansmanı modeliyle faizsiz ev ve araç sahibi olmayı hedefleyen, dayanışma esaslı bir sistem sunar. Aşağıdaki hesaplayıcı ile tutar ve vadenize göre tahmini aylık ödemenizi ücretsiz oluşturabilir, farklı senaryoları karşılaştırabilirsiniz.',
        howItWorks: [
            'Ev veya araç için ihtiyaç tutarınızı ve vadeyi belirlersiniz.',
            'Hesaplayıcı tahmini aylık taksit ve toplam ödeme planını çıkarır.',
            'Peşinatlı planlarda teslimat genellikle daha hızlıdır; çekilişsiz seçenekte sıra ödeme oranına bağlıdır.',
        ],
        considerations: [
            'Toplam maliyeti faiz değil organizasyon ücreti belirler — oranı karşılaştırın.',
            'Aynı tutarda farklı vadelerin aylık taksidi ve teslimat süresi değişir.',
            'Bütçenize uygun aylık taksiti seçmek, planın sürdürülebilirliği için önemlidir.',
        ],
        faqs: [
            { q: 'Birevim hesaplama nasıl yapılır?', a: 'Tutar ve vadeyi girdiğinizde tahmini aylık taksit ve toplam ödeme anında hesaplanır. Kesin rakam için güncel ücret oranıyla teyit önerilir.' },
            { q: 'Birevim ile ne kadar sürede teslim alınır?', a: 'Teslimat süresi seçtiğiniz sisteme (çekilişli/çekilişsiz) ve peşinat/ödeme oranına göre değişir.' },
            { q: 'Birevim faizsiz bir sistem mi?', a: 'Evet, tasarruf finansmanı faizsiz (katılım esaslı) bir modeldir.' },
        ],
    },
    'vakif-katilim': {
        slug: 'vakif-katilim-finansman-hesaplama',
        brand: 'Vakıf Katılım',
        h1: 'Vakıf Katılım Finansman Hesaplama',
        title: 'Vakıf Katılım Finansman Hesaplama 2026 | Faizsiz Finansman | Katılım Uzmanı',
        description: 'Vakıf Katılım ve katılım bankacılığı esaslı faizsiz finansman planınızı hesaplayın. Tahmini aylık ödeme ve toplam maliyeti karşılaştırın.',
        intro: 'Vakıf Katılım, katılım bankacılığı (faizsiz finans) ilkeleriyle çalışan bir katılım bankasıdır. Aşağıdaki araçla faizsiz finansman senaryolarınızı oluşturabilir, tutar ve vadeye göre tahmini ödeme planınızı ücretsiz görebilirsiniz.',
        howItWorks: [
            'Finansman tutarınızı ve vadeyi seçersiniz.',
            'Hesaplayıcı katılım esaslı modele göre tahmini aylık ödemeyi çıkarır.',
            'Kâr payı/ücret yapısı kuruma ve ürüne göre değişebilir; sonucu güncel oranlarla teyit edin.',
        ],
        considerations: [
            'Katılım esaslı finansmanda maliyet faiz değil, kâr payı veya hizmet ücretidir.',
            'Aynı tutarda vade uzadıkça aylık taksit düşer, toplam maliyet artabilir.',
            'Farklı katılım kurumlarını karşılaştırarak en uygun planı seçebilirsiniz.',
        ],
        faqs: [
            { q: 'Vakıf Katılım finansman hesaplama nasıl yapılır?', a: 'Tutar ve vadeyi girerek tahmini aylık ödemeyi görürsünüz. Kesin teklif için kurumun güncel kâr payı/ücret oranı esas alınır.' },
            { q: 'Katılım finansmanı faizsiz mi?', a: 'Evet, katılım bankacılığı faizsiz ilkelere dayanır; getiri/maliyet kâr payı esasına göre belirlenir.' },
            { q: 'Hangi katılım kurumlarını karşılaştırabilirim?', a: 'Katılım Uzmanı üzerinden BDDK lisanslı katılım finansman firmalarını şeffaf biçimde karşılaştırabilirsiniz.' },
        ],
    },
};

const PageLink: React.FC<{ cfg: LandingConfig }> = ({ cfg }) => {
    // Inject SEO (title, meta, FAQ JSON-LD) — kendi başına yönetir, pageSeo'ya bağımlı değil
    useEffect(() => {
        const prevTitle = document.title;
        document.title = cfg.title;

        let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        if (meta) { meta.content = cfg.description; }
        else { meta = document.createElement('meta'); meta.name = 'description'; meta.content = cfg.description; document.head.appendChild(meta); }

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: cfg.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        };
        const old = document.querySelector('script[data-seo="landing-faq"]');
        if (old) old.remove();
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.setAttribute('data-seo', 'landing-faq');
        s.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(s);

        return () => {
            document.title = prevTitle;
            const el = document.querySelector('script[data-seo="landing-faq"]');
            if (el) el.remove();
        };
    }, [cfg]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Hero — düz, gradyansız */}
            <div className="bg-slate-900 pt-12 pb-14">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="h-0.5 w-8 bg-blue-500"></span>
                        <span className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-[0.18em]">
                            <Calculator size={14} /> Hesaplama Aracı
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                        {cfg.h1}
                    </h1>
                    <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl">{cfg.intro}</p>
                    <a
                        href="/#calculator"
                        className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
                    >
                        Ödeme Planını Hesapla <ArrowRight size={18} />
                    </a>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl py-12 space-y-12">
                {/* Nasıl çalışır */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">{cfg.brand} sistemi nasıl çalışır?</h2>
                    <ul className="space-y-3">
                        {cfg.howItWorks.map((t, i) => (
                            <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                {t}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Dikkat edilecekler */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Hesaplarken nelere dikkat etmeli?</h2>
                    <ul className="space-y-3">
                        {cfg.considerations.map((t, i) => (
                            <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-1" /> {t}
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 text-sm">
                        <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400"><ShieldCheck size={16} className="text-blue-500" /> BDDK denetimli sistemler</span>
                        <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400"><Clock size={16} className="text-blue-500" /> Faizsiz / katılım esaslı</span>
                    </div>
                </section>

                {/* SSS */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Sıkça Sorulan Sorular</h2>
                    <div className="space-y-3">
                        {cfg.faqs.map((f, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.q}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* İç linkler + CTA */}
                <section className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-6 md:p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Kendi {cfg.brand} planınızı oluşturun</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">Tutar ve vadenizi girin, tahmini aylık ödemenizi anında görün.</p>
                    <a href="/#calculator" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                        Hemen Hesapla <ArrowRight size={18} />
                    </a>
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-6 text-sm">
                        <Link to="/kampanyalar" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><ChevronRight size={14} /> Güncel Kampanyalar</Link>
                        <Link to="/katilim-firmalari" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><ChevronRight size={14} /> Firmaları Karşılaştır</Link>
                        <Link to="/sektor-haberleri" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"><ChevronRight size={14} /> Sektör Haberleri</Link>
                    </div>
                </section>
            </div>
        </div>
    );
};

// Slug bazlı sayfa bileşenleri (App.tsx'te route'lara bağlanır)
export const EminevimHesaplama: React.FC = () => <PageLink cfg={LANDING_CONFIGS.eminevim} />;
export const BirevimHesaplama: React.FC = () => <PageLink cfg={LANDING_CONFIGS.birevim} />;
export const VakifKatilimHesaplama: React.FC = () => <PageLink cfg={LANDING_CONFIGS['vakif-katilim']} />;

export default EminevimHesaplama;
