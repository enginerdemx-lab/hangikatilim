import React, { useEffect, useState } from 'react';
import { siteSettingsApi } from '../../services/api/siteSettings';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import type { SiteSettings } from '../../types/database';

export const SiteSettings: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const { success, error: showError } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        site_name: 'Hangi Katılım',
        logo_url: '',
        dark_logo_url: '',
        favicon_url: '',
        primary_color: '#3B82F6',
        gradient_start: '#3B82F6',
        gradient_end: '#8B5CF6',
        default_seo_title: '',
        default_seo_description: '',
        og_image_url: '',
        // Footer
        footer_description: '',
        footer_email: '',
        footer_phone: '',
        footer_address: '',
        // Social media
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        linkedin_url: '',
        copyright_text: '',
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await siteSettingsApi.getSettings();
            if (data) {
                setSettings(data);
                setFormData({
                    site_name: data.site_name,
                    logo_url: data.logo_url || '',
                    dark_logo_url: data.dark_logo_url || '',
                    favicon_url: data.favicon_url || '',
                    primary_color: data.primary_color,
                    gradient_start: data.gradient_start,
                    gradient_end: data.gradient_end,
                    default_seo_title: data.default_seo_title || '',
                    default_seo_description: data.default_seo_description || '',
                    og_image_url: data.og_image_url || '',
                    footer_description: data.footer_description || '',
                    footer_email: data.footer_email || '',
                    footer_phone: data.footer_phone || '',
                    footer_address: data.footer_address || '',
                    facebook_url: data.facebook_url || '',
                    twitter_url: data.twitter_url || '',
                    instagram_url: data.instagram_url || '',
                    linkedin_url: data.linkedin_url || '',
                    copyright_text: data.copyright_text || '',
                });
            }
        } catch (err) {
            showError('Ayarlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasUnsavedChanges) return;

        setShowConfirmDialog(true);
    };

    const confirmSave = async () => {
        setShowConfirmDialog(false);
        setSaving(true);

        try {
            if (settings) {
                await siteSettingsApi.updateSettings(settings.id, formData);
                success('Ayarlar güncellendi');
            } else {
                await siteSettingsApi.createSettings(formData);
                success('Ayarlar oluşturuldu');
            }
            setHasUnsavedChanges(false);
            await loadSettings();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Kaydetme başarısız');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Site Ayarları</h1>
                <p className="text-gray-600 mt-1">Site genelindeki ayarları buradan yönetin</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Genel Ayarlar */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Genel Ayarlar</h2>

                    <div className="space-y-6">
                        {/* Site Adı */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Site Adı *</label>
                            <input
                                type="text"
                                value={formData.site_name}
                                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Hangi Katılım"
                            />
                        </div>

                        {/* Logo */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Logosu (Light Mode)</h3>

                            {/* Dosyadan Yükle */}
                            <div className="space-y-3 mb-6">
                                <label className="block text-sm font-medium text-gray-700">Dosyadan Yükle</label>
                                <ImageUpload
                                    folder="branding"
                                    currentImageUrl={formData.logo_url}
                                    onUploadComplete={(url) => handleFormChange({ logo_url: url })}
                                    onDelete={() => handleFormChange({ logo_url: '' })}
                                    label="Logo"
                                />
                                <p className="text-xs text-gray-500">Bilgisayarınızdan logo dosyası seçin ve yükleyin</p>
                            </div>

                            {/* VEYA Ayırıcı */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">VEYA</span>
                                </div>
                            </div>

                            {/* Logo URL Input */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                                <input
                                    type="url"
                                    value={formData.logo_url}
                                    onChange={(e) => handleFormChange({ logo_url: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com/logo.png"
                                />
                                <p className="text-xs text-gray-500">Kendi sunucunuza yüklediğiniz logo URL'sini buraya yapıştırın</p>

                                {/* Preview */}
                                {formData.logo_url && (
                                    <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        <p className="text-xs text-gray-600 mb-2">Önizleme:</p>
                                        <img
                                            src={formData.logo_url}
                                            alt="Logo Preview"
                                            className="h-12 w-auto object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = '';
                                                e.currentTarget.className = 'hidden';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Önerilen boyut: 1818x361 px (PNG formatı şeffaf arka plan için önerilir)</p>
                        </div>

                        {/* Dark Mode Logo */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Logosu (Dark Mode)</h3>

                            {/* Dosyadan Yükle */}
                            <div className="space-y-3 mb-6">
                                <label className="block text-sm font-medium text-gray-700">Dosyadan Yükle</label>
                                <ImageUpload
                                    folder="branding"
                                    currentImageUrl={formData.dark_logo_url}
                                    onUploadComplete={(url) => handleFormChange({ dark_logo_url: url })}
                                    onDelete={() => handleFormChange({ dark_logo_url: '' })}
                                    label="Dark Mode Logo"
                                />
                                <p className="text-xs text-gray-500">Bilgisayarınızdan dark mode logo dosyası seçin ve yükleyin</p>
                            </div>

                            {/* VEYA Ayırıcı */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">VEYA</span>
                                </div>
                            </div>

                            {/* Dark Logo URL Input */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Dark Mode Logo URL</label>
                                <input
                                    type="url"
                                    value={formData.dark_logo_url}
                                    onChange={(e) => handleFormChange({ dark_logo_url: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com/logo-dark.png"
                                />
                                <p className="text-xs text-gray-500">Dark mode için ayrı logo (opsiyonel). Boş bırakılırsa light mode logosu kullanılır.</p>

                                {/* Preview */}
                                {formData.dark_logo_url && (
                                    <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-slate-800">
                                        <p className="text-xs text-gray-300 mb-2">Önizleme (Dark Mode):</p>
                                        <img
                                            src={formData.dark_logo_url}
                                            alt="Dark Logo Preview"
                                            className="h-12 w-auto object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = '';
                                                e.currentTarget.className = 'hidden';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Önerilen boyut: 1818x361 px (Dark mode için)</p>
                        </div>
                    </div>
                </div>

                {/* Renk Ayarları */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Renk Teması</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Primary Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ana Renk</label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="color"
                                    value={formData.primary_color}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.primary_color}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="#3B82F6"
                                />
                            </div>
                        </div>

                        {/* Gradient Start */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Başlangıç</label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="color"
                                    value={formData.gradient_start}
                                    onChange={(e) => setFormData({ ...formData, gradient_start: e.target.value })}
                                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.gradient_start}
                                    onChange={(e) => setFormData({ ...formData, gradient_start: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="#3B82F6"
                                />
                            </div>
                        </div>

                        {/* Gradient End */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Bitiş</label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="color"
                                    value={formData.gradient_end}
                                    onChange={(e) => setFormData({ ...formData, gradient_end: e.target.value })}
                                    className="h-12 w-20 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.gradient_end}
                                    onChange={(e) => setFormData({ ...formData, gradient_end: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="#8B5CF6"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Gradient Preview */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Önizleme</label>
                        <div
                            className="h-24 rounded-lg"
                            style={{
                                background: `linear-gradient(to right, ${formData.gradient_start}, ${formData.gradient_end})`
                            }}
                        ></div>
                    </div>
                </div>

                {/* SEO Ayarları */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">SEO Ayarları</h2>

                    <div className="space-y-6">
                        {/* Default SEO Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Varsayılan SEO Başlığı</label>
                            <input
                                type="text"
                                value={formData.default_seo_title}
                                onChange={(e) => setFormData({ ...formData, default_seo_title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Hangi Katılım - Tasarruf Finansman Karşılaştırma"
                            />
                            <p className="text-xs text-gray-500 mt-1">Önerilen uzunluk: 50-60 karakter</p>
                        </div>

                        {/* Default SEO Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Varsayılan SEO Açıklaması</label>
                            <textarea
                                value={formData.default_seo_description}
                                onChange={(e) => setFormData({ ...formData, default_seo_description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Türkiye'nin en kapsamlı tasarruf finansman karşılaştırma platformu..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Önerilen uzunluk: 150-160 karakter</p>
                        </div>

                        {/* OG Image */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sosyal Medya Görseli (OG Image)</h3>
                            <ImageUpload
                                folder="branding"
                                currentImageUrl={formData.og_image_url}
                                onUploadComplete={(url) => handleFormChange({ og_image_url: url })}
                                onDelete={() => handleFormChange({ og_image_url: '' })}
                                label="OG Image"
                            />
                            <p className="text-xs text-gray-500 mt-2">Önerilen boyut: 1200x630 px (Facebook, Twitter, LinkedIn için)</p>
                        </div>
                    </div>
                </div>

                {/* Footer Ayarları */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Footer Ayarları</h2>

                    <div className="space-y-6">
                        {/* Footer Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Footer Açıklaması</label>
                            <textarea
                                value={formData.footer_description}
                                onChange={(e) => setFormData({ ...formData, footer_description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Türkiye'nin ilk kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu..."
                            />
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                                <input
                                    type="email"
                                    value={formData.footer_email}
                                    onChange={(e) => setFormData({ ...formData, footer_email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="info@hangikatilim.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                                <input
                                    type="tel"
                                    value={formData.footer_phone}
                                    onChange={(e) => setFormData({ ...formData, footer_phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="+90 XXX XXX XX XX"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                            <input
                                type="text"
                                value={formData.footer_address}
                                onChange={(e) => setFormData({ ...formData, footer_address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="İstanbul, Türkiye"
                            />
                        </div>

                        {/* Social Media */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sosyal Medya Linkleri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                                    <input
                                        type="url"
                                        value={formData.facebook_url}
                                        onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://facebook.com/..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                                    <input
                                        type="url"
                                        value={formData.twitter_url}
                                        onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://twitter.com/..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                                    <input
                                        type="url"
                                        value={formData.instagram_url}
                                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                                    <input
                                        type="url"
                                        value={formData.linkedin_url}
                                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://linkedin.com/company/..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Copyright */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Metni</label>
                            <input
                                type="text"
                                value={formData.copyright_text}
                                onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Hangi Katılım Platformu © 2025"
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky Save Button */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between gap-4 shadow-lg">
                    {hasUnsavedChanges && (
                        <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Kaydedilmemiş değişiklikler var
                        </p>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            disabled={saving || !hasUnsavedChanges}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !hasUnsavedChanges}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Değişiklikleri Kaydet?</h3>
                        <p className="text-gray-600 mb-6">Site ayarlarındaki değişiklikler tüm kullanıcılar için geçerli olacak. Devam etmek istiyor musunuz?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={confirmSave}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700"
                            >
                                Evet, Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
