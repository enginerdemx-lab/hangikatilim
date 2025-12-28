import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

export type SponsorTrigger = 'pdf' | 'save' | 'ai';

interface Sponsor {
    id: string;
    name: string;
    logo?: string;
    title: string;
    description: string;
    ctaText: string;
    ctaUrl: string;
    color: string;
}

interface SponsorAreaProps {
    trigger: SponsorTrigger;
}

// Placeholder sponsor data - bu veriler admin panelinden veya API'den gelebilir
const defaultSponsors: Sponsor[] = [
    {
        id: 'sponsor_1',
        name: 'Katılım Finans',
        logo: undefined,
        title: 'Faizsiz Finansman Fırsatı',
        description: 'Özel kampanyalarla hayallerinize ulaşın.',
        ctaText: 'Detayları Gör',
        ctaUrl: '/kampanyalar',
        color: 'from-blue-500 to-blue-600'
    },
    {
        id: 'sponsor_2',
        name: 'Tasarruf Danışmanlık',
        logo: undefined,
        title: 'Uzman Danışmanlık Hizmeti',
        description: 'Tasarruf planınızı profesyonellerle oluşturun.',
        ctaText: 'Randevu Al',
        ctaUrl: '/iletisim',
        color: 'from-green-500 to-green-600'
    },
    {
        id: 'sponsor_3',
        name: 'Karşılaştırma Merkezi',
        logo: undefined,
        title: 'Tüm Firmaları Karşılaştırın',
        description: 'En uygun seçeneği keşfedin.',
        ctaText: 'Karşılaştır',
        ctaUrl: '/katilim-firmalari',
        color: 'from-purple-500 to-purple-600'
    }
];

// Declare gtag globally for TypeScript
declare global {
    interface Window {
        gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
    }
}

export const SponsorArea: React.FC<SponsorAreaProps> = ({ trigger }) => {
    const [sponsors] = useState<Sponsor[]>(defaultSponsors);
    const [hasTrackedView, setHasTrackedView] = useState(false);

    // Track sponsor area view on first render
    useEffect(() => {
        if (!hasTrackedView && trigger) {
            // GA4 Event: sponsor_area_view
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'sponsor_area_view', {
                    trigger: trigger
                });
            }
            setHasTrackedView(true);
        }
    }, [trigger, hasTrackedView]);

    const handleSponsorClick = (sponsor: Sponsor) => {
        // GA4 Event: sponsor_click
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'sponsor_click', {
                sponsor: sponsor.id,
                sponsor_name: sponsor.name,
                trigger: trigger
            });
        }
    };

    return (
        <div className="mt-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-500" />
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Bu hesaba göre sponsor teklifler
                </h4>
            </div>

            {/* Sponsor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sponsors.map((sponsor) => (
                    <a
                        key={sponsor.id}
                        href={sponsor.ctaUrl}
                        onClick={() => handleSponsorClick(sponsor)}
                        className="group block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
                    >
                        {/* Card Header with Gradient Accent */}
                        <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${sponsor.color} mb-3 group-hover:w-full transition-all duration-300`} />

                        {/* Logo Placeholder or Name */}
                        <div className="flex items-center gap-2 mb-2">
                            {sponsor.logo ? (
                                <img src={sponsor.logo} alt={sponsor.name} className="h-6 w-auto" />
                            ) : (
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                    {sponsor.name}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h5 className="text-sm font-bold text-gray-800 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {sponsor.title}
                        </h5>

                        {/* Description */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                            {sponsor.description}
                        </p>

                        {/* CTA */}
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                            <span>{sponsor.ctaText}</span>
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </a>
                ))}
            </div>

            {/* Transparency Note */}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                <span className="opacity-70">ℹ️</span>
                Bu alan sponsorlu içerik içerebilir.
            </p>
        </div>
    );
};
