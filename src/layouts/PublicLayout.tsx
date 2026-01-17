import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, ChevronRight, Send, CheckCircle, Loader2 } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { NewsTicker } from '../../components/NewsTicker';
import { LegalModal, LegalType } from '../../components/LegalModal';
import { siteSettingsApi } from '../services/api/siteSettings';
import emailService from '../services/api/emailService';
import type { SiteSettings } from '../types/database';
import { SnowOverlay } from '../components/SnowOverlay';

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
    const location = useLocation();

    // Newsletter state
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [newsletterResult, setNewsletterResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        // FORCE light mode on every page load
        localStorage.removeItem('theme');
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        setTheme('light');

        // Immediately set title from cache to prevent FOUC
        const cachedSiteName = localStorage.getItem('cached_site_name');
        if (cachedSiteName) {
            document.title = `${cachedSiteName} | Tasarruf Finansmanı Hesaplayıcı`;
        }

        // Load site settings (favicon + footer data)
        const loadSiteSettings = async () => {
            try {
                const settings = await siteSettingsApi.getSettings();
                console.log('[DEBUG] Site settings fetched:', settings);
                console.log('[DEBUG] App Store Badge URL:', settings?.app_store_badge_url);
                console.log('[DEBUG] Google Play Badge URL:', settings?.google_play_badge_url);
                console.log('[DEBUG] App Gallery Badge URL:', settings?.app_gallery_badge_url);
                if (settings) {
                    setSiteSettings(settings);

                    // Set document title with site name and cache it
                    if (settings.site_name) {
                        document.title = `${settings.site_name} | Tasarruf Finansmanı Hesaplayıcı`;
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

                    // Update SEO meta tags from admin panel
                    const seoTitle = settings.default_seo_title || `${settings.site_name} | Tasarruf Finansmanı Hesaplayıcı`;
                    const seoDescription = settings.default_seo_description || "Türkiye'nin en kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu.";

                    // Update meta description
                    const metaDesc = document.getElementById('meta-description') as HTMLMetaElement;
                    if (metaDesc) metaDesc.content = seoDescription;

                    // Update Open Graph tags
                    const ogTitle = document.getElementById('og-title') as HTMLMetaElement;
                    const ogDesc = document.getElementById('og-description') as HTMLMetaElement;
                    const ogImage = document.getElementById('og-image') as HTMLMetaElement;
                    if (ogTitle) ogTitle.content = seoTitle;
                    if (ogDesc) ogDesc.content = seoDescription;
                    if (ogImage && settings.og_image_url) ogImage.content = settings.og_image_url;

                    // Update Twitter Card tags
                    const twitterTitle = document.getElementById('twitter-title') as HTMLMetaElement;
                    const twitterDesc = document.getElementById('twitter-description') as HTMLMetaElement;
                    const twitterImage = document.getElementById('twitter-image') as HTMLMetaElement;
                    if (twitterTitle) twitterTitle.content = seoTitle;
                    if (twitterDesc) twitterDesc.content = seoDescription;
                    if (twitterImage && settings.og_image_url) twitterImage.content = settings.og_image_url;
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

    // Helper function to render app store badge
    // ONLY uses database URL - NO fallbacks
    const renderAppBadge = (
        enabled: boolean | undefined,
        storeUrl: string | undefined,
        badgeUrl: string | undefined,
        altText: string
    ) => {
        // Don't render if explicitly disabled (null/undefined = enabled)
        if (enabled === false) return null;

        // Get the image source from database ONLY - no fallbacks
        const imgSrc = (badgeUrl || '').trim();

        // Don't render if no badge URL from database
        if (!imgSrc) {
            console.log(`[DEBUG] Badge skipped (no URL): ${altText}`);
            return null;
        }

        console.log(`[DEBUG] Badge rendering: ${altText}`, imgSrc);

        const imgElement = (
            <img
                src={imgSrc}
                alt={altText}
                className="h-10 w-auto object-contain cursor-pointer"
                style={{ minWidth: '100px', maxWidth: '140px' }}
                onLoad={() => console.log(`[DEBUG] Badge LOADED: ${altText}`, imgSrc)}
                onError={(e) => {
                    console.error(`[DEBUG] Badge FAILED: ${altText}`, imgSrc);
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
        );

        // If store URL exists, wrap in link; otherwise just show image
        if (storeUrl?.trim()) {
            return (
                <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:scale-105 transition-transform inline-block"
                >
                    {imgElement}
                </a>
            );
        }

        // No store URL but badge exists - show without link
        return (
            <div className="inline-block">
                {imgElement}
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 selection:bg-primary-200 selection:text-primary-900 transition-colors duration-300 relative flex flex-col">
            <SnowOverlay />
            <NewsTicker />
            <PublicNavbar theme={theme} toggleTheme={toggleTheme} />

            <main className="flex-grow">
                <Outlet context={{ theme }} />
            </main>

            <LegalModal
                isOpen={legalModalOpen}
                type={legalModalType}
                onClose={() => setLegalModalOpen(false)}
                siteSettings={siteSettings}
            />

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
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                                {/* App Store Badge */}
                                {renderAppBadge(
                                    siteSettings?.show_app_store_badge,
                                    siteSettings?.app_store_url,
                                    siteSettings?.app_store_badge_url,
                                    'App Store'
                                )}

                                {/* Google Play Badge */}
                                {renderAppBadge(
                                    siteSettings?.show_google_play_badge,
                                    siteSettings?.google_play_url,
                                    siteSettings?.google_play_badge_url,
                                    'Google Play'
                                )}

                                {/* App Gallery Badge */}
                                {renderAppBadge(
                                    siteSettings?.show_app_gallery_badge,
                                    siteSettings?.app_gallery_url,
                                    siteSettings?.app_gallery_badge_url,
                                    'App Gallery'
                                )}
                            </div>
                        </div>
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
