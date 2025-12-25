import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignsApi } from '../../services/api/campaigns';
import { companiesApi } from '../../services/api/companies';
import { adminUserService } from '../../services/api/adminUserService';
import type { Campaign, Company } from '../../types/database';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalCompanies: 0,
        activeCompanies: 0,
        // Member Stats
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        bannedMembers: 0,
        todayLogins: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
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
                // Member Stats
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

    const statCards = [
        {
            label: 'Toplam Üye',
            value: stats.totalMembers,
            active: stats.activeMembers,
            activeLabel: 'aktif',
            icon: '👥',
            color: 'from-green-500 to-green-600',
            link: '/admin/users',
        },
        {
            label: 'Bugün Giriş',
            value: stats.todayLogins,
            active: stats.bannedMembers,
            activeLabel: 'banlı',
            icon: '📊',
            color: 'from-amber-500 to-amber-600',
            link: '/admin/users',
        },
        {
            label: 'Toplam Kampanya',
            value: stats.totalCampaigns,
            active: stats.activeCampaigns,
            activeLabel: 'aktif',
            icon: '🎁',
            color: 'from-blue-500 to-blue-600',
            link: '/admin/campaigns',
        },
        {
            label: 'Toplam Firma',
            value: stats.totalCompanies,
            active: stats.activeCompanies,
            activeLabel: 'aktif',
            icon: '🏢',
            color: 'from-purple-500 to-purple-600',
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
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Hoş geldiniz! İşte sitenizin genel durumu.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                    >
                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${stat.color} text-white text-2xl mb-4`}>
                            {stat.icon}
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">{stat.label}</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        <p className="text-sm text-green-600 mt-1">
                            {stat.active} {stat.activeLabel || 'aktif'}
                        </p>
                    </Link>
                ))}
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Hızlı Erişim</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {quickLinks.map((link, index) => (
                        <Link
                            key={index}
                            to={link.path}
                            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 border border-gray-100 flex items-center gap-3"
                        >
                            <span className="text-2xl">{link.icon}</span>
                            <span className="text-sm font-medium text-gray-700">{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Bilgi</h3>
                <p className="text-gray-700">
                    Sol menüden tüm modüllere erişebilirsiniz. Kampanyalar ve firmalar için görsel yükleme
                    özelliği mevcuttur. Tüm değişiklikler otomatik olarak kaydedilir.
                </p>
            </div>
        </div>
    );
};
