import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Facebook, Instagram, Linkedin, X, Share2, Sparkles } from 'lucide-react';
import { siteSettingsApi } from '../services/api/siteSettings';
import type { SiteSettings } from '../types/database';

// Custom X (Twitter) icon
const XIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

type Social = {
    key: string;
    label: string;
    url: string;
    color: string; // brand color used on hover
    icon: React.ReactNode;
};

const SocialFollowPromo: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loaded, setLoaded] = useState(false);

    // Sticky bar state
    const [panelOpen, setPanelOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastDismissed, setToastDismissed] = useState(false);
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load site settings (+ refresh when admin saves)
    const loadSettings = useCallback(async () => {
        try {
            const data = await siteSettingsApi.getSettings();
            setSettings(data);
        } catch (err) {
            console.error('SocialFollowPromo settings error:', err);
        } finally {
            setLoaded(true);
        }
    }, []);

    useEffect(() => {
        loadSettings();
        const onUpdate = () => loadSettings();
        window.addEventListener('siteSettingsUpdated', onUpdate);
        // Session dismissal of the periodic toast
        if (sessionStorage.getItem('social_follow_promo_toast_dismissed') === 'true') {
            setToastDismissed(true);
        }
        return () => window.removeEventListener('siteSettingsUpdated', onUpdate);
    }, [loadSettings]);

    // Entrance animation for the sticky bar
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 1200);
        return () => clearTimeout(t);
    }, []);

    // Build the list of available socials (only those with a URL)
    const socials: Social[] = [];
    if (settings?.facebook_url) socials.push({ key: 'fb', label: 'Facebook', url: settings.facebook_url, color: '#1877F2', icon: <Facebook size={18} /> });
    if (settings?.instagram_url) socials.push({ key: 'ig', label: 'Instagram', url: settings.instagram_url, color: '#E4405F', icon: <Instagram size={18} /> });
    if (settings?.twitter_url) socials.push({ key: 'x', label: 'X (Twitter)', url: settings.twitter_url, color: '#000000', icon: <XIcon size={16} /> });
    if (settings?.linkedin_url) socials.push({ key: 'in', label: 'LinkedIn', url: settings.linkedin_url, color: '#0A66C2', icon: <Linkedin size={18} /> });

    const enabled = settings?.social_follow_promo_enabled !== false;
    const shouldRender = loaded && enabled && socials.length > 0;

    // Timing config (admin-controlled, in seconds -> ms) with safe fallbacks.
    const initialDelayMs = Math.max(0, settings?.social_follow_promo_initial_delay ?? 15) * 1000;
    const intervalMs = Math.max(5, settings?.social_follow_promo_interval ?? 180) * 1000;
    const durationSec = Math.max(2, settings?.social_follow_promo_duration ?? 7);
    const maxCount = Math.max(0, settings?.social_follow_promo_max_count ?? 0); // 0 = unlimited

    const getShownCount = () => {
        try { return parseInt(sessionStorage.getItem('social_follow_promo_count') || '0', 10) || 0; } catch { return 0; }
    };
    const bumpShownCount = () => {
        try { const c = getShownCount() + 1; sessionStorage.setItem('social_follow_promo_count', String(c)); return c; } catch { return 0; }
    };

    // Periodic toast scheduler
    const showToast = useCallback(() => {
        setToastVisible(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setToastVisible(false), durationSec * 1000);
    }, [durationSec]);

    useEffect(() => {
        if (!shouldRender || toastDismissed) return;
        if (maxCount > 0 && getShownCount() >= maxCount) return; // session cap already reached
        const initial = setTimeout(() => {
            showToast();
            if (maxCount > 0 && bumpShownCount() >= maxCount) return; // cap hit on first show
            toastIntervalRef.current = setInterval(() => {
                showToast();
                if (maxCount > 0 && bumpShownCount() >= maxCount && toastIntervalRef.current) {
                    clearInterval(toastIntervalRef.current);
                }
            }, intervalMs);
        }, initialDelayMs);
        return () => {
            clearTimeout(initial);
            if (toastIntervalRef.current) clearInterval(toastIntervalRef.current);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, [shouldRender, toastDismissed, showToast, initialDelayMs, intervalMs, maxCount]);

    const dismissToast = () => {
        setToastVisible(false);
        setToastDismissed(true);
        sessionStorage.setItem('social_follow_promo_toast_dismissed', 'true');
        if (toastIntervalRef.current) clearInterval(toastIntervalRef.current);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };

    if (!shouldRender) return null;

    return (
        <>
            {/* ===================== Sticky side button (right edge) ===================== */}
            <div
                className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-transform duration-700 ease-out ${mounted ? 'translate-x-0' : 'translate-x-full'}`}
                onMouseEnter={() => setPanelOpen(true)}
                onMouseLeave={() => setPanelOpen(false)}
            >
                {/* Panel and trigger are flex siblings with NO gap between them, so moving
                    the cursor from the tab onto the icons keeps the hover region continuous
                    (fixes the icons disappearing before they can be clicked on desktop). */}
                <div className="flex items-center">
                    {/* Expanding icon panel (grows out to the left) */}
                    <div
                        className={`flex flex-col gap-2.5 pr-3 transition-all duration-300 ease-out ${panelOpen ? 'max-w-[84px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 translate-x-4 overflow-hidden pointer-events-none'}`}
                    >
                        {socials.map((s, i) => (
                            <a
                                key={s.key}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={s.label}
                                title={s.label}
                                onClick={() => setPanelOpen(false)}
                                style={{
                                    transitionDelay: panelOpen ? `${i * 55}ms` : '0ms',
                                    ['--brand' as string]: s.color,
                                }}
                                className="sfp-icon flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-all duration-200 hover:scale-110 hover:text-white"
                            >
                                {s.icon}
                            </a>
                        ))}
                    </div>

                    {/* Trigger tab — solid site blue, no gradient */}
                    <button
                        type="button"
                        onClick={() => setPanelOpen((o) => !o)}
                        aria-label="Bizi sosyal medyada takip edin"
                        aria-expanded={panelOpen}
                        className="relative flex flex-col items-center gap-1.5 pl-2.5 pr-2 py-3.5 rounded-l-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 transition-colors"
                    >
                        {/* pulsing attention ring */}
                        <span className="sfp-ring absolute inset-0 rounded-l-2xl bg-blue-500/40" aria-hidden="true" />
                        <Share2 size={20} className="sfp-bounce relative z-10" />
                        <span
                            className="relative z-10 text-[10px] font-bold tracking-widest"
                            style={{ writingMode: 'vertical-rl' }}
                        >
                            TAKİP ET
                        </span>
                    </button>
                </div>
            </div>

            {/* ===================== Periodic slide-in toast (bottom-left) ===================== */}
            {!toastDismissed && (
                <div
                    className={`fixed bottom-4 left-4 z-40 w-[300px] max-w-[calc(100vw-2rem)] transition-all duration-500 ease-out ${toastVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95 pointer-events-none'}`}
                >
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 p-4 overflow-hidden">
                        {/* top accent (solid blue) */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />

                        {/* close */}
                        <button
                            onClick={dismissToast}
                            aria-label="Kapat"
                            title="Kapat"
                            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-300 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={14} />
                        </button>

                        <div className="flex items-start gap-3 pr-4">
                            <div className="sfp-pop flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md">
                                <Sparkles size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                    Bizi takip etmeyi unutmayın! 🎉
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                    Yeni kampanya ve fırsatlardan ilk siz haberdar olun.
                                </p>
                            </div>
                        </div>

                        {/* social icons row */}
                        <div className="flex items-center gap-2 mt-3.5">
                            {socials.map((s) => (
                                <a
                                    key={s.key}
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    title={s.label}
                                    style={{ ['--brand' as string]: s.color }}
                                    className="sfp-icon flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-200 hover:scale-110 hover:text-white"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>

                        {/* auto-hide progress bar */}
                        {toastVisible && (
                            <div className="sfp-progress absolute bottom-0 left-0 h-1 bg-blue-500/40" style={{ animationDuration: `${durationSec}s` }} aria-hidden="true" />
                        )}
                    </div>
                </div>
            )}

            {/* ===================== Animations ===================== */}
            <style>{`
                .sfp-icon:hover { background-color: var(--brand); }
                @keyframes sfpBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .sfp-bounce { animation: sfpBounce 2.4s ease-in-out infinite; }
                @keyframes sfpRing {
                    0% { transform: scale(1); opacity: 0.5; }
                    70%, 100% { transform: scale(1.25); opacity: 0; }
                }
                .sfp-ring { animation: sfpRing 2.2s ease-out infinite; }
                @keyframes sfpPop {
                    0% { transform: scale(0.6); }
                    60% { transform: scale(1.12); }
                    100% { transform: scale(1); }
                }
                .sfp-pop { animation: sfpPop 0.45s ease-out; }
                @keyframes sfpShrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .sfp-progress { animation: sfpShrink 7s linear forwards; }
                @media (prefers-reduced-motion: reduce) {
                    .sfp-bounce, .sfp-ring, .sfp-pop, .sfp-progress { animation: none !important; }
                }
            `}</style>
        </>
    );
};

export default SocialFollowPromo;
