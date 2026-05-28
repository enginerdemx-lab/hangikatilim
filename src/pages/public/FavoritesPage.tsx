import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Building2, Newspaper, BookOpen, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { favoritesApi, type FavoriteItemType, type FavoriteWithDetails } from '../../services/api/favorites';

type TabType = 'all' | 'company' | 'news' | 'blog';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tümü', icon: <Heart size={16} /> },
    { key: 'company', label: 'Firmalar', icon: <Building2 size={16} /> },
    { key: 'news', label: 'Haberler', icon: <Newspaper size={16} /> },
    { key: 'blog', label: 'Blog', icon: <BookOpen size={16} /> },
];

const TYPE_CONFIG: Record<FavoriteItemType, { label: string; color: string; basePath: string }> = {
    company: { label: 'Firma', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', basePath: '/katilim-firmalari' },
    news: { label: 'Haber', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', basePath: '/sektor-haberleri' },
    blog: { label: 'Blog', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400', basePath: '/blog' },
};

export const FavoritesPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadFavorites();
    }, [user]);

    const loadFavorites = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await favoritesApi.getUserFavoritesWithDetails(user.id);
            setFavorites(data);
        } catch (error) {
            console.error('Favoriler yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (fav: FavoriteWithDetails) => {
        if (!user) return;
        setRemovingId(fav.id);
        try {
            await favoritesApi.removeFavorite(user.id, fav.item_type, fav.item_id);
            setFavorites(prev => prev.filter(f => f.id !== fav.id));
        } catch (error) {
            console.error('Favori silinemedi:', error);
        } finally {
            setRemovingId(null);
        }
    };

    const getItemUrl = (fav: FavoriteWithDetails): string => {
        const config = TYPE_CONFIG[fav.item_type];
        if (fav.item_type === 'company') return config.basePath;
        return fav.slug ? `${config.basePath}/${fav.slug}` : config.basePath;
    };

    const filteredFavorites = activeTab === 'all'
        ? favorites
        : favorites.filter(f => f.item_type === activeTab);

    const counts = {
        all: favorites.length,
        company: favorites.filter(f => f.item_type === 'company').length,
        news: favorites.filter(f => f.item_type === 'news').length,
        blog: favorites.filter(f => f.item_type === 'blog').length,
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Heart size={28} className="text-red-500" />
                    Favorilerim
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Kaydettiğin firma, haber ve blog yazıları
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                            activeTab === tab.key
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {counts[tab.key] > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === tab.key
                                    ? 'bg-white/20 dark:bg-slate-900/20'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}>
                                {counts[tab.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            {filteredFavorites.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <Heart size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {activeTab === 'all' ? 'Henüz favori eklenmemiş' : 'Bu kategoride favori yok'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Beğendiğin içeriklerdeki kalp ikonuna tıklayarak favorilerine ekleyebilirsin
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredFavorites.map(fav => {
                        const config = TYPE_CONFIG[fav.item_type];
                        return (
                            <div
                                key={fav.id}
                                className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all"
                            >
                                {/* Image */}
                                {fav.image_url ? (
                                    <img
                                        src={fav.image_url}
                                        alt={fav.title}
                                        className={`flex-shrink-0 object-cover rounded-lg ${
                                            fav.item_type === 'company' ? 'w-14 h-14 p-1 border border-slate-200 dark:border-slate-700 bg-white' : 'w-20 h-14'
                                        }`}
                                    />
                                ) : (
                                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {fav.item_type === 'company' ? <Building2 size={20} className="text-slate-400" /> :
                                         fav.item_type === 'news' ? <Newspaper size={20} className="text-slate-400" /> :
                                         <BookOpen size={20} className="text-slate-400" />}
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {fav.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${config.color}`}>
                                            {config.label}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            {new Date(fav.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        to={getItemUrl(fav)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Görüntüle"
                                    >
                                        <ExternalLink size={16} />
                                    </Link>
                                    <button
                                        onClick={() => handleRemove(fav)}
                                        disabled={removingId === fav.id}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                        title="Favorilerden çıkar"
                                    >
                                        {removingId === fav.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;
