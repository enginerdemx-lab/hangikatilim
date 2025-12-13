import React, { useEffect, useState } from 'react';
import { calculatorApi, type CalculatorSettingsFormData } from '../../services/api/calculator';
import { useToast } from '../../hooks/useToast';
import type { CalculatorSettings } from '../../types/database';

export const Calculator: React.FC = () => {
    const [settings, setSettings] = useState<CalculatorSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const [formData, setFormData] = useState<CalculatorSettingsFormData>({
        default_amount: 50000,
        min_amount: 10000,
        max_amount: 1000000,
        min_vade: 3,
        max_vade: 36,
        description: '',
        help_text: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await calculatorApi.getSettings();
            if (data) {
                setSettings(data);
                setFormData({
                    default_amount: data.default_amount,
                    min_amount: data.min_amount,
                    max_amount: data.max_amount,
                    min_vade: data.min_vade,
                    max_vade: data.max_vade,
                    description: data.description || '',
                    help_text: data.help_text || '',
                });
            }
        } catch (error) {
            console.error('Failed to load calculator settings:', error);
            showToast('Veriler yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (settings?.id) {
                await calculatorApi.updateSettings(settings.id, formData);
                showToast('Ayarlar güncellendi', 'success');
            } else {
                await calculatorApi.createSettings(formData);
                showToast('Ayarlar kaydedildi', 'success');
            }
            loadData();
        } catch (error) {
            console.error('Failed to save calculator settings:', error);
            showToast('Kaydetme başarısız', 'error');
        } finally {
            setSaving(false);
        }
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Hesaplama Ayarları</h1>
                <p className="text-gray-600 mt-2">Tasarruf hesaplayıcısı için varsayılan değerleri ayarlayın</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount Settings */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Tutar Ayarları</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Varsayılan Tutar (₺) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.default_amount}
                                    onChange={(e) => setFormData({ ...formData, default_amount: parseInt(e.target.value) })}
                                    required
                                    min={formData.min_amount}
                                    max={formData.max_amount}
                                    step={1000}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Tutar (₺) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.min_amount}
                                    onChange={(e) => setFormData({ ...formData, min_amount: parseInt(e.target.value) })}
                                    required
                                    step={1000}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maksimum Tutar (₺) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.max_amount}
                                    onChange={(e) => setFormData({ ...formData, max_amount: parseInt(e.target.value) })}
                                    required
                                    step={1000}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vade Settings */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Vade Ayarları</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Vade (Ay) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.min_vade}
                                    onChange={(e) => setFormData({ ...formData, min_vade: parseInt(e.target.value) })}
                                    required
                                    min={1}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maksimum Vade (Ay) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.max_vade}
                                    onChange={(e) => setFormData({ ...formData, max_vade: parseInt(e.target.value) })}
                                    required
                                    min={formData.min_vade}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description and Help Text */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Açıklama Metinleri</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Açıklama
                                </label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Hesaplayıcı için genel açıklama..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Yardım Metni
                                </label>
                                <textarea
                                    value={formData.help_text || ''}
                                    onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Kullanıcılar için yardım metni..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-3 text-blue-900">Önizleme</h3>
                        <div className="space-y-2 text-sm text-blue-800">
                            <p><strong>Tutar Aralığı:</strong> {formData.min_amount.toLocaleString('tr-TR')} ₺ - {formData.max_amount.toLocaleString('tr-TR')} ₺</p>
                            <p><strong>Varsayılan Tutar:</strong> {formData.default_amount.toLocaleString('tr-TR')} ₺</p>
                            <p><strong>Vade Aralığı:</strong> {formData.min_vade} - {formData.max_vade} ay</p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
