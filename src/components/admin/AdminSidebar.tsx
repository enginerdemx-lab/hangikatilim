import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth, type AdminRole } from '../../hooks/useAuth';
import {
    LayoutDashboard,
    Users,
    Calculator,
    Star,
    Building2,
    Megaphone,
    Newspaper,
    FileText,
    Zap,
    Image,
    Grid3X3,
    Home,
    Settings,
    FolderOpen,
    Mail,
    MessageSquare,
    LogOut,
    ChevronDown,
    ChevronUp,
    PanelLeftClose,
    PanelLeft,
    Sun,
    Moon,
    Monitor,
    X,
    Bell,
    ImagePlus,
    Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Menu Item Interface - with role-based access
interface MenuItem {
    label: string;
    path: string;
    icon: LucideIcon;
    allowedRoles?: AdminRole[]; // If undefined, superadmin only. If empty array, all admins can access.
}

// Category Interface
interface MenuCategory {
    id: string;
    label: string;
    icon: LucideIcon;
    items: MenuItem[];
    allowedRoles?: AdminRole[]; // Category-level role restriction
}

// Role definitions for easier configuration
const ALL_ROLES: AdminRole[] = ['superadmin', 'social_media', 'news_editor', 'content_manager'];
const CONTENT_ROLES: AdminRole[] = ['superadmin', 'content_manager', 'news_editor'];

// Menu Configuration - Centralized & Config-based with role permissions
const menuConfig: MenuCategory[] = [
    {
        id: 'general',
        label: 'Genel',
        icon: LayoutDashboard,
        items: [
            { label: 'Dashboard', path: '/admin', icon: Home, allowedRoles: ALL_ROLES },
        ],
    },
    {
        id: 'users',
        label: 'Kullanıcı & Yetkilendirme',
        icon: Users,
        allowedRoles: ['superadmin'],
        items: [
            { label: 'Üyeler', path: '/admin/members', icon: Users },
        ],
    },
    {
        id: 'calculator',
        label: 'Hesaplama & Finans',
        icon: Calculator,
        allowedRoles: ['superadmin'],
        items: [
            { label: 'Hesaplama Ayarları', path: '/admin/calculator', icon: Calculator },
            { label: 'Geri Bildirimler', path: '/admin/feedback', icon: MessageSquare },
        ],
    },
    {
        id: 'sponsors',
        label: 'Sponsor & Gelir',
        icon: Star,
        allowedRoles: ['superadmin'],
        items: [
            { label: 'Sponsor Yönetimi', path: '/admin/sponsors', icon: Star },
        ],
    },
    {
        id: 'content',
        label: 'İçerik Yönetimi',
        icon: FileText,
        allowedRoles: CONTENT_ROLES,
        items: [
            { label: 'Firmalar', path: '/admin/companies', icon: Building2, allowedRoles: ['superadmin', 'content_manager'] },
            { label: 'Kampanyalar', path: '/admin/campaigns', icon: Megaphone, allowedRoles: ['superadmin', 'content_manager'] },
            { label: 'Sektör Haberleri', path: '/admin/news', icon: Newspaper, allowedRoles: ['superadmin', 'news_editor', 'content_manager'] },
            { label: 'Blog', path: '/admin/blog', icon: FileText, allowedRoles: ['superadmin', 'content_manager'] },
            { label: 'Hakkımızda', path: '/admin/about-settings', icon: Info, allowedRoles: ['superadmin', 'content_manager'] },
            { label: 'Sektör Gündemi', path: '/admin/ticker', icon: Zap, allowedRoles: ['superadmin', 'content_manager'] },
            { label: 'Kampanya Bannerları', path: '/admin/campaign-banners', icon: Image, allowedRoles: ['superadmin', 'content_manager'] },
        ],
    },
    {
        id: 'homepage',
        label: 'Ana Sayfa & UI',
        icon: Grid3X3,
        allowedRoles: ['superadmin'],
        items: [
            { label: 'Ana Sayfa Hero', path: '/admin/home-hero', icon: Image },
            { label: 'Kısayol Kareleri', path: '/admin/quick-links', icon: Grid3X3 },
            { label: 'Ana Sayfa İçerik', path: '/admin/home-content', icon: Home },
        ],
    },
    {
        id: 'system',
        label: 'Sistem',
        icon: Settings,
        items: [
            { label: 'Site Ayarları', path: '/admin/site-settings', icon: Settings, allowedRoles: ['superadmin'] },
            { label: 'Popup Yönetimi', path: '/admin/popups', icon: MessageSquare, allowedRoles: ['superadmin'] },
            { label: 'Push Bildirimleri', path: '/admin/push-notifications', icon: Bell, allowedRoles: ['superadmin'] },
            { label: 'Medya Kütüphanesi', path: '/admin/media', icon: FolderOpen, allowedRoles: ['superadmin', 'content_manager'] },
            { label: 'İletişim', path: '/admin/contact', icon: Mail, allowedRoles: ['superadmin'] },
            { label: 'E-posta Bildirimleri', path: '/admin/email-notifications', icon: Mail, allowedRoles: ['superadmin'] },
            { label: 'Sosyal Medya Görseli', path: '/admin/social-media-generator', icon: ImagePlus, allowedRoles: ['superadmin', 'social_media'] },
        ],
    },
];

interface AdminSidebarProps {
    onLogout: () => void;
    onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout, onClose }) => {
    const location = useLocation();
    const { adminRole, loading: authLoading } = useAuth();
    const [siteName, setSiteName] = useState<string>('Katılım Uzmanı');
    const [logo, setLogo] = useState<string>('');
    const [darkLogo, setDarkLogo] = useState<string>('');
    const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['general']));
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [userEmail, setUserEmail] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Helper function to check if user has access to a role-restricted item
    // Helper function to check if user has access to a role-restricted item
    const hasAccess = (allowedRoles?: AdminRole[]): boolean => {
        // If adminRole is 'superadmin', user has full access
        if (adminRole === 'superadmin') return true;

        // If adminRole is null (no role), deny access
        if (!adminRole) return false;

        // If no allowedRoles specified on item, it's restricted to superadmin (default secure)
        // OR we can decide base policy. Assuming if no roles specified, it is visible to all AUTHENTICATED admins? 
        // Let's stick to safe default: if list is empty/undefined, do checking vs superadmin (already passed) or deny?
        // Wait, existing code said: "If no allowedRoles specified on item, only superadmin/null can access"
        // Let's change: If allowedRoles is empty/undefined, it is accessible to ALL admins? Or specific ones?
        // Better: require specific roles. If allowedRoles is missing, assume it requires *some* role.

        if (!allowedRoles || allowedRoles.length === 0) {
            // If no specific roles required, allow any admin role (not null)
            return true;
        }

        // Check if user's role is in the allowed list
        return allowedRoles.includes(adminRole);
    };

    // Filter menu based on user role
    const filteredMenu = useMemo(() => {
        return menuConfig
            .filter(category => hasAccess(category.allowedRoles) || category.items.some(item => hasAccess(item.allowedRoles)))
            .map(category => ({
                ...category,
                items: category.items.filter(item => hasAccess(item.allowedRoles))
            }))
            .filter(category => category.items.length > 0);
    }, [adminRole]);

    // Fetch site settings
    useEffect(() => {
        // Redirect if role is null (revoked permissions)
        if (!authLoading && !adminRole) {
            // Use window.location for hard redirect or navigate
            // Since we are in Sidebar, navigate is available via context usually, but Sidebar might be rendered inside Layout.
            // Using window.location.href = '/' ensures full exit from admin app context
            window.location.href = '/';
        }
    }, [adminRole, authLoading]);

    useEffect(() => {
        const fetchSiteSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('site_settings')
                    .select('site_name, logo_url, dark_logo_url')
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    console.error('Failed to fetch site settings:', error);
                    return;
                }

                if (data?.site_name) setSiteName(data.site_name);
                if (data?.logo_url) setLogo(data.logo_url);
                if (data?.dark_logo_url) setDarkLogo(data.dark_logo_url);
            } catch (error) {
                console.error('Failed to fetch site settings:', error);
            }
        };
        fetchSiteSettings();
    }, []);

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || '');
                setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin');
            }
        };
        fetchUser();
    }, []);

    // Load saved theme preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('admin_theme') as 'light' | 'dark' | 'system' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
    }, []);

    const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
        const root = document.documentElement;
        let isDark = false;

        if (newTheme === 'dark') {
            root.classList.add('dark');
            isDark = true;
        } else if (newTheme === 'light') {
            root.classList.remove('dark');
            isDark = false;
        } else {
            // System preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
                isDark = true;
            } else {
                root.classList.remove('dark');
                isDark = false;
            }
        }

        setIsDarkMode(isDark);
    };

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        localStorage.setItem('admin_theme', newTheme);
        applyTheme(newTheme);
    };

    const getUserInitial = () => {
        return userName.charAt(0).toUpperCase() || 'A';
    };

    // Auto-expand category containing active route
    useEffect(() => {
        const activeCategory = filteredMenu.find(cat =>
            cat.items.some(item =>
                item.path === location.pathname ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path))
            )
        );
        if (activeCategory) {
            setOpenCategories(prev => new Set([...prev, activeCategory.id]));
        }
    }, [location.pathname]);

    const toggleCategory = (categoryId: string) => {
        setOpenCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const isItemActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <div
            className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col transition-all duration-300`}
        >
            {/* Header */}
            <div className={`p-4 border-b border-gray-100 dark:border-gray-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                    <div className="flex flex-col items-start min-w-0">
                        {(isDarkMode ? darkLogo : logo) ? (
                            <img src={isDarkMode ? darkLogo : logo} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <div className="w-8 h-8 bg-[#0855f8] rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">K</span>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Admin Panel</p>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    {/* Collapse button - Desktop only */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors hidden lg:block"
                        title={isCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
                    >
                        {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                    {/* Close button - Mobile only */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors lg:hidden"
                            title="Menüyü Kapat"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
                {authLoading ? (
                    /* Skeleton menu during role loading */
                    <div className="space-y-2 px-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
                                <div className="pl-4 space-y-1">
                                    <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    filteredMenu.map((category) => {
                        const isOpen = openCategories.has(category.id);
                        const hasActiveItem = category.items.some(item => isItemActive(item.path));
                        const CategoryIcon = category.icon;

                        return (
                            <div key={category.id} className="mb-1">
                                <button
                                    onClick={() => !isCollapsed && toggleCategory(category.id)}
                                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2 rounded-lg transition-colors group
                  ${hasActiveItem ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                `}
                                    title={isCollapsed ? category.label : undefined}
                                >
                                    <div className={`flex items-center ${isCollapsed ? '' : 'gap-2'}`}>
                                        <CategoryIcon size={18} className={`flex-shrink-0 ${hasActiveItem ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                        {!isCollapsed && (
                                            <span className="text-xs font-semibold uppercase tracking-wide text-left">{category.label}</span>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <ChevronDown
                                            size={14}
                                            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                    )}
                                </button>

                                {/* Category Items */}
                                {!isCollapsed && isOpen && (
                                    <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-0.5">
                                        {category.items.map((item) => {
                                            const isActive = isItemActive(item.path);
                                            const ItemIcon = item.icon;

                                            return (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={onClose}
                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
                          ${isActive
                                                            ? 'bg-[#0855f8] text-white shadow-sm'
                                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                        }
                        `}
                                                >
                                                    <ItemIcon size={16} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'} />
                                                    <span className="font-medium">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Collapsed mode: show items as tooltips */}
                                {isCollapsed && (
                                    <div className="mt-1 space-y-0.5">
                                        {category.items.map((item) => {
                                            const isActive = isItemActive(item.path);
                                            const ItemIcon = item.icon;

                                            return (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200
                          ${isActive
                                                            ? 'bg-[#0855f8] text-white shadow-sm'
                                                            : 'text-gray-500 hover:bg-gray-100'
                                                        }
                        `}
                                                    title={item.label}
                                                >
                                                    <ItemIcon size={18} />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </nav>

            {/* Footer: Theme Toggle + User Profile */}
            <div className="border-t border-gray-200 dark:border-gray-700">
                {/* Theme Toggle */}
                {!isCollapsed && (
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => handleThemeChange('light')}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'light' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                title="Açık Tema"
                            >
                                <Sun size={14} />
                                <span>Light</span>
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                title="Koyu Tema"
                            >
                                <Moon size={14} />
                                <span>Dark</span>
                            </button>
                            <button
                                onClick={() => handleThemeChange('system')}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'system' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                title="Sistem Teması"
                            >
                                <Monitor size={14} />
                                <span>System</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-2 relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                        title={isCollapsed ? userName : undefined}
                    >
                        <div className="w-8 h-8 bg-[#0855f8] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {getUserInitial()}
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
                                </div>
                                {showProfileMenu ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && !isCollapsed && (
                        <div className="absolute bottom-full left-2 right-2 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                            <Link
                                to="/admin/site-settings"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => setShowProfileMenu(false)}
                            >
                                <Settings size={16} />
                                Profil Ayarları
                            </Link>
                            <button
                                onClick={() => { setShowProfileMenu(false); onLogout(); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut size={16} />
                                Çıkış Yap
                            </button>
                        </div>
                    )}

                    {/* Collapsed mode: just logout button */}
                    {isCollapsed && (
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center p-2 mt-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Çıkış Yap"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
