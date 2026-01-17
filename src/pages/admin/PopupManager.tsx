import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Plus, Edit, Trash2, Eye, EyeOff,
    Copy, Clock, Mail, AlertCircle, Loader2,
    CornerRightDown, Square, Maximize, Search, RefreshCw
} from 'lucide-react';
import { popupApi, Popup } from '../../services/popupApi';

const typeConfig = {
    corner: { label: 'Köşe', icon: CornerRightDown, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    modal: { label: 'Modal', icon: Square, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    fullscreen: { label: 'Tam Ekran', icon: Maximize, color: 'bg-orange-50 text-orange-600 border-orange-200' }
};

const templateLabels: Record<string, string> = {
    custom: 'Özel',
    email: 'E-posta',
    membership: 'Üyelik',
    announcement: 'Duyuru',
    discount: 'Kampanya'
};

export const PopupManager: React.FC = () => {
    const navigate = useNavigate();
    const [popups, setPopups] = useState<Popup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPopups = async () => {
        try {
            setLoading(true);
            const data = await popupApi.getAll();
            setPopups(data);
            setError(null);
        } catch (err) {
            setError('Popup\'lar yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPopups();
    }, []);

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await popupApi.toggleActive(id, !currentStatus);
            setPopups(popups.map(p =>
                p.id === id ? { ...p, is_active: !currentStatus } : p
            ));
        } catch (err) {
            console.error('Toggle error:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu popup\'ı silmek istediğinizden emin misiniz?')) return;

        try {
            setDeletingId(id);
            await popupApi.delete(id);
            setPopups(popups.filter(p => p.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDuplicate = async (popup: Popup) => {
        try {
            const { id, created_at, updated_at, ...rest } = popup;
            await popupApi.create({ ...rest, name: `${popup.name} (Kopya)`, is_active: false });
            fetchPopups();
        } catch (err) {
            console.error('Duplicate error:', err);
        }
    };

    const filteredPopups = popups.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = popups.filter(p => p.is_active).length;
    const emailCollectCount = popups.filter(p => p.collect_email).length;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-3">
                            <MessageSquare className="text-blue-600" size={28} />
                            Popup Yönetimi
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Site popup'larını oluşturun ve yönetin
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/popups/new')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
                    >
                        <Plus size={20} />
                        Yeni Popup
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <MessageSquare className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-800">{popups.length}</div>
                                <div className="text-sm text-slate-500">Toplam Popup</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <Eye className="text-green-600" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-800">{activeCount}</div>
                                <div className="text-sm text-slate-500">Aktif Popup</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <Mail className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-slate-800">{emailCollectCount}</div>
                                <div className="text-sm text-slate-500">E-posta Toplayan</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Refresh */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                    <div className="p-4 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Popup ara... (isim, başlık)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                            />
                        </div>
                        <button
                            onClick={fetchPopups}
                            className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Yenile"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
                        <AlertCircle className="text-red-500" size={20} />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : filteredPopups.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                        <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-slate-800 mb-2">
                            {searchQuery ? 'Sonuç bulunamadı' : 'Henüz popup yok'}
                        </h3>
                        <p className="text-slate-500 mb-6">
                            {searchQuery ? 'Farklı bir arama terimi deneyin' : 'İlk popup\'ınızı oluşturarak başlayın'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate('/admin/popups/new')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2 font-medium"
                            >
                                <Plus size={20} />
                                Popup Oluştur
                            </button>
                        )}
                    </div>
                ) : (
                    /* Popup List */
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Popup
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Tür
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Şablon
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Zamanlama
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Durum
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            İşlemler
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPopups.map((popup) => {
                                        const typeInfo = typeConfig[popup.type] || typeConfig.corner;
                                        const TypeIcon = typeInfo.icon;

                                        return (
                                            <tr key={popup.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                            {popup.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-800">
                                                                {popup.name}
                                                            </div>
                                                            <div className="text-sm text-slate-500 truncate max-w-[200px]">
                                                                {popup.title || 'Başlık yok'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${typeInfo.color}`}>
                                                        <TypeIcon size={14} />
                                                        {typeInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600">
                                                        {templateLabels[popup.template] || popup.template}
                                                    </span>
                                                    {popup.collect_email && (
                                                        <Mail className="inline ml-2 text-green-500" size={14} />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                        <Clock size={14} className="text-slate-400" />
                                                        {popup.trigger_type === 'immediate' && 'Hemen'}
                                                        {popup.trigger_type === 'delay' && `${popup.trigger_delay_seconds}s sonra`}
                                                        {popup.trigger_type === 'scroll' && `%${popup.trigger_scroll_percent} scroll`}
                                                        {popup.trigger_type === 'exit_intent' && 'Çıkış niyeti'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleActive(popup.id, popup.is_active)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${popup.is_active
                                                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                                            }`}
                                                    >
                                                        {popup.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                                        {popup.is_active ? 'Aktif' : 'Pasif'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => navigate(`/admin/popups/edit/${popup.id}`)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Düzenle"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDuplicate(popup)}
                                                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="Kopyala"
                                                        >
                                                            <Copy size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(popup.id)}
                                                            disabled={deletingId === popup.id}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Sil"
                                                        >
                                                            {deletingId === popup.id ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={18} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PopupManager;
