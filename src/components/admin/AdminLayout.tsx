import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { ToastContainer } from './Toast';
import { useToast } from '../../hooks/useToast';
import { useUnreadMessagesCount } from '../../hooks/useUnreadMessagesCount';
import { Menu, X, Facebook, Instagram, Linkedin } from 'lucide-react';
import { siteSettingsApi } from '../../services/api/siteSettings';
import type { SiteSettings } from '../../types/database';

// Custom X (Twitter) Icon
const XIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

export const AdminLayout: React.FC = () => {
    const { isAuthenticated, loading, logout } = useAuth();
    const { toasts, removeToast } = useToast();
    const { count: unreadCount } = useUnreadMessagesCount();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

    // Load site settings to get social media URLs
    useEffect(() => {
        const loadSiteSettings = async () => {
            try {
                const settings = await siteSettingsApi.getSettings();
                if (settings) {
                    setSiteSettings(settings);
                }
            } catch (error) {
                console.error('Error loading site settings for social icons:', error);
            }
        };
        loadSiteSettings();
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, []);

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileSidebarOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileSidebarOpen]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Fixed on both mobile and desktop, slide-in on mobile */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <AdminSidebar
                    onLogout={handleLogout}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
                {/* Top Header Bar */}
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-3">
                        {/* Hamburger Menu Button - Mobile Only */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                            aria-label="Menüyü Aç"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Admin Panel</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Message Notification Badge */}
                        <Link
                            to="/admin/contact?tab=messages"
                            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Gelen Mesajlar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center shadow-sm">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>

                        {/* Social Media Links - From Site Settings */}
                        {(siteSettings?.facebook_url || siteSettings?.twitter_url || siteSettings?.instagram_url || siteSettings?.linkedin_url) && (
                            <div className="hidden sm:flex items-center gap-1 px-2 border-l border-r border-gray-200 dark:border-gray-700">
                                {siteSettings?.facebook_url && (
                                    <a
                                        href={siteSettings.facebook_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#1877F2] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Facebook"
                                        aria-label="Facebook"
                                    >
                                        <Facebook size={18} />
                                    </a>
                                )}
                                {siteSettings?.instagram_url && (
                                    <a
                                        href={siteSettings.instagram_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#E4405F] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Instagram"
                                        aria-label="Instagram"
                                    >
                                        <Instagram size={18} />
                                    </a>
                                )}
                                {siteSettings?.twitter_url && (
                                    <a
                                        href={siteSettings.twitter_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="X (Twitter)"
                                        aria-label="X (Twitter)"
                                    >
                                        <XIcon size={18} />
                                    </a>
                                )}
                                {siteSettings?.linkedin_url && (
                                    <a
                                        href={siteSettings.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#0A66C2] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="LinkedIn"
                                        aria-label="LinkedIn"
                                    >
                                        <Linkedin size={18} />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Site Settings Shortcut */}
                        <Link
                            to="/admin/site-settings"
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Site Ayarları"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </Link>

                        {/* Siteyi Canlı Gör Button */}
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="hidden sm:inline">Siteyi Canlı Gör</span>
                            <span className="sm:hidden">Canlı</span>
                            <svg className="w-3 h-3 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>

            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
};
