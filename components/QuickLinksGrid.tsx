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

// Skeleton loader
const QuickLinksSkeleton: React.FC = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 md:p-6 shadow-lg animate-pulse">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-xl mx-auto mb-2 md:mb-3"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
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

    // Don't render if disabled or no items
    if (!loading && (!settings?.is_enabled || items.length === 0)) {
        return null;
    }

    // Overlay version (inside hero)
    if (isOverlay) {
        return (
            <div className={`w-full ${className}`}>
                {/* Section Header - Left Aligned */}
                {settings && (settings.section_title || settings.section_subtitle) && (
                    <div className="text-left mb-4 md:mb-6">
                        {settings.section_title && (
                            <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                                {settings.section_title}
                            </h2>
                        )}
                        {settings.section_subtitle && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mt-1">
                                {settings.section_subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Quick Links Grid */}
                {loading ? (
                    <QuickLinksSkeleton />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {items.map((item) => {
                            const IconComponent = getIconComponent(item.icon);
                            const isExternal = item.is_external || item.link_url.startsWith('http');

                            const cardContent = (
                                <div className="group bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-3 md:p-5 shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer text-center relative overflow-hidden hover:-translate-y-1">
                                    {/* Badge */}
                                    {item.badge_text && (
                                        <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[8px] md:text-[10px] font-bold rounded-full">
                                            {item.badge_text}
                                        </span>
                                    )}

                                    {/* Icon */}
                                    <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <IconComponent className="w-5 h-5 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
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

                            // Internal link
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
        <section className={`py-8 md:py-12 ${className}`}>
            <div className="container mx-auto px-4">
                {/* Section Header - Left Aligned */}
                {settings && (settings.section_title || settings.section_subtitle) && (
                    <div className="text-left mb-6 md:mb-8">
                        {settings.section_title && (
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                {settings.section_title}
                            </h2>
                        )}
                        {settings.section_subtitle && (
                            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg mt-1">
                                {settings.section_subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Quick Links Grid */}
                {loading ? (
                    <QuickLinksSkeleton />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {items.map((item) => {
                            const IconComponent = getIconComponent(item.icon);
                            const isExternal = item.is_external || item.link_url.startsWith('http');

                            const cardContent = (
                                <div className="group bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer text-center relative overflow-hidden hover:-translate-y-1">
                                    {/* Badge */}
                                    {item.badge_text && (
                                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold rounded-full">
                                            {item.badge_text}
                                        </span>
                                    )}

                                    {/* Icon */}
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                                        <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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

                            // Internal link
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
