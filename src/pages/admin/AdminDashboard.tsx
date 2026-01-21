import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campaignsApi } from '../../services/api/campaigns';
import { companiesApi } from '../../services/api/companies';
import { adminUserService } from '../../services/api/adminUserService';
import { analyticsService, AnalyticsData, DataHealthInfo } from '../../services/api/analytics';
import { serverStatsService, ServerStats } from '../../services/api/serverStats';
import { useAuth } from '../../hooks/useAuth';
import {
    Users,
    TrendingUp,
    Eye,
    FileDown,
    RefreshCw,
    Activity,
    Search,
    Building2,
    Megaphone,
    CalendarDays,
    Info,
    ExternalLink,
    Database,
    HardDrive,
    FolderOpen,
    Server
} from 'lucide-react';

// Reusable Card Component
const Card: React.FC<{
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}> = ({ children, className = '', hover = true }) => (
    <div className={`
        rounded-2xl border border-slate-200 dark:border-slate-700 
        bg-white dark:bg-slate-800 p-5 shadow-sm 
        ${hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:scale-[1.02]' : ''}
        ${className}
    `}>
        {children}
    </div>
);

// KPI Stat Card Component - with role-based link control
const StatCard: React.FC<{
    label: string;
    value: number;
    subValue?: string;
    icon: React.ElementType;
    to: string;
    allowedRoles?: string[]; // Roles that can click the link
}> = ({ label, value, subValue, icon: Icon, to, allowedRoles }) => {
    const { adminRole } = useAuth();

    // Check if user can access this link
    const canAccess = !allowedRoles ||
        adminRole === null ||
        adminRole === 'superadmin' ||
        allowedRoles.includes(adminRole);

    const content = (
        <Card className={!canAccess ? 'cursor-default' : ''}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                        {value.toLocaleString('tr-TR')}
                    </p>
                    {subValue && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subValue}</p>
                    )}
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
                    <Icon size={20} className="text-slate-500 dark:text-slate-400" />
                </div>
            </div>
        </Card>
    );

    // If user can't access, don't wrap in Link
    if (!canAccess) {
        return content;
    }

    return <Link to={to}>{content}</Link>;
};

// Analytics Metric Card Component  
const MetricCard: React.FC<{
    label: string;
    value: number;
    icon: React.ElementType;
}> = ({ label, value, icon: Icon }) => (
    <Card>
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
                <Icon size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {value.toLocaleString('tr-TR')}
                </p>
            </div>
        </div>
    </Card>
);

