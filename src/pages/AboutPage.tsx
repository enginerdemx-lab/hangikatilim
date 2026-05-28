import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { siteSettingsApi } from '../services/api/siteSettings';
import { SiteSettings } from '../types/database';
import { Loader2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await siteSettingsApi.getSettings();
                setSettings(data);
            } catch (error) {
                console.error('Error fetching about page settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Inject AboutPage JSON-LD
    useEffect(() => {
        if (!settings) return;

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            'name': settings.about_title || 'Hakkımızda',
            'url': 'https://katilimuzmani.com/hakkimizda',
            'description': settings.about_mission || 'Katılım Uzmanı hakkında bilgi',
            'mainEntity': {
                '@type': 'Organization',
                'name': 'Katılım Uzmanı',
                'url': 'https://katilimuzmani.com',
                'description': settings.about_mission || '',
            },
            'inLanguage': 'tr-TR',
        };

        const oldScript = document.querySelector('script[data-seo="about-jsonld"]');
        if (oldScript) oldScript.remove();

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', 'about-jsonld');
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);

        return () => {
            const el = document.querySelector('script[data-seo="about-jsonld"]');
            if (el) el.remove();
        };
    }, [settings]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
                <p className="text-slate-400">İçerik yüklenemedi.</p>
            </div>
        );
    }

    const safeAboutContent = settings.about_content
        ? DOMPurify.sanitize(settings.about_content, {
            USE_PROFILES: { html: true },
        }).replace(/\n/g, '<br>')
        : '';


    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">

            {/* Page Title Section */}
            <section className="pt-16 pb-12 md:pt-24 md:pb-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {settings.about_title || 'Hakkımızda'}
                        </h1>
                    </div>
                </div>
            </section>

            {/* Image Section - Full Width */}
            {settings.about_image_url && (
                <section className="pb-16 md:pb-20">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <img
                                src={settings.about_image_url}
                                alt="Hakkımızda"
                                className="w-full h-auto rounded-2xl object-cover"
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Main Content Section */}
            {settings.about_content && (
                <section className="pb-16 md:pb-24">
                    <div className="container mx-auto px-4">
                        <div className="max-w-3xl mx-auto">
                            <div
                                dangerouslySetInnerHTML={{ __html: safeAboutContent }}
                                className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed"
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Mission & Vision Section - Side by Side */}
            {(settings.about_mission || settings.about_vision) && (
                <section className="pb-20 md:pb-28">
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-12 md:gap-16">

                                {/* Mission */}
                                {settings.about_mission && (
                                    <div>
                                        <h2 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4">
                                            Misyonumuz
                                        </h2>
                                        <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed">
                                            {settings.about_mission}
                                        </p>
                                    </div>
                                )}

                                {/* Vision */}
                                {settings.about_vision && (
                                    <div>
                                        <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4">
                                            Vizyonumuz
                                        </h2>
                                        <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed">
                                            {settings.about_vision}
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </section>
            )}

        </div>
    );
};

export default AboutPage;

