import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, ChevronRight, Send, CheckCircle, Loader2 } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import MarketTicker from '../components/MarketTicker';
import { NewsTicker } from '../../components/NewsTicker';
import type { LegalType } from '../../components/LegalModal';
import { siteSettingsApi } from '../services/api/siteSettings';
import type { SiteSettings } from '../types/database';

const LegalModal = React.lazy(() =>
    import('../../components/LegalModal').then(module => ({ default: module.LegalModal }))
);
const SnowOverlay = React.lazy(() =>
    import('../components/SnowOverlay').then(module => ({ default: module.SnowOverlay }))
);
const SocialFollowPromo = React.lazy(() => import('../components/SocialFollowPromo'));

// Custom X (Twitter) Icon
const XIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

export const PublicLayout: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [legalModalType, setLegalModalType] = useState<LegalType>('KVKK');
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [loadEnhancements, setLoadEnhancements] = useState(false);
    const location = useLocation();

    // Newsletter state
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [newsletterResult, setNewsletterResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        let cleanup = () => { };
        if ('requestIdleCallback' in window) {
            const id = (window as any).requestIdleCallback(() => setLoadEnhancements(true), { timeout: 3500 });
            cleanup = () => (window as any).cancelIdleCallback?.(id);
        } else {
            const id = window.setTimeout(() => setLoadEnhancements(true), 2200);
            cleanup = () => window.clearTimeout(id);
        }
        return cleanup;
    }, []);

    useEffect(() => {
        // FORCE light mode on every page load
        localStorage.removeItem('theme');
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        setTheme('light');

        // NOTE: Per-page <title> and meta are now owned by the usePageSeo() hook
        // (static per-route defaults + optional Supabase page_seo overrides).
        // PublicLayout must NOT set a global document.title here, otherwise it would
        // overwrite the unique per-page titles required for SEO / AdSense crawling.

        // Load site settings (favicon + footer data)
        const loadSiteSettings = async () => {
            try {
                const settings = await siteSettingsApi.getSettings();
                console.log('[DEBUG] Site settings fetched:', settings);
                if (settings) {
                    setSiteSettings(settings);

                    // Cache the site name for other UI uses. The document title is
                    // intentionally NOT set here; usePageSeo() owns per-page titles.
                    if (settings.site_name) {
                        localStorage.setItem('cached_site_name', settings.site_name);
                    }

                    // Set favicon - update all favicon links for Google Search compatibility
                    if (settings.favicon_url) {
                        // Update all favicon link elements
                        const faviconIco = document.getElementById('favicon-ico') as HTMLLinkElement;
                        const faviconPng = document.getElementById('favicon-png') as HTMLLinkElement;
                        const appleTouchIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement;

                        if (faviconIco) faviconIco.href = settings.favicon_url;
                        if (faviconPng) faviconPng.href = settings.favicon_url;
                        if (appleTouchIcon) appleTouchIcon.href = settings.favicon_url;
                    }

                    // SEO meta (title / description / OG title&desc / Twitter title&desc)
                    // are now set PER PAGE by the usePageSeo() hook so each route is unique
                    // and crawlable. Here we only keep the global OG/Twitter *image* default.
                    if (settings.og_image_url) {
                        const ogImage = document.getElementById('og-image') as HTMLMetaElement;
                        const twitterImage = document.getElementById('twitter-image') as HTMLMetaElement;
                        if (ogImage) ogImage.content = settings.og_image_url;
                        if (twitterImage) twitterImage.content = settings.og_image_url;
                    }
                }
            } catch (error) {
                console.error('Site ayarları yüklenemedi:', error);
            }
        };
        loadSiteSettings();
    }, []);


    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleOpenLegal = (type: LegalType) => {
        setLegalModalType(type);
        setLegalModalOpen(true);
    };

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterEmail.trim()) return;

        setNewsletterLoading(true);
        setNewsletterResult(null);

        try {
            const { default: emailService } = await import('../services/api/emailService');
            const result = await emailService.subscribeNewsletter(newsletterEmail);
            if (result.success) {
                setNewsletterResult({ success: true, message: result.message || 'Başarıyla abone oldunuz!' });
                setNewsletterEmail('');
            } else {
                setNewsletterResult({ success: false, message: result.error || 'Bir hata oluştu' });
            }
        } catch (error) {
            setNewsletterResult({ success: false, message: 'Bir hata oluştu' });
        } finally {
            setNewsletterLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 selection:bg-primary-200 selection:text-primary-900 transition-colors duration-300 relative flex flex-col">
            {loadEnhancements && (
                <React.Suspense fallback={null}>
                    <SnowOverlay />
                    <SocialFollowPromo />
                </React.Suspense>
            )}
            <NewsTicker />
            <PublicNavbar theme={theme} toggleTheme={toggleTheme} />
            <MarketTicker />

            <main className="flex-grow">
                <Outlet context={{ theme }} />
            </main>

            {legalModalOpen && (
                <React.Suspense fallback={null}>
                    <LegalModal
                        isOpen={legalModalOpen}
                        type={legalModalType}
                        onClose={() => setLegalModalOpen(false)}
                        siteSettings={siteSettings}
                    />
                </React.Suspense>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 dark:bg-slate-950 text-gray-400 pt-16 pb-12 border-t border-gray-800 dark:border-slate-900 transition-colors duration-300">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold text-white mb-4">{siteSettings?.site_name || 'Katılım Uzmanı'}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed mb-6">
                                {siteSettings?.footer_description || "Türkiye'nin en kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu. Hayallerinize faizsiz ulaşın."}
                            </p>
                            <div className="flex justify-center md:justify-start gap-4">
                                {siteSettings?.facebook_url && (
                                    <a href={siteSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                                        <Facebook size={18} />
                                    </a>
                                )}
                                {siteSettings?.twitter_url && (
                                    <a href={siteSettings.twitter_url} target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                                        <XIcon size={18} />
                                    </a>
                                )}
                                {siteSettings?.instagram_url && (
                                    <a href={siteSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                                        <Instagram size={18} />
                                    </a>
                                )}
                                {siteSettings?.linkedin_url && (
                                    <a href={siteSettings.linkedin_url} target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                                        <Linkedin size={18} />
                                    </a>
                                )}
                                {!siteSettings?.facebook_url && !siteSettings?.twitter_url && !siteSettings?.instagram_url && !siteSettings?.linkedin_url && (
                                    <>
                                        <a href="#" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                                            <Facebook size={18} />
                                        </a>
                                        <a href="#" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                                            <XIcon size={18} />
                                        </a>
                                        <a href="#" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                                            <Instagram size={18} />
                                        </a>
                                        <a href="#" className="bg-gray-800 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors">
                                            <Linkedin size={18} />
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="text-center md:text-left">
                            <h3 className="text-lg font-bold text-white mb-6">Hızlı Erişim</h3>
                            <ul className="space-y-3">
                                <li>
                                    <NavLink to="/" className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors">
                                        <ChevronRight size={14} /> Ana Sayfa
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/kampanyalar" className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors">
                                        <ChevronRight size={14} /> Güncel Kampanyalar
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/katilim-firmalari" className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors">
                                        <ChevronRight size={14} /> Katılım Firmaları
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/sektor-haberleri" className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors">
                                        <ChevronRight size={14} /> Sektör Haberleri
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/blog" className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors">
                                        <ChevronRight size={14} /> Blog & Haberler
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/iletisim" className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors">
                                        <ChevronRight size={14} /> İletişim
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/hakkimizda" className="text-sm text-gray-400 hover:text-[#4DC9E6] flex items-center justify-center md:justify-start gap-2 transition-colors">
                                        <ChevronRight size={14} /> Hakkımızda
                                    </NavLink>
                                </li>
                            </ul>
                        </div>

                        <div className="text-center md:text-left">
                            <h3 className="text-lg font-bold text-white mb-6">Bize Ulaşın</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center justify-center md:justify-start gap-3 text-sm">
                                    <Mail size={18} className="text-primary-500" />
                                    <span>{siteSettings?.footer_email || 'info@hangikatilim.com'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* SEO: Popüler konular — anahtar kelime odaklı iç bağlantılar */}
                    <div className="border-t border-gray-800 pt-8 mb-8">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Popüler Konular</h4>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                            <NavLink to="/" className="text-gray-400 hover:text-[#4DC9E6] transition-colors">Tasarruf Finansmanı Hesaplama</NavLink>
                            <NavLink to="/kampanyalar" className="text-gray-400 hover:text-[#4DC9E6] transition-colors">Faizsiz Ev ve Araç Kampanyaları</NavLink>
                            <NavLink to="/katilim-firmalari" className="text-gray-400 hover:text-[#4DC9E6] transition-colors">Katılım Firmaları Karşılaştırma</NavLink>
                            <NavLink to="/sektor-haberleri" className="text-gray-400 hover:text-[#4DC9E6] transition-colors">Tasarruf Finansmanı Sektör Haberleri</NavLink>
                            <NavLink to="/blog" className="text-gray-400 hover:text-[#4DC9E6] transition-colors">Faizsiz Finansman Rehberi</NavLink>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mt-4 max-w-3xl">
                            Katılım Uzmanı; tasarruf finansmanı (evim sistemi), faizsiz ev ve araç finansmanı, çekilişli ve çekilişsiz sistemler ile BDDK lisanslı katılım finansman firmalarını şeffaf biçimde karşılaştırmanızı ve kendi ödeme planınızı ücretsiz hesaplamanızı sağlar.
                        </p>
                    </div>

                    {/* Newsletter Subscription Section */}
                    <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h3 className="text-lg font-bold text-white mb-1">📬 E-Bültenimize Abone Olun</h3>
                                <p className="text-sm text-gray-400">Yeni kampanyalar ve fırsatlardan haberdar olun</p>
                            </div>
                            <form onSubmit={handleNewsletterSubmit} className="flex-1 max-w-md w-full">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        placeholder="E-posta adresiniz"
                                        required
                                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={newsletterLoading}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        {newsletterLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                <span className="hidden sm:inline">Abone Ol</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                {newsletterResult && (
                                    <div className={`mt-3 flex items-center gap-2 text-sm ${newsletterResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {newsletterResult.success && <CheckCircle className="w-4 h-4" />}
                                        {newsletterResult.message}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-medium text-gray-400">{siteSettings?.copyright_text || 'Katılım Uzmanı Platformu © 2025'}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            {/* Dynamic legal links from siteSettings */}
                            {siteSettings?.terms_text && (
                                <button onClick={() => handleOpenLegal('TERMS')} className="hover:text-white transition-colors">
                                    {siteSettings.terms_text}
                                </button>
                            )}
                            {siteSettings?.kvkk_text && (
                                <button onClick={() => handleOpenLegal('KVKK')} className="hover:text-white transition-colors">
                                    {siteSettings.kvkk_text}
                                </button>
                            )}
                            {siteSettings?.privacy_text && (
                                <button onClick={() => handleOpenLegal('CONSENT')} className="hover:text-white transition-colors">
                                    {siteSettings.privacy_text}
                                </button>
                            )}
                            {siteSettings?.cookie_text && (
                                <button onClick={() => handleOpenLegal('COMMERCIAL')} className="hover:text-white transition-colors">
                                    {siteSettings.cookie_text}
                                </button>
                            )}
                            {/* Fallback if no siteSettings */}
                            {!siteSettings && (
                                <>
                                    <button onClick={() => handleOpenLegal('TERMS')} className="hover:text-white transition-colors">Kullanım Şartları</button>
                                    <button onClick={() => handleOpenLegal('KVKK')} className="hover:text-white transition-colors">Aydınlatma Metni</button>
                                    <button onClick={() => handleOpenLegal('CONSENT')} className="hover:text-white transition-colors">Açık Rıza Metni</button>
                                </>
                            )}
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-600 dark:text-gray-700 text-center mt-6 max-w-4xl mx-auto leading-relaxed">
                        Bu uygulama bilgilendirme amaçlıdır. Hesaplanan tutarlar ve teslimat tarihleri, seçilen parametrelere göre tahmini olarak sunulmaktadır. Kesin sonuçlar için ilgili tasarruf finansman şirketleri ile görüşülmelidir.
                    </p>
                </div>
            </footer>
        </div>
    );
};
