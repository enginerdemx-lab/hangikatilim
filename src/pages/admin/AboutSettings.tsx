import React, { useState, useEffect } from 'react';
import { siteSettingsApi } from '../../services/api/siteSettings';
import { SiteSettings } from '../../types/database';
import { Save, Loader2, Info, Image, Upload, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export const AboutSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [settingsId, setSettingsId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        about_title: '',
        about_content: '',
        about_image_url: '',
        about_mission: '',
        about_vision: '',
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await siteSettingsApi.getSettings();
                if (data) {
                    setSettingsId(data.id);
                    setFormData({
                        about_title: data.about_title || 'Hakkımızda',
                        about_content: data.about_content || '',
                        about_image_url: data.about_image_url || '',
                        about_mission: data.about_mission || '',
                        about_vision: data.about_vision || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                showToast('Ayarlar yüklenemedi', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSave = async () => {
        if (!settingsId) return;

        setSaving(true);
        try {
            await siteSettingsApi.updateSettings(settingsId, formData);
            showToast('Hakkımızda sayfası güncellendi!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Kaydetme başarısız', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `about/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from('media')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('media')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, about_image_url: urlData.publicUrl }));
            showToast('Görsel yüklendi!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Görsel yüklenemedi', 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Info className="text-primary-600" />
                        Hakkımızda Sayfası
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Hakkımızda sayfasının içeriğini düzenleyin
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>

            {/* Form */}
            <div className="space-y-6">
                {/* Title */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Sayfa Başlığı
                    </label>
                    <input
                        type="text"
                        value={formData.about_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, about_title: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        placeholder="Hakkımızda"
                    />
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Ana İçerik
                    </label>
                    <textarea
                        value={formData.about_content}
                        onChange={(e) => setFormData(prev => ({ ...prev, about_content: e.target.value }))}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        placeholder="Şirketiniz hakkında detaylı bilgi yazın..."
                    />
                    <p className="text-xs text-gray-500 mt-2">Yeni satır için Enter tuşunu kullanabilirsiniz.</p>
                </div>

                {/* Image */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <Image size={16} className="inline mr-2" />
                        Sayfa Görseli
                    </label>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={formData.about_image_url}
                                onChange={(e) => setFormData(prev => ({ ...prev, about_image_url: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                placeholder="Görsel URL'si veya yükleyin"
                            />
                        </div>
                        <div className="flex gap-2">
                            <label className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                <span>{uploading ? 'Yükleniyor...' : 'Yükle'}</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            {formData.about_image_url && (
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, about_image_url: '' }))}
                                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {formData.about_image_url && (
                        <div className="mt-4">
                            <img
                                src={formData.about_image_url}
                                alt="Önizleme"
                                className="max-h-48 rounded-lg border border-gray-200 dark:border-slate-600"
                            />
                        </div>
                    )}
                </div>

                {/* Mission & Vision */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Misyonumuz
                        </label>
                        <textarea
                            value={formData.about_mission}
                            onChange={(e) => setFormData(prev => ({ ...prev, about_mission: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="Şirketinizin misyonu..."
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Vizyonumuz
                        </label>
                        <textarea
                            value={formData.about_vision}
                            onChange={(e) => setFormData(prev => ({ ...prev, about_vision: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            placeholder="Şirketinizin vizyonu..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutSettings;
