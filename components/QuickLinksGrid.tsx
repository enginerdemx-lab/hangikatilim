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

// Skeleton loader - matches actual card size to prevent FOUC
const QuickLinksSkeleton: React.FC = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 md:gap-2">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-2 shadow-sm animate-pulse">
                <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700 rounded mx-auto mb-1"></div>
                <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mx-auto"></div>
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

    // Overlay version (inside hero)
    if (isOverlay) {
        return (
            <div className={`w-full ${className}`}>
                {/* Section Header - Left Aligned */}
                {settings && (settings.section_title || settings.section_subtitle) && (
                    <div className="text-left mb-2 md:mb-3">
                        {settings.section_title && (
                            <h2 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                                {settings.section_title}
                            </h2>
                        )}
                        {settings.section_subtitle && (
                            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mt-0.5">
                                {settings.section_subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Quick Links Grid - 30% smaller */}
                {loading ? (
                    <QuickLinksSkeleton />
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 md:gap-2">
                        {items.map((item) => {
                            const IconComponent = getIconComponent(item.icon);
                            const isExternal = item.is_external || item.link_url.startsWith('http');

                            const cardContent = (
                                <div className="group bg-white dark:bg-slate-800 rounded-lg p-1.5 md:p-2 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer text-center relative overflow-hidden hover:-translate-y-0.5">
                                    {/* Badge */}
                                    {item.badge_text && (
                                        <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 px-1 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[6px] md:text-[8px] font-bold rounded-full">
                                            {item.badge_text}
                                        </span>
                                    )}

                                    {/* Icon - 30% smaller */}
                                    <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded flex items-center justify-center mx-auto mb-0.5 md:mb-1 group-hover:scale-105 transition-transform duration-200">
                                        <IconComponent className="w-3 h-3 md:w-4 md:h-4 text-blue-600 dark:text-blue-400" />
                                    </div>

                                    {/* Title - smaller */}
                                    <h3 className="text-[8px] md:text-[10px] font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                        {item.title}
                                    </h3>
                                </div>
                            );

                            // External link
                            if (isExternal) {
                                return (
                                    <a
                                        key={item.id}
                                        href={item.link_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {cardContent}
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
                                        // Update URL hash without scroll
                                        window.history.pushState(null, '', `#${hash}`);
                                    }
                                };

                                return (
                                    <a
                                        key={item.id}
                                        href={item.link_url}
                                        onClick={handleHashClick}
                                    >
                                        {cardContent}
                                    </a>
                                );
                            }

                            // Internal route link
                            return (
                                <Link key={item.id} to={item.link_url}>
                                    {cardContent}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Standalone section version (below hero)
    return (
        <section className={`py-4 md:py-6 ${className}`}>
            <div className="container mx-auto px-4">
                {/* Section Header - Left Aligned */}
                {settings && (settings.section_title || settings.section_subtitle) && (
                    <div className="text-left mb-2 md:mb-3">
                        {settings.section_title && (
                            <h2 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                                {settings.section_title}
                            </h2>
                        )}
                        {settings.section_subtitle && (
                            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mt-0.5">
                                {settings.section_subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Quick Links Grid - 30% smaller */}
                {loading ? (
                    <QuickLinksSkeleton />
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
                        {items.map((item) => {
                            const IconComponent = getIconComponent(item.icon);
                            const isExternal = item.is_external || item.link_url.startsWith('http');

                            const cardContent = (
                                <div className="group bg-white dark:bg-slate-800 rounded-lg p-2 md:p-3 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer text-center relative overflow-hidden hover:-translate-y-0.5">
                                    {/* Badge */}
                                    {item.badge_text && (
                                        <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[8px] md:text-[10px] font-bold rounded-full">
                                            {item.badge_text}
                                        </span>
                                    )}

                                    {/* Icon */}
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-1.5 md:mb-2 group-hover:scale-105 transition-transform duration-200">
                                        <IconComponent className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-[10px] md:text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                        {item.title}
                                    </h3>
                                </div>
                            );

                            // External link
                            if (isExternal) {
                                return (
                                    <a
                                        key={item.id}
                                        href={item.link_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {cardContent}
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
                                        // Update URL hash without scroll
                                        window.history.pushState(null, '', `#${hash}`);
                                    }
                                };

                                return (
                                    <a
                                        key={item.id}
                                        href={item.link_url}
                                        onClick={handleHashClick}
                                    >
                                        {cardContent}
                                    </a>
                                );
                            }

                            // Internal route link
                            return (
                                <Link key={item.id} to={item.link_url}>
                                    {cardContent}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export { getIconComponent, iconMap };
