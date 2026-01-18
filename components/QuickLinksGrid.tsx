import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Home, Car, Calculator, Gift, Building2, CreditCard, Wallet,
    TrendingUp, Shield, FileText, Users, Phone, Mail, HelpCircle,
    Settings, Star, Zap, Award, Target, Percent, PiggyBank,
    Landmark, Briefcase, BarChart3, type LucideIcon
} from 'lucide-react';
import { quickLinksApi, type QuickLinksSettings, type QuickLinksItem } from '../src/services/api/quickLinks';

// Icon mapping - string name to Lucide component
const iconMap: Record<string, LucideIcon> = {
    Home, Car, Calculator, Gift, Building2, CreditCard, Wallet,
    TrendingUp, Shield, FileText, Users, Phone, Mail, HelpCircle,
    Settings, Star, Zap, Award, Target, Percent, PiggyBank,
    Landmark, Briefcase, BarChart3
};

// Get icon component from string name
const getIconComponent = (iconName: string): LucideIcon => {
    return iconMap[iconName] || Home;
};

// Badge color classes
const badgeColorClasses: Record<string, string> = {
    slate: 'bg-slate-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-500 text-white',
    orange: 'bg-orange-500 text-white',
    purple: 'bg-purple-500 text-white',
};

// Badge animation classes
const badgeAnimationClasses: Record<string, string> = {
    none: '',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    ping: 'animate-ping',
};

// Skeleton loader - matches actual card size to prevent CLS (Cumulative Layout Shift)
const QuickLinksSkeleton: React.FC = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 animate-pulse text-center min-h-[112px]">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl mx-auto mb-3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mx-auto"></div>
            </div>
        ))}
    </div>
);

interface QuickLinksGridProps {
    className?: string;
    isOverlay?: boolean; // Whether to render as overlay on hero
}

export const QuickLinksGrid: React.FC<QuickLinksGridProps> = ({ className = '', isOverlay = false }) => {
    const [settings, setSettings] = useState<QuickLinksSettings | null>(null);
    const [items, setItems] = useState<QuickLinksItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [settingsData, itemsData] = await Promise.all([
                quickLinksApi.getSettings(),
                quickLinksApi.getActiveItems()
            ]);
            setSettings(settingsData);
            setItems(itemsData);
        } catch (error) {
            console.error('[QuickLinksGrid] Failed to load:', error);
        } finally {
            setLoading(false);
        }
    };

    // Render badge with color and animation
    const renderBadge = (item: QuickLinksItem) => {
        if (!item.badge_text) return null;

        const colorClass = badgeColorClasses[item.badge_color || 'slate'] || badgeColorClasses.slate;
        const animationClass = badgeAnimationClasses[item.badge_animation || 'none'] || '';

        return (
            <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full ${colorClass} ${animationClass}`}>
                {item.badge_text}
            </span>
        );
    };

    // Show skeleton immediately while loading (prevents FOUC)
    if (loading) {
        return (
            <div className={`w-full ${className}`}>
                <QuickLinksSkeleton />
            </div>
        );
    }

    // Don't render if disabled or no items
    if (!settings?.is_enabled || items.length === 0) {
        return null;
    }

    // Card content component (shared between overlay and standalone)
    const CardContent: React.FC<{ item: QuickLinksItem }> = ({ item }) => {
        const IconComponent = getIconComponent(item.icon);

        return (
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer min-h-[112px]">
                {/* Badge with color and animation */}
                {renderBadge(item)}

                {/* Icon - Mono style */}
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                    <IconComponent className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-1">
                    {item.title}
                </h3>
            </div>
        );
    };

    // Render link wrapper based on link type
    const renderLink = (item: QuickLinksItem) => {
        const isExternal = item.is_external || item.link_url.startsWith('http');

        // External link
        if (isExternal) {
            return (
                <a
                    key={item.id}
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <CardContent item={item} />
                </a>
            );
        }

        // Hash link (same page scroll)
        if (item.link_url.startsWith('#') || item.link_url.startsWith('/#')) {
            const handleHashClick = (e: React.MouseEvent) => {
                e.preventDefault();
                const hash = item.link_url.replace('/', '').replace('#', '');

                // If we're not on homepage, navigate first
                if (window.location.pathname !== '/') {
                    window.location.href = `/#${hash}`;
                    return;
                }

                // Smooth scroll to element
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.history.pushState(null, '', `#${hash}`);
                }
            };

            return (
                <a
                    key={item.id}
                    href={item.link_url}
                    onClick={handleHashClick}
                >
                    <CardContent item={item} />
                </a>
            );
        }

        // Internal route link
        return (
            <Link key={item.id} to={item.link_url}>
                <CardContent item={item} />
            </Link>
        );
    };

    // Overlay version (inside hero) - same design, just smaller
    if (isOverlay) {
        return (
            <div className={`w-full ${className}`}>
                {/* Section Header */}
                {settings && (settings.section_title || settings.section_subtitle) && (
                    <div className="text-left mb-3">
                        {settings.section_title && (
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {settings.section_title}
                            </h2>
                        )}
                        {settings.section_subtitle && (
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                {settings.section_subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Grid - 4 columns on desktop, 2 on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {items.map(item => renderLink(item))}
                </div>
            </div>
        );
    }

    // Standalone section version (below hero)
    return (
        <section className={`py-6 ${className}`}>
            <div className="container mx-auto px-4">
                {/* Section Header */}
                {settings && (settings.section_title || settings.section_subtitle) && (
                    <div className="text-left mb-4">
                        {settings.section_title && (
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                {settings.section_title}
                            </h2>
                        )}
                        {settings.section_subtitle && (
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                {settings.section_subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Grid - 4 columns on desktop, 2 on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {items.map(item => renderLink(item))}
                </div>
            </div>
        </section>
    );
};

export { getIconComponent, iconMap };