// Status Dot Component
const StatusDot: React.FC<{ status: 'healthy' | 'warning' | 'error' }> = ({ status }) => {
    const colors = {
        healthy: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    };
    return <div className={`w-2 h-2 rounded-full ${colors[status]}`} />;
};

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalCompanies: 0,
        activeCompanies: 0,
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        bannedMembers: 0,
        todayLogins: 0,
    });
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState<string | null>(null);
    const [dataHealth, setDataHealth] = useState<DataHealthInfo | null>(null);
    const [healthRefreshing, setHealthRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Server Stats
    const [serverStats, setServerStats] = useState<ServerStats | null>(null);
    const [serverStatsLoading, setServerStatsLoading] = useState(true);
    const [serverStatsError, setServerStatsError] = useState<string | null>(null);

    // Quick search items
    const searchItems = [
        { label: 'Üyeler', path: '/admin/users', keywords: ['üye', 'user', 'kullanıcı', 'üyeler'] },
        { label: 'Firmalar', path: '/admin/companies', keywords: ['firma', 'company', 'şirket', 'firmalar'] },
        { label: 'Kampanyalar', path: '/admin/campaigns', keywords: ['kampanya', 'campaign', 'kampanyalar'] },
        { label: 'Sektör Haberleri', path: '/admin/news', keywords: ['haber', 'news', 'sektör', 'haberler'] },
        { label: 'Blog', path: '/admin/blog', keywords: ['blog', 'yazı', 'makale'] },
        { label: 'Site Ayarları', path: '/admin/site-settings', keywords: ['ayar', 'setting', 'site', 'yapılandırma'] },
        { label: 'Hesaplama Aracı', path: '/admin/calculator', keywords: ['hesap', 'calculator', 'hesaplama', 'araç'] },
        { label: 'İletişim', path: '/admin/contact', keywords: ['iletişim', 'contact', 'mesaj', 'mail'] },
        { label: 'Navigasyon', path: '/admin/navigation', keywords: ['navigasyon', 'nav', 'menü', 'menu'] },
        { label: 'Ana Sayfa Hero', path: '/admin/home-hero', keywords: ['hero', 'slider', 'banner', 'ana sayfa'] },
        { label: 'Medya Kütüphanesi', path: '/admin/media', keywords: ['medya', 'media', 'resim', 'görsel', 'dosya'] },
        { label: 'Sponsorlar', path: '/admin/sponsors', keywords: ['sponsor', 'reklam'] },
    ];

    const filteredSearchItems = searchQuery.trim()
        ? searchItems.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : searchItems.slice(0, 5);

    useEffect(() => {
        loadStats();
        loadAnalytics();
        loadServerStats();

        // Keyboard shortcut: "/" to focus search
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const loadStats = async () => {
        try {
            const [campaigns, companies, memberStats] = await Promise.all([
                campaignsApi.getAllCampaigns(),
                companiesApi.getAllCompanies(),
                adminUserService.getStatistics(),
            ]);

            setStats({
                totalCampaigns: campaigns.length,
                activeCampaigns: campaigns.filter((c) => c.is_active).length,
                totalCompanies: companies.length,
                activeCompanies: companies.filter((c) => c.is_active).length,
                totalMembers: memberStats.total,
                activeMembers: memberStats.active,
                inactiveMembers: memberStats.inactive,
                bannedMembers: memberStats.banned,
                todayLogins: memberStats.todayLogins,
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async (forceRefresh = false) => {
        setAnalyticsLoading(true);
        setAnalyticsError(null);
        try {
            const data = forceRefresh
                ? await analyticsService.forceRefresh()
                : await analyticsService.getOverview();

            setAnalytics(data);
            setDataHealth(analyticsService.getDataHealth(data));

            if (data.error) {
                setAnalyticsError(data.error);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            setAnalyticsError('Analytics verisi yüklenemedi');
            setDataHealth(analyticsService.getDataHealth(null));
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const refreshAll = async () => {
        setHealthRefreshing(true);
        await Promise.all([loadStats(), loadAnalytics(true), loadServerStats(true)]);
        setHealthRefreshing(false);
    };

    const loadServerStats = async (forceRefresh = false) => {
        setServerStatsLoading(true);
        setServerStatsError(null);
        try {
            const data = await serverStatsService.getStats(forceRefresh);
            setServerStats(data);
            if (data.error) {
                setServerStatsError(data.error);
            }
        } catch (error) {
            console.error('Failed to load server stats:', error);
            setServerStatsError('Sunucu istatistikleri yüklenemedi');
        } finally {
            setServerStatsLoading(false);
        }
    };

    const formatDate = (isoString: string | null) => {
        if (!isoString) return '—';
        try {
            return new Date(isoString).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '—';
        }
    };

    const getHealthStatus = (): 'healthy' | 'warning' | 'error' => {
        if (!dataHealth) return 'error';
        return dataHealth.status;
    };

    const getHealthLabel = () => {
        const status = getHealthStatus();
        switch (status) {
            case 'healthy': return 'Sağlıklı';
            case 'warning': return 'Uyarı';
            case 'error': return 'Hata';
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Sitenizin genel durumu ve istatistikleri
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setSearchFocused(false);
                                    searchInputRef.current?.blur();
                                }
                                if (e.key === 'Enter' && filteredSearchItems.length > 0) {
                                    navigate(filteredSearchItems[0].path);
                                    setSearchFocused(false);
                                    setSearchQuery('');
                                }
                            }}
                            placeholder="Üye, firma, kampanya ara…"
                            className="w-64 pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent placeholder:text-slate-400"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            /
                        </kbd>

                        {/* Search Dropdown */}
                        {searchFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                                {filteredSearchItems.length > 0 ? (
                                    <div className="max-h-64 overflow-y-auto">
                                        {filteredSearchItems.map((item) => (
                                            <button
                                                key={item.path}
                                                onClick={() => {
                                                    navigate(item.path);
                                                    setSearchQuery('');
                                                    setSearchFocused(false);
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                            >
                                                <Search size={14} className="text-slate-400" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                        Sonuç bulunamadı
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Refresh Button */}
                    <button
                        onClick={refreshAll}
                        disabled={healthRefreshing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={healthRefreshing ? 'animate-spin' : ''} />
                        Yenile
                    </button>
                </div>
            </div>

            {/* KPI Row - 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Toplam Üye"
                    value={stats.totalMembers}
                    subValue={`${stats.activeMembers} aktif`}
                    icon={Users}
                    to="/admin/members"
                    allowedRoles={['superadmin']}
                />
                <StatCard
                    label="Bugün Giriş"
                    value={stats.todayLogins}
                    subValue="son 24 saat"
                    icon={CalendarDays}
                    to="/admin/members"
                    allowedRoles={['superadmin']}
                />
                <StatCard
                    label="Toplam Kampanya"
                    value={stats.totalCampaigns}
                    subValue={`${stats.activeCampaigns} aktif`}
                    icon={Megaphone}
                    to="/admin/campaigns"
                    allowedRoles={['superadmin']}
                />
                <StatCard
                    label="Toplam Firma"
                    value={stats.totalCompanies}
                    subValue={`${stats.activeCompanies} aktif`}
                    icon={Building2}
                    to="/admin/companies"
                    allowedRoles={['superadmin']}
                />
            </div>

            {/* Data Health Card - Compact */}
            <Card hover={false}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Activity size={18} className="text-slate-500 dark:text-slate-400" />
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Veri Sağlığı</h2>
                        <div className="group relative">
                            <Info size={14} className="text-slate-400 cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                                Bu alan Google Analytics veri akışının sağlığını gösterir.
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900"></div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => loadAnalytics(true)}
                        disabled={analyticsLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={analyticsLoading ? 'animate-spin' : ''} />
                        Yeniden Dene
                    </button>
                </div>

                {analyticsLoading && !dataHealth ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* GA4 Connection */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-sm text-slate-600 dark:text-slate-400">GA4 Bağlantı</span>
                            <div className="flex items-center gap-2">
                                <StatusDot status={dataHealth?.isConnected ? 'healthy' : 'error'} />
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {dataHealth?.isConnected ? 'Bağlı' : 'Sorun'}
                                </span>
                            </div>
                        </div>

                        {/* Last Update */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Son Güncelleme</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {formatDate(dataHealth?.lastFetchedAt || null)}
                            </span>
                        </div>

                        {/* Last Error */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Son Hata</span>
                            <span className={`text-sm font-medium truncate max-w-[120px] ${dataHealth?.hasError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {dataHealth?.hasError ? (dataHealth.errorMessage?.slice(0, 20) + '...') : 'Hata yok'}
                            </span>
                        </div>

                        {/* Overall Status */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Genel Durum</span>
                            <div className="flex items-center gap-2">
                                <StatusDot status={getHealthStatus()} />
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                    {getHealthLabel()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Site Analytics Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={20} className="text-slate-500 dark:text-slate-400" />
                        Site Analitiği
                        <span className="text-sm font-normal text-slate-400">(Son 7 Gün)</span>
                    </h2>
                </div>

                {analyticsError ? (
                    <Card hover={false} className="text-center py-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{analyticsError}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            GA4 entegrasyonunu aktifleştirmek için Edge Function'ı deploy edin.
                        </p>
                    </Card>
                ) : analyticsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} hover={false} className="animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                        <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : analytics && (
                    <>
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard label="Kullanıcılar" value={analytics.users} icon={Users} />
                            <MetricCard label="Oturumlar" value={analytics.sessions} icon={TrendingUp} />
                            <MetricCard label="Sayfa Görüntüleme" value={analytics.pageViews} icon={Eye} />
                            <MetricCard label="PDF İndirme" value={analytics.events.pdf_download} icon={FileDown} />
                        </div>

                        {/* Top Pages Table */}
                        {analytics.topPages.length > 0 && (
                            <Card hover={false}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        En Çok Ziyaret Edilen Sayfalar
                                    </h3>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full">
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {analytics.topPages.slice(0, 5).map((page, index) => (
                                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="py-2.5 pr-4">
                                                        <span className="text-sm text-slate-600 dark:text-slate-300 truncate block max-w-[400px]">
                                                            {page.path}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {page.views.toLocaleString('tr-TR')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {analytics.lastUpdated && (
                                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                        Son güncelleme: {formatDate(analytics.lastUpdated)}
                                    </p>
                                )}
                            </Card>
                        )}
                    </>
                )}
            </div>

            {/* Server Stats Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Server size={20} className="text-slate-500 dark:text-slate-400" />
                        Sunucu Durumu
                    </h2>
                </div>

                {serverStatsError ? (
                    <Card hover={false} className="text-center py-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{serverStatsError}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            server-stats Edge Function'ı deploy edilmeli.
                        </p>
                    </Card>
                ) : serverStatsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} hover={false} className="animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                        <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : serverStats && (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                        <Database size={18} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Veritabanı Boyutu</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                                            {serverStats.database.totalSize}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                                        <HardDrive size={18} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tablo Sayısı</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                                            {serverStats.database.tableCount}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                        <FolderOpen size={18} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Depolama Dosyaları</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                                            {serverStats.storage.totalFiles}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                                        <Users size={18} className="text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Auth Kullanıcıları</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                                            {serverStats.auth.totalUsers}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Tables List */}
                        {serverStats.database.tables.length > 0 && (
                            <Card hover={false}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        En Büyük Tablolar (Kayıt Sayısı)
                                    </h3>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-800">
                                            <tr className="border-b border-slate-100 dark:border-slate-700">
                                                <th className="text-left text-xs font-medium text-slate-500 py-2">Tablo</th>
                                                <th className="text-right text-xs font-medium text-slate-500 py-2">Kayıt</th>
                                                <th className="text-right text-xs font-medium text-slate-500 py-2">Boyut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {serverStats.database.tables.map((table, index) => (
                                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="py-2.5 pr-4">
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                                            {table.name}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {table.rowCount.toLocaleString('tr-TR')}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 text-right">
                                                        <span className="text-xs text-slate-500">
                                                            {table.sizePretty}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {serverStats.timestamp && (
                                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                        Son güncelleme: {formatDate(serverStats.timestamp)}
                                    </p>
                                )}
                            </Card>
                        )}

                        {/* Storage Buckets */}
                        {serverStats.storage.buckets.length > 0 && (
                            <Card hover={false}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Depolama Bucket'ları
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {serverStats.storage.buckets.map((bucket, index) => (
                                        <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                            <p className="text-xs font-medium text-slate-500 truncate">{bucket.name}</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">{bucket.fileCount}</p>
                                            <p className="text-xs text-slate-400">dosya</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
