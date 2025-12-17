import React, { useEffect, useState } from 'react';
import { tickerApi, type TickerItemFormData } from '../../services/api/ticker';
import { useToast } from '../../hooks/useToast';
import { useFormValidation, type ValidationRules } from '../../hooks/useFormValidation';
import { SubmitButton } from '../../components/admin/SubmitButton';
import type { TickerItem } from '../../types/database';

// Validation rules for ticker form
const validationRules: ValidationRules<TickerItemFormData> = {
    text: { required: 'Haber metni zorunludur' },
};

export const Ticker: React.FC = () => {
    const [items, setItems] = useState<TickerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { showToast } = useToast();
    const { errors, validate, clearErrors, focusFirstError } = useFormValidation<TickerItemFormData>();

    const [formData, setFormData] = useState<TickerItemFormData>({
        text: '',
        link: '',
        sort_order: 0,
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await tickerApi.getAllTickerItems();
            setItems(data);
        } catch (error) {
            console.error('Failed to load ticker items:', error);
            showToast('Veriler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!validate(formData, validationRules)) {
            focusFirstError();
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await tickerApi.updateTickerItem(editingId, formData);
                showToast('Kaydedildi', 'success');
            } else {
                await tickerApi.createTickerItem(formData);
                showToast('Kaydedildi', 'success');
            }
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to save ticker item:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            showToast(`Kaydetme başarısız: ${errorMessage}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: TickerItem) => {
        setFormData({
            text: item.text,
            link: item.link || '',
            sort_order: item.sort_order,
            is_active: item.is_active,
        });
        setEditingId(item.id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu gündem öğesini silmek istediğinizden emin misiniz?')) return;

        try {
            await tickerApi.deleteTickerItem(id);
            showToast('Gündem öğesi silindi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to delete ticker item:', error);
            showToast('Silme başarısız', 'error');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await tickerApi.toggleActive(id, !isActive);
            showToast('Durum güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to toggle active:', error);
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const handleMoveUp = async (item: TickerItem, index: number) => {
        if (index === 0) return;

        const prevItem = items[index - 1];

        try {
            await tickerApi.updateTickerItem(item.id, { ...item, sort_order: prevItem.sort_order });
            await tickerApi.updateTickerItem(prevItem.id, { ...prevItem, sort_order: item.sort_order });
            showToast('Sıra güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to move item:', error);
            showToast('Sıralama başarısız', 'error');
        }
    };

    const handleMoveDown = async (item: TickerItem, index: number) => {
        if (index === items.length - 1) return;

        const nextItem = items[index + 1];

        try {
            await tickerApi.updateTickerItem(item.id, { ...item, sort_order: nextItem.sort_order });
            await tickerApi.updateTickerItem(nextItem.id, { ...nextItem, sort_order: item.sort_order });
            showToast('Sıra güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to move item:', error);
            showToast('Sıralama başarısız', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            text: '',
            link: '',
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
                    <h1 className="text-3xl font-bold text-gray-900">Sektör Gündemi</h1>
                    <p className="text-gray-600 mt-2">Kayan haber bandı içeriğini yönetin</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-semibold">Yeni Gündem Ekle</span>
                    </button>
                )}
            </div>

            {/* Form - Collapsible */}
            {isEditing && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingId ? '✏️ Gündem Öğesini Düzenle' : '✨ Yeni Gündem Öğesi Ekle'}
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📰 Haber Metni <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.text}
                                onChange={(e) => {
                                    setFormData({ ...formData, text: e.target.value });
                                    if (errors.text) clearErrors();
                                }}
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition ${errors.text
                                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50'
                                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                                    }`}
                                placeholder="Örn: SON DAKİKA: Konut kredisi faizleri düştü..."
                            />
                            {errors.text && (
                                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    {errors.text}
                                </p>
                            )}
                            {!errors.text && (
                                <p className="text-xs text-gray-500 mt-1">Bu metin ticker'da görünecek</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    🔗 Link (Opsiyonel)
                                </label>
                                <input
                                    type="url"
                                    value={formData.link || ''}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    📊 Sıra No
                                </label>
                                <input
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition">
                                    ✅ Aktif (Ticker'da göster)
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <SubmitButton loading={saving} className="flex-1">
                                {editingId ? '💾 Güncelle' : '✨ Ekle'}
                            </SubmitButton>
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={saving}
                                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold disabled:opacity-50"
                            >
                                ✖️ İptal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Items List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        ⚡ Gündem Öğeleri
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
                                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
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
                                            : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
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
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-purple-700">{index + 1}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 mb-1">{item.text}</p>
                                    {item.link && (
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            {item.link.substring(0, 50)}...
                                        </a>
                                    )}
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz gündem öğesi yok</h3>
                            <p className="text-gray-600 mb-4">İlk gündem öğenizi eklemek için yukarıdaki butonu kullanın</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
