import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignsApi } from '../../services/api/campaigns';
import { companiesApi } from '../../services/api/companies';
import { adminUserService } from '../../services/api/adminUserService';
import { analyticsService, AnalyticsData, DataHealthInfo } from '../../services/api/analytics';
import { Users, TrendingUp, Eye, FileDown, Sparkles, Save, RefreshCw, ExternalLink, Activity, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

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

    useEffect(() => {
        loadStats();
        loadAnalytics();
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

    const refreshAnalytics = async () => {
        setHealthRefreshing(true);
        await loadAnalytics(true);
        setHealthRefreshing(false);
    };

    // Format date for display
    const formatDate = (isoString: string | null) => {
        if (!isoString) return 'Bilinmiyor';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Geçersiz tarih';
        }
    };

    // Get health status colors and icons
    const getHealthStatusUI = (status: DataHealthInfo['status'] | undefined) => {
        switch (status) {
            case 'healthy':
                return {
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                    textColor: 'text-green-700 dark:text-green-400',
                    icon: CheckCircle,
                    label: 'Sağlıklı',
                };
            case 'warning':
                return {
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                    borderColor: 'border-yellow-200 dark:border-yellow-800',
                    textColor: 'text-yellow-700 dark:text-yellow-400',
                    icon: AlertTriangle,
                    label: 'Uyarı',
                };
            case 'error':
            default:
                return {
                    bgColor: 'bg-red-50 dark:bg-red-900/20',
                    borderColor: 'border-red-200 dark:border-red-800',
                    textColor: 'text-red-700 dark:text-red-400',
                    icon: XCircle,
                    label: 'Hata',
                };
        }
    };

    const statCards = [
        {
            label: 'Toplam Üye',
            value: stats.totalMembers,
            active: stats.activeMembers,
            activeLabel: 'aktif',
            icon: '👥',
            color: 'bg-green-500',
            link: '/admin/users',
        },
        {
            label: 'Bugün Giriş',
            value: stats.todayLogins,
            active: stats.bannedMembers,
            activeLabel: 'banlı',
            icon: '📊',
            color: 'bg-amber-500',
            link: '/admin/users',
        },
        {
            label: 'Toplam Kampanya',
            value: stats.totalCampaigns,
            active: stats.activeCampaigns,
            activeLabel: 'aktif',
            icon: '🎁',
            color: 'bg-blue-500',
            link: '/admin/campaigns',
        },
        {
            label: 'Toplam Firma',
            value: stats.totalCompanies,
            active: stats.activeCompanies,
            activeLabel: 'aktif',
            icon: '🏢',
            color: 'bg-purple-500',
            link: '/admin/companies',
        },
    ];

    const quickLinks = [
        { label: 'Ana Sayfa İçerik', path: '/admin/home-content', icon: '🏠' },
        { label: 'Site Ayarları', path: '/admin/site-settings', icon: '⚙️' },
        { label: 'Navigasyon', path: '/admin/navigation', icon: '📋' },
        { label: 'Sektör Gündemi', path: '/admin/ticker', icon: '⚡' },
        { label: 'Ana Sayfa Hero', path: '/admin/home-hero', icon: '🎨' },
        { label: 'Hesaplama Ayarları', path: '/admin/calculator', icon: '🔢' },
        { label: 'Sponsor Yönetimi', path: '/admin/sponsors', icon: '💎' },
        { label: 'Sektör Haberleri', path: '/admin/news', icon: '📰' },
        { label: 'Blog', path: '/admin/blog', icon: '✍️' },
        { label: 'İletişim', path: '/admin/contact', icon: '📧' },
        { label: 'Medya Kütüphanesi', path: '/admin/media', icon: '🖼️' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Hoş geldiniz! İşte sitenizin genel durumu.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
                    >
                        <div className={`inline-flex p-3 rounded-lg ${stat.color} text-white text-2xl mb-4`}>
                            {stat.icon}
                        </div>
                        <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            {stat.active} {stat.activeLabel || 'aktif'}
                        </p>
                    </Link>
                ))}
            </div>

            {/* Data Health Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="text-[#0855f8]" size={20} />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Veri Sağlığı</h2>
                        <div className="group relative">
                            <Info size={14} className="text-gray-400 cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] shadow-lg">
                                Bu alan Google Analytics veri akışının sağlığını gösterir.
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={refreshAnalytics}
                        disabled={healthRefreshing || analyticsLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        title="Yeniden Dene"
                    >
                        <RefreshCw size={14} className={healthRefreshing || analyticsLoading ? 'animate-spin' : ''} />
                        Yeniden Dene
                    </button>
                </div>

                {analyticsLoading && !dataHealth ? (
                    <div className="p-6 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="p-4">
                        {(() => {
                            const statusUI = getHealthStatusUI(dataHealth?.status);
                            const StatusIcon = statusUI.icon;
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Connection Status */}
                                    <div className={`p-4 rounded-xl border ${statusUI.borderColor} ${statusUI.bgColor}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <StatusIcon size={18} className={statusUI.textColor} />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">GA4 Bağlantı</span>
                                        </div>
                                        <p className={`text-lg font-bold ${statusUI.textColor}`}>
                                            {dataHealth?.isConnected ? '✅ Bağlı' : '❌ Bağlantı Sorunu'}
                                        </p>
                                    </div>

                                    {/* Last Update Time */}
                                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <div className="flex items-center gap-2 mb-2">
                                            <RefreshCw size={18} className="text-gray-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Son Güncelleme</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {formatDate(dataHealth?.lastFetchedAt || null)}
                                        </p>
                                        {dataHealth?.isDataStale && (
                                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">24 saatten eski</p>
                                        )}
                                    </div>

                                    {/* Error Status */}
                                    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle size={18} className="text-gray-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Son Hata</span>
                                        </div>
                                        {dataHealth?.hasError && dataHealth?.errorMessage ? (
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400 truncate" title={dataHealth.errorMessage}>
                                                {dataHealth.errorMessage.length > 40
                                                    ? dataHealth.errorMessage.substring(0, 40) + '...'
                                                    : dataHealth.errorMessage}
                                            </p>
                                        ) : (
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Hata yok</p>
                                        )}
                                    </div>

                                    {/* Overall Status Indicator */}
                                    <div className={`p-4 rounded-xl border ${statusUI.borderColor} ${statusUI.bgColor}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity size={18} className={statusUI.textColor} />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Genel Durum</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${dataHealth?.status === 'healthy' ? 'bg-green-500' :
                                                dataHealth?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}></div>
                                            <p className={`text-lg font-bold ${statusUI.textColor}`}>
                                                {statusUI.label}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* GA4 Analytics Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-[#0855f8]" size={24} />
                        Site Analitiği (Son 7 Gün)
                    </h2>
                    <button
                        onClick={refreshAnalytics}
                        disabled={analyticsLoading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={analyticsLoading ? 'animate-spin' : ''} />
                        Yenile
                    </button>
                </div>

                {analyticsError ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
                        <p className="text-yellow-700 dark:text-yellow-400 mb-2">{analyticsError}</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-500">
                            GA4 entegrasyonunu aktifleştirmek için Supabase Edge Function'ı deploy edin.
                        </p>
                    </div>
                ) : analyticsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700 animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3"></div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                ) : analytics && (
                    <>
                        {/* Main Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                                    <Users size={16} />
                                    Kullanıcılar
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.users.toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                                    <TrendingUp size={16} />
                                    Oturumlar
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.sessions.toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                                    <Eye size={16} />
                                    Sayfa Görüntüleme
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.pageViews.toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                                    <FileDown size={16} />
                                    PDF İndirme
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.events.pdf_download.toLocaleString('tr-TR')}</p>
                            </div>
                        </div>

                        {/* Event Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-[#0855f8]/5 dark:bg-[#0855f8]/10 rounded-xl p-4 border border-[#0855f8]/20">
                                <div className="flex items-center gap-2 text-[#0855f8] text-sm mb-1">
                                    <Sparkles size={16} />
                                    AI Butonu Tıklaması
                                </div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{analytics.events.ai_button_click}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm mb-1">
                                    <Save size={16} />
                                    Hesaplama Kaydı
                                </div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{analytics.events.calculation_saved}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm mb-1">
                                    <ExternalLink size={16} />
                                    Link Paylaşımı
                                </div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {(analytics.events.share_link_copy || 0) + (analytics.events.share_whatsapp || 0)}
                                </p>
                            </div>
                        </div>

                        {/* Top Pages */}
                        {analytics.topPages.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">En Çok Ziyaret Edilen Sayfalar</h3>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {analytics.topPages.slice(0, 5).map((page, index) => (
                                        <div key={index} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70%]">{page.path}</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{page.views.toLocaleString('tr-TR')}</span>
                                        </div>
                                    ))}
                                </div>
                                {analytics.lastUpdated && (
                                    <div className="px-5 py-2 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
                                        Son güncelleme: {new Date(analytics.lastUpdated).toLocaleString('tr-TR')}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Hızlı Erişim</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {quickLinks.map((link, index) => (
                        <Link
                            key={index}
                            to={link.path}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700 flex items-center gap-3"
                        >
                            <span className="text-2xl">{link.icon}</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">💡 Bilgi</h3>
                <p className="text-gray-700 dark:text-gray-300">
                    Sol menüden tüm modüllere erişebilirsiniz. Kampanyalar ve firmalar için görsel yükleme
                    özelliği mevcuttur. Tüm değişiklikler otomatik olarak kaydedilir.
                </p>
            </div>
        </div>
    );
};
