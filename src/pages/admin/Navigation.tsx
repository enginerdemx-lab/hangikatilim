import React, { useEffect, useState } from 'react';
import { navigationApi, type NavItemFormData } from '../../services/api/navigation';
import { useToast } from '../../hooks/useToast';
import type { NavItem } from '../../types/database';

export const Navigation: React.FC = () => {
    const [items, setItems] = useState<NavItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { showToast } = useToast();

    const [formData, setFormData] = useState<NavItemFormData>({
        label: '',
        path: '',
        sort_order: 0,
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await navigationApi.updateNavItem(editingId, formData);
                showToast('Menü öğesi güncellendi', 'success');
            } else {
                await navigationApi.createNavItem(formData);
                showToast('Menü öğesi eklendi', 'success');
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
            path: item.path,
            sort_order: item.sort_order,
            is_active: item.is_active,
        });
        setEditingId(item.id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu menü öğesini silmek istediğinizden emin misiniz?')) return;

        try {
            await navigationApi.deleteNavItem(id);
            showToast('Menü öğesi silindi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to delete navigation item:', error);
            showToast('Silme başarısız', 'error');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await navigationApi.toggleActive(id, !isActive);
            showToast('Durum güncellendi', 'success');
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
            await navigationApi.updateNavItem(item.id, { ...item, sort_order: prevItem.sort_order });
            await navigationApi.updateNavItem(prevItem.id, { ...prevItem, sort_order: item.sort_order });
            showToast('Sıra güncellendi', 'success');
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
            await navigationApi.updateNavItem(item.id, { ...item, sort_order: nextItem.sort_order });
            await navigationApi.updateNavItem(nextItem.id, { ...nextItem, sort_order: item.sort_order });
            showToast('Sıra güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to move item:', error);
            showToast('Sıralama başarısız', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            label: '',
            path: '',
            sort_order: items.length,
            is_active: true,
        });
        setEditingId(null);
        setIsEditing(false);
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
            {/* Header with Action Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Navigasyon Yönetimi</h1>
                    <p className="text-gray-600 mt-2">Site menü öğelerini yönetin</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-semibold">Yeni Menü Ekle</span>
                    </button>
                )}
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
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
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
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="Örn: Ana Sayfa"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    🔗 Link *
                                </label>
                                <input
                                    type="text"
                                    value={formData.path}
                                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="Örn: / veya /hakkimizda"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📊 Sıra No
                            </label>
                            <input
                                type="number"
                                value={formData.sort_order}
                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            />
                            <p className="text-xs text-gray-500 mt-1">Menüde gösterilme sırası</p>
                        </div>

                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition">
                                    ✅ Aktif (Menüde göster)
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl font-semibold"
                            >
                                {editingId ? '💾 Güncelle' : '✨ Ekle'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                            >
                                ✖️ İptal
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
                                {/* Sıralama Okları */}
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
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
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
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Sıra Numarası */}
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-indigo-700">{index + 1}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                                        <span className="text-xs text-gray-400">→</span>
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-indigo-600 font-mono">
                                            {item.path}
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
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition"
                                        title="Sil"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="text-center py-16 bg-gray-50">
                            <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz menü öğesi yok</h3>
                            <p className="text-gray-600 mb-4">İlk menü öğenizi eklemek için yukarıdaki butonu kullanın</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
