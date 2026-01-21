import React, { useState, useEffect } from 'react';
import { campaignBannersApi, CampaignBanner, CampaignBannerFormData } from '../../services/api/campaignBanners';
import { supabase } from '../../services/supabaseClient';
import { Plus, Trash2, ExternalLink, Eye, EyeOff, Loader2, Save, X, Image, ChevronUp, ChevronDown } from 'lucide-react';

export const CampaignBanners: React.FC = () => {
    const [banners, setBanners] = useState<CampaignBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<CampaignBanner | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<CampaignBannerFormData>({
        title: '',
        image_url: '',
        link_url: '',
        is_active: true,
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        setLoading(true);
        const data = await campaignBannersApi.getAllBanners();
        setBanners(data);
        setLoading(false);
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `campaign-banners/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error } = await supabase.storage
                .from('media')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('media')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
            showToast('Görsel yüklendi!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Görsel yüklenemedi', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.image_url) {
            showToast('Görsel zorunludur', 'error');
            return;
        }

        setSaving(true);
        try {
            if (editingBanner) {
                await campaignBannersApi.updateBanner(editingBanner.id, formData);
                showToast('Banner güncellendi!', 'success');
            } else {
                await campaignBannersApi.createBanner({
                    ...formData,
                    sort_order: banners.length,
                });
                showToast('Banner eklendi!', 'success');
            }
            setShowModal(false);
            setEditingBanner(null);
            setFormData({ title: '', image_url: '', link_url: '', is_active: true });
            loadBanners();
        } catch (error) {
            showToast('İşlem başarısız', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu banner\'ı silmek istediğinize emin misiniz?')) return;

        try {
            await campaignBannersApi.deleteBanner(id);
            showToast('Banner silindi', 'success');
            loadBanners();
        } catch (error) {
            showToast('Silme başarısız', 'error');
        }
    };

    const handleToggleActive = async (banner: CampaignBanner) => {
        try {
            await campaignBannersApi.toggleActive(banner.id, !banner.is_active);
            loadBanners();
        } catch (error) {
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return; // Already at top
        const newBanners = [...banners];
        [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
        setBanners(newBanners);

        try {
            await campaignBannersApi.reorderBanners(newBanners.map(b => b.id));
            showToast('Sıralama güncellendi', 'success');
        } catch (error) {
            showToast('Sıralama güncellenemedi', 'error');
            loadBanners(); // Revert on error
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === banners.length - 1) return; // Already at bottom
        const newBanners = [...banners];
        [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
        setBanners(newBanners);

        try {
            await campaignBannersApi.reorderBanners(newBanners.map(b => b.id));
            showToast('Sıralama güncellendi', 'success');
        } catch (error) {
            showToast('Sıralama güncellenemedi', 'error');
            loadBanners(); // Revert on error
        }
    };

    const openEditModal = (banner: CampaignBanner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title || '',
            image_url: banner.image_url,
            link_url: banner.link_url || '',
            is_active: banner.is_active,
        });
        setShowModal(true);
    };

    const openNewModal = () => {
        setEditingBanner(null);
        setFormData({ title: '', image_url: '', link_url: '', is_active: true });
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kampanya Bannerları</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Kampanyalar sayfasında görünecek banner slider'ı yönetin
                    </p>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                >
                    <Plus size={18} />
                    Yeni Banner
                </button>
            </div>

            {/* Size Warning */}
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                    ⚠️ Önerilen Görsel Boyutu: <span className="font-bold">1200 x 252 piksel</span>
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    En iyi görünüm için görselleri bu boyutta hazırlayın. Farklı boyutlar otomatik olarak ölçeklenir.
                </p>
            </div>

            {/* Banner List */}
            <div className="space-y-3">
                {banners.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                        <Image size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Henüz banner eklenmemiş</p>
                        <button
                            onClick={openNewModal}
                            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            İlk banner'ı ekle
                        </button>
                    </div>
                ) : (
                    banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className={`flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border ${banner.is_active
                                ? 'border-gray-200 dark:border-slate-700'
                                : 'border-gray-200 dark:border-slate-700 opacity-50'
                                }`}
                        >
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    className={`p-1 rounded transition-colors ${index === 0 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                    title="Yukarı Taşı"
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <button
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index === banners.length - 1}
                                    className={`p-1 rounded transition-colors ${index === banners.length - 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                                    title="Aşağı Taşı"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            <img
                                src={banner.image_url}
                                alt={banner.title || 'Banner'}
                                className="w-32 h-16 object-cover rounded-lg"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {banner.title || 'İsimsiz Banner'}
                                </p>
                                {banner.link_url && (
                                    <a
                                        href={banner.link_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                                    >
                                        <ExternalLink size={12} />
                                        {banner.link_url.substring(0, 40)}...
                                    </a>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleToggleActive(banner)}
                                    className={`p-2 rounded-lg transition-colors ${banner.is_active
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-400 dark:bg-slate-700'
                                        }`}
                                    title={banner.is_active ? 'Aktif' : 'Pasif'}
                                >
                                    {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>

                                <button
                                    onClick={() => openEditModal(banner)}
                                    className="px-3 py-2 text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Düzenle
                                </button>

                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingBanner ? 'Banner Düzenle' : 'Yeni Banner'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Başlık (Opsiyonel)
                                </label>
                                <input
                                    type="text"
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="Banner başlığı"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Görsel *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        placeholder="Görsel URL veya yükle"
                                    />
                                    <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                        <span>Yükle</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                                {formData.image_url && (
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        className="mt-3 w-full h-24 object-cover rounded-lg"
                                    />
                                )}
                            </div>

                            {/* Link URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Link URL (Opsiyonel)
                                </label>
                                <input
                                    type="url"
                                    value={formData.link_url || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="https://example.com"
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                    className={`w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                </button>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {formData.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving || !formData.image_url}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignBanners;
