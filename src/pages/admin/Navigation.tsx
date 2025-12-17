import React, { useEffect, useState } from 'react';
import { navigationApi, type NavItemFormData } from '../../services/api/navigation';
import { useToast } from '../../hooks/useToast';
import type { NavItem } from '../../types/database';
import { ExternalLink, Eye, EyeOff, Plus, Save, Trash2, Edit2, ChevronUp, ChevronDown, X, Link as LinkIcon } from 'lucide-react';

export const Navigation: React.FC = () => {
    const [items, setItems] = useState<NavItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showOnlyActive, setShowOnlyActive] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ label?: string; link?: string }>({});
    const { showToast } = useToast();

    const [formData, setFormData] = useState<NavItemFormData>({
        label: '',
        link: '',
        sort_order: 0,
        is_active: true,
        open_in_new_tab: false,
    });

    // For live preview - local state that updates immediately
    const [previewItems, setPreviewItems] = useState<NavItem[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    // Sync preview items with actual items when items change
    useEffect(() => {
        setPreviewItems(items);
    }, [items]);

    const loadData = async () => {
        try {
            const data = await navigationApi.getAllNavItems();
            setItems(data);
        } catch (error) {
            console.error('Failed to load navigation items:', error);
            showToast('Veriler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: { label?: string; link?: string } = {};

        if (!formData.label.trim()) {
            errors.label = 'Etiket zorunludur';
        }
        if (!formData.link.trim()) {
            errors.link = 'Link zorunludur';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Lütfen zorunlu alanları doldurun', 'error');
            return;
        }

        try {
            if (editingId) {
                await navigationApi.updateNavItem(editingId, formData);
                showToast('Kaydedildi', 'success');
            } else {
                await navigationApi.createNavItem(formData);
                showToast('Kaydedildi', 'success');
            }
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to save navigation item:', error);
            showToast('Kaydetme başarısız', 'error');
        }
    };

    const handleEdit = (item: NavItem) => {
        setFormData({
            label: item.label,
            link: item.link,
            sort_order: item.sort_order,
            is_active: item.is_active,
            open_in_new_tab: item.open_in_new_tab || false,
        });
        setEditingId(item.id);
        setIsEditing(true);
        setFormErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        try {
            await navigationApi.deleteNavItem(id);
            showToast('Silindi', 'success');
            setShowDeleteConfirm(null);
            loadData();
        } catch (error) {
            console.error('Failed to delete navigation item:', error);
            showToast('Silme başarısız', 'error');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await navigationApi.toggleActive(id, !isActive);
            showToast('Kaydedildi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to toggle active:', error);
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const handleMoveUp = async (item: NavItem, index: number) => {
        if (index === 0) return;

        const prevItem = items[index - 1];

        try {
            await navigationApi.updateNavItem(item.id, { ...formDataFromItem(item), sort_order: prevItem.sort_order });
            await navigationApi.updateNavItem(prevItem.id, { ...formDataFromItem(prevItem), sort_order: item.sort_order });
            showToast('Sıralama güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to move item:', error);
            showToast('Sıralama başarısız', 'error');
        }
    };

    const handleMoveDown = async (item: NavItem, index: number) => {
        if (index === items.length - 1) return;

        const nextItem = items[index + 1];

        try {
            await navigationApi.updateNavItem(item.id, { ...formDataFromItem(item), sort_order: nextItem.sort_order });
            await navigationApi.updateNavItem(nextItem.id, { ...formDataFromItem(nextItem), sort_order: item.sort_order });
            showToast('Sıralama güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to move item:', error);
            showToast('Sıralama başarısız', 'error');
        }
    };

    const formDataFromItem = (item: NavItem): NavItemFormData => ({
        label: item.label,
        link: item.link,
        sort_order: item.sort_order,
        is_active: item.is_active,
        open_in_new_tab: item.open_in_new_tab,
    });

    const resetForm = () => {
        setFormData({
            label: '',
            link: '',
            sort_order: items.length,
            is_active: true,
            open_in_new_tab: false,
        });
        setEditingId(null);
        setIsEditing(false);
        setFormErrors({});
    };

    // Update preview in real-time when form changes
    const handleFormChange = (updates: Partial<NavItemFormData>) => {
        const newFormData = { ...formData, ...updates };
        setFormData(newFormData);
        setFormErrors({});

        // Update preview items in real-time
        if (editingId) {
            setPreviewItems(prev => prev.map(item =>
                item.id === editingId
                    ? { ...item, ...newFormData }
                    : item
            ));
        }
    };

    // Check if link is external
    const isExternalLink = (link: string) => {
        return link.startsWith('http://') || link.startsWith('https://');
    };

    // Get preview items based on filter
    const getPreviewItems = () => {
        if (showOnlyActive) {
            return previewItems.filter(item => item.is_active);
        }
        return previewItems;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Navigasyon Yönetimi</h1>
                    <p className="text-gray-600 mt-2">Site menü öğelerini yönetin</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => {
                            setFormData({ ...formData, sort_order: items.length });
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
                    >
                        <Plus size={20} />
                        <span className="font-semibold">Yeni Menü Ekle</span>
                    </button>
                )}
            </div>

            {/* Live Preview Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Eye size={20} className="text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Canlı Önizleme</h2>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-gray-600">Sadece Aktifleri Göster</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={showOnlyActive}
                                onChange={(e) => setShowOnlyActive(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                    </label>
                </div>

                {/* Preview Navbar Mock */}
                <div className="p-4 bg-gray-50">
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            {/* Logo placeholder */}
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">HK</span>
                                </div>
                                <span className="font-semibold text-gray-400 text-sm">Logo</span>
                            </div>

                            {/* Menu Items Preview */}
                            <div className="flex items-center gap-1">
                                {getPreviewItems().length === 0 ? (
                                    <span className="text-gray-400 text-sm italic">Henüz menü yok</span>
                                ) : (
                                    getPreviewItems().map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={(e) => e.preventDefault()}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${item.is_active
                                                    ? 'text-gray-700 hover:bg-gray-100'
                                                    : 'text-gray-400 bg-gray-100 opacity-50'
                                                }`}
                                        >
                                            {item.label}
                                            {(item.open_in_new_tab || isExternalLink(item.link)) && (
                                                <ExternalLink size={12} className="text-gray-400" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        ↑ Bu önizleme anlık güncellenir. Değişiklikleri kaydetmeden görebilirsiniz.
                    </p>
                </div>
            </div>

            {/* Form - Collapsible */}
            {isEditing && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingId ? '✏️ Menü Öğesini Düzenle' : '✨ Yeni Menü Öğesi Ekle'}
                        </h2>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-gray-600 transition"
                            title="Kapat"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    🏷️ Etiket *
                                </label>
                                <input
                                    type="text"
                                    value={formData.label}
                                    onChange={(e) => handleFormChange({ label: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${formErrors.label ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Örn: Ana Sayfa"
                                />
                                {formErrors.label && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.label}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    🔗 Link *
                                </label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => handleFormChange({ link: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${formErrors.link ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Örn: / veya https://example.com"
                                />
                                {formErrors.link && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.link}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📊 Sıra No
                            </label>
                            <input
                                type="number"
                                value={formData.sort_order}
                                onChange={(e) => handleFormChange({ sort_order: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                            <p className="text-xs text-gray-500 mt-1">Menüde gösterilme sırası</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => handleFormChange({ is_active: e.target.checked })}
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition">
                                        ✅ Aktif (Menüde göster)
                                    </span>
                                </label>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.open_in_new_tab || false}
                                        onChange={(e) => handleFormChange({ open_in_new_tab: e.target.checked })}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition">
                                        🔗 Yeni sekmede aç
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                {editingId ? 'Güncelle' : 'Ekle'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                            >
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Items List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        🧭 Navigasyon Öğeleri
                        <span className="text-sm font-normal text-gray-600">({items.length} adet)</span>
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Sıralamayı değiştirmek için ok butonlarını kullanın</p>
                </div>

                <div className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="p-4 hover:bg-gray-50 transition-colors group"
                        >
                            <div className="flex items-start gap-4">
                                {/* Sorting Arrows */}
                                <div className="flex flex-col gap-1 pt-1">
                                    <button
                                        onClick={() => handleMoveUp(item, index)}
                                        disabled={index === 0}
                                        className={`p-1.5 rounded transition ${index === 0
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                        title="Yukarı taşı"
                                    >
                                        <ChevronUp size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(item, index)}
                                        disabled={index === items.length - 1}
                                        className={`p-1.5 rounded transition ${index === items.length - 1
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                        title="Aşağı taşı"
                                    >
                                        <ChevronDown size={20} />
                                    </button>
                                </div>

                                {/* Order Number */}
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-indigo-700">{index + 1}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                                        {(item.open_in_new_tab || isExternalLink(item.link)) && (
                                            <ExternalLink size={14} className="text-gray-400" />
                                        )}
                                        <span className="text-xs text-gray-400">→</span>
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-indigo-600 font-mono">
                                            {item.link}
                                        </code>
                                    </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleToggleActive(item.id, item.is_active)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 ${item.is_active
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                    >
                                        {item.is_active ? '✅ Aktif' : '⏸️ Pasif'}
                                    </button>

                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={18} />
                                    </button>

                                    <button
                                        onClick={() => setShowDeleteConfirm(item.id)}
                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition"
                                        title="Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="text-center py-16 bg-gray-50">
                            <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
                                <LinkIcon size={48} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz menü öğesi yok</h3>
                            <p className="text-gray-600 mb-4">İlk menü öğenizi eklemek için yukarıdaki butonu kullanın</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Menü öğesini silmek istiyor musunuz?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Bu işlem geri alınamaz.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    Sil
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
