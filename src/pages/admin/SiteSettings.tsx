import React, { useEffect, useState } from 'react';
import { siteSettingsApi } from '../../services/api/siteSettings';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import type { SiteSettings } from '../../types/database';

type TabType = 'genel' | 'seo' | 'footer' | 'sosyal' | 'uygulama' | 'hukuki';

export const SiteSettings: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('genel');

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
        // App Store Links
        app_store_url: '',
        google_play_url: '',
        app_gallery_url: '',
        app_store_badge_url: '',
        google_play_badge_url: '',
        app_gallery_badge_url: '',
        // App Store Badge Visibility
        show_app_store_badge: true,
        show_google_play_badge: true,
        show_app_gallery_badge: true,
        // Legal Texts
        kvkk_text: 'KVKK Aydınlatma Metni',
        privacy_text: 'Gizlilik Politikası',
        terms_text: 'Kullanım Koşulları',
        cookie_text: 'Çerez Politikası',
        // Legal Content
        kvkk_content: '',
        privacy_content: '',
        terms_content: '',
        cookie_content: '',
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
                    app_store_url: data.app_store_url || '',
                    google_play_url: data.google_play_url || '',
                    app_gallery_url: data.app_gallery_url || '',
                    app_store_badge_url: data.app_store_badge_url || '',
                    google_play_badge_url: data.google_play_badge_url || '',
                    app_gallery_badge_url: data.app_gallery_badge_url || '',
                    show_app_store_badge: data.show_app_store_badge !== false,
                    show_google_play_badge: data.show_google_play_badge !== false,
                    show_app_gallery_badge: data.show_app_gallery_badge !== false,
                    kvkk_text: data.kvkk_text || 'KVKK Aydınlatma Metni',
                    privacy_text: data.privacy_text || 'Gizlilik Politikası',
                    terms_text: data.terms_text || 'Kullanım Koşulları',
                    cookie_text: data.cookie_text || 'Çerez Politikası',
                    kvkk_content: data.kvkk_content || '',
                    privacy_content: data.privacy_content || '',
                    terms_content: data.terms_content || '',
                    cookie_content: data.cookie_content || '',
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmDialog(true);
    };

    const confirmSave = async () => {
        try {
            setSaving(true);
            setShowConfirmDialog(false);

            const updateData: Partial<SiteSettings> = { ...formData };
            if (settings?.id) {
                await siteSettingsApi.updateSettings(settings.id, updateData);
                success('Ayarlar başarıyla kaydedildi');
            }
            setHasUnsavedChanges(false);
            await loadSettings();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Kaydetme başarısız');
        } finally {
            setSaving(false);
        }
    };

    // Tab definitions
    const tabs: Array<{ id: TabType; label: string; icon: string }> = [
        { id: 'genel', label: 'Genel', icon: '⚙️' },
        { id: 'seo', label: 'SEO', icon: '🔍' },
        { id: 'footer', label: 'Footer İletişim', icon: '📞' },
        { id: 'sosyal', label: 'Sosyal Medya', icon: '📱' },
        { id: 'uygulama', label: 'Uygulama Linkleri', icon: '📲' },
        { id: 'hukuki', label: 'Hukuki Belgeler', icon: '📄' },
    ];

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

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {activeTab === 'genel' && renderGenelTab()}
                    {activeTab === 'seo' && renderSEOTab()}
                    {activeTab === 'footer' && renderFooterTab()}
                    {activeTab === 'sosyal' && renderSosyalTab()}
                    {activeTab === 'uygulama' && renderUygulamaTab()}
                    {activeTab === 'hukuki' && renderHukukiTab()}
                </div>

                {/* Save Button - Sticky Bottom */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-yellow-600 font-medium">⚠️ Kaydedilmemiş değişiklikler var</span>
                        )}
                        <button
                            type="submit"
                            disabled={saving || !hasUnsavedChanges}
                            className="ml-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

    // TAB RENDER FUNCTIONS
    function renderGenelTab() {
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Genel Ayarlar</h2>

                {/* Site Adı */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Adı *</label>
                    <input
                        type="text"
                        value={formData.site_name}
                        onChange={(e) => handleFormChange({ site_name: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Hangi Katılım"
                    />
                </div>

                {/* Logo (Light Mode) */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Logosu (Light Mode)</h3>
                    <div className="space-y-4">
                        <ImageUpload
                            folder="branding"
                            currentImageUrl={formData.logo_url}
                            onUploadComplete={(url) => handleFormChange({ logo_url: url })}
                            onDelete={() => handleFormChange({ logo_url: '' })}
                            label="Logo"
                        />
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">VEYA</span>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={formData.logo_url}
                            onChange={(e) => handleFormChange({ logo_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/logo.png"
                        />
                    </div>
                </div>

                {/* Dark Logo */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Logosu (Dark Mode)</h3>
                    <div className="space-y-4">
                        <ImageUpload
                            folder="branding"
                            currentImageUrl={formData.dark_logo_url}
                            onUploadComplete={(url) => handleFormChange({ dark_logo_url: url })}
                            onDelete={() => handleFormChange({ dark_logo_url: '' })}
                            label="Dark Logo"
                        />
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">VEYA</span>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={formData.dark_logo_url}
                            onChange={(e) => handleFormChange({ dark_logo_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/dark-logo.png"
                        />
                    </div>
                </div>

                {/* Favicon */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Favicon</h3>
                    <div className="space-y-4">
                        <ImageUpload
                            folder="branding"
                            currentImageUrl={formData.favicon_url}
                            onUploadComplete={(url) => handleFormChange({ favicon_url: url })}
                            onDelete={() => handleFormChange({ favicon_url: '' })}
                            label="Favicon"
                        />
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">VEYA</span>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={formData.favicon_url}
                            onChange={(e) => handleFormChange({ favicon_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/favicon.ico"
                        />
                    </div>
                </div>

                {/* Colors */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Renkler</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ana Renk</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.primary_color}
                                    onChange={(e) => handleFormChange({ primary_color: e.target.value })}
                                    className="h-10 w-20"
                                />
                                <input
                                    type="text"
                                    value={formData.primary_color}
                                    onChange={(e) => handleFormChange({ primary_color: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Başlangıç</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.gradient_start}
                                    onChange={(e) => handleFormChange({ gradient_start: e.target.value })}
                                    className="h-10 w-20"
                                />
                                <input
                                    type="text"
                                    value={formData.gradient_start}
                                    onChange={(e) => handleFormChange({ gradient_start: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Bitiş</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.gradient_end}
                                    onChange={(e) => handleFormChange({ gradient_end: e.target.value })}
                                    className="h-10 w-20"
                                />
                                <input
                                    type="text"
                                    value={formData.gradient_end}
                                    onChange={(e) => handleFormChange({ gradient_end: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderSEOTab() {
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">SEO Ayarları</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Varsayılan SEO Başlığı</label>
                    <input
                        type="text"
                        value={formData.default_seo_title}
                        onChange={(e) => handleFormChange({ default_seo_title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Hangi Katılım - Katılım Bankacılığı Karşılaştırma Platformu"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Varsayılan SEO Açıklaması</label>
                    <textarea
                        value={formData.default_seo_description}
                        onChange={(e) => handleFormChange({ default_seo_description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Katılım bankalarının kampanyalarını karşılaştırın..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">OG (Open Graph) Görseli</label>
                    <ImageUpload
                        folder="seo"
                        currentImageUrl={formData.og_image_url}
                        onUploadComplete={(url) => handleFormChange({ og_image_url: url })}
                        onDelete={() => handleFormChange({ og_image_url: '' })}
                        label="OG Image"
                    />
                    <p className="text-sm text-gray-500 mt-2">Sosyal medyada paylaşıldığında gösterilecek görsel (1200x630px önerilir)</p>
                </div>
            </div>
        );
    }

    function renderFooterTab() {
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Footer İletişim Bilgileri</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Footer Açıklaması</label>
                    <textarea
                        value={formData.footer_description}
                        onChange={(e) => handleFormChange({ footer_description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Katılım bankacılığı hakkında kısa bir açıklama..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                        <input
                            type="email"
                            value={formData.footer_email}
                            onChange={(e) => handleFormChange({ footer_email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="info@hangikatilim.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                        <input
                            type="tel"
                            value={formData.footer_phone}
                            onChange={(e) => handleFormChange({ footer_phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="+90 (212) 123 45 67"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                    <textarea
                        value={formData.footer_address}
                        onChange={(e) => handleFormChange({ footer_address: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="İstanbul, Türkiye"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Metni</label>
                    <input
                        type="text"
                        value={formData.copyright_text}
                        onChange={(e) => handleFormChange({ copyright_text: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="© 2025 Hangi Katılım. Tüm hakları saklıdır."
                    />
                </div>
            </div>
        );
    }

    function renderSosyalTab() {
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sosyal Medya Linkleri</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                        <input
                            type="url"
                            value={formData.facebook_url}
                            onChange={(e) => handleFormChange({ facebook_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://facebook.com/..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                        <input
                            type="url"
                            value={formData.twitter_url}
                            onChange={(e) => handleFormChange({ twitter_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://twitter.com/..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                        <input
                            type="url"
                            value={formData.instagram_url}
                            onChange={(e) => handleFormChange({ instagram_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://instagram.com/..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                        <input
                            type="url"
                            value={formData.linkedin_url}
                            onChange={(e) => handleFormChange({ linkedin_url: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="https://linkedin.com/company/..."
                        />
                    </div>
                </div>
            </div>
        );
    }

    function renderUygulamaTab() {
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Uygulama Mağaza Linkleri</h2>
                <p className="text-gray-600 mb-4">Mobil uygulama indirme linklerinizi ve badge görsellerinizi buradan yönetin</p>

                {/* App Store */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">📱 App Store</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.show_app_store_badge}
                                onChange={(e) => handleFormChange({ show_app_store_badge: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">{formData.show_app_store_badge ? 'Aktif' : 'Pasif'}</span>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">App Store URL</label>
                            <input
                                type="url"
                                value={formData.app_store_url}
                                onChange={(e) => handleFormChange({ app_store_url: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="https://apps.apple.com/app/..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4">App Store Badge (Görsel)</label>
                            <ImageUpload
                                folder="badges"
                                currentImageUrl={formData.app_store_badge_url}
                                onUploadComplete={(url) => handleFormChange({ app_store_badge_url: url })}
                                onDelete={() => handleFormChange({ app_store_badge_url: '' })}
                                label="App Store Badge"
                            />
                            <p className="text-sm text-gray-500 mt-2">App Store indirme butonu görseli</p>
                        </div>
                    </div>
                </div>

                {/* Google Play */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">🤖 Google Play</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.show_google_play_badge}
                                onChange={(e) => handleFormChange({ show_google_play_badge: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">{formData.show_google_play_badge ? 'Aktif' : 'Pasif'}</span>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Google Play URL</label>
                            <input
                                type="url"
                                value={formData.google_play_url}
                                onChange={(e) => handleFormChange({ google_play_url: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="https://play.google.com/store/apps/details?id=..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4">Google Play Badge (Görsel)</label>
                            <ImageUpload
                                folder="badges"
                                currentImageUrl={formData.google_play_badge_url}
                                onUploadComplete={(url) => handleFormChange({ google_play_badge_url: url })}
                                onDelete={() => handleFormChange({ google_play_badge_url: '' })}
                                label="Google Play Badge"
                            />
                            <p className="text-sm text-gray-500 mt-2">Google Play indirme butonu görseli</p>
                        </div>
                    </div>
                </div>

                {/* App Gallery */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">🏪 App Gallery (Huawei)</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.show_app_gallery_badge}
                                onChange={(e) => handleFormChange({ show_app_gallery_badge: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">{formData.show_app_gallery_badge ? 'Aktif' : 'Pasif'}</span>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">App Gallery URL</label>
                            <input
                                type="url"
                                value={formData.app_gallery_url}
                                onChange={(e) => handleFormChange({ app_gallery_url: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="https://appgallery.huawei.com/app/..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4">App Gallery Badge (Görsel)</label>
                            <ImageUpload
                                folder="badges"
                                currentImageUrl={formData.app_gallery_badge_url}
                                onUploadComplete={(url) => handleFormChange({ app_gallery_badge_url: url })}
                                onDelete={() => handleFormChange({ app_gallery_badge_url: '' })}
                                label="App Gallery Badge"
                            />
                            <p className="text-sm text-gray-500 mt-2">App Gallery indirme butonu görseli</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderHukukiTab() {
        return (
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Hukuki Belgeler</h2>
                <p className="text-gray-600 mb-4">Footer'da görünecek hukuki belge linklerinin metinlerini ve içeriklerini düzenleyin</p>

                {/* KVKK */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">KVKK Aydınlatma Metni</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Link Metni</label>
                            <input
                                type="text"
                                value={formData.kvkk_text}
                                onChange={(e) => handleFormChange({ kvkk_text: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="KVKK Aydınlatma Metni"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
                            <textarea
                                value={formData.kvkk_content}
                                onChange={(e) => handleFormChange({ kvkk_content: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="KVKK aydınlatma metninin tam içeriğini buraya yazın..."
                            />
                            <p className="text-sm text-gray-500 mt-1">{formData.kvkk_content.length} karakter</p>
                        </div>
                    </div>
                </div>

                {/* Gizlilik Politikası */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Gizlilik Politikası</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Link Metni</label>
                            <input
                                type="text"
                                value={formData.privacy_text}
                                onChange={(e) => handleFormChange({ privacy_text: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Gizlilik Politikası"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
                            <textarea
                                value={formData.privacy_content}
                                onChange={(e) => handleFormChange({ privacy_content: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="Gizlilik politikasının tam içeriğini buraya yazın..."
                            />
                            <p className="text-sm text-gray-500 mt-1">{formData.privacy_content.length} karakter</p>
                        </div>
                    </div>
                </div>

                {/* Kullanım Koşulları */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanım Koşulları</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Link Metni</label>
                            <input
                                type="text"
                                value={formData.terms_text}
                                onChange={(e) => handleFormChange({ terms_text: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Kullanım Koşulları"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
                            <textarea
                                value={formData.terms_content}
                                onChange={(e) => handleFormChange({ terms_content: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="Kullanım koşullarının tam içeriğini buraya yazın..."
                            />
                            <p className="text-sm text-gray-500 mt-1">{formData.terms_content.length} karakter</p>
                        </div>
                    </div>
                </div>

                {/* Çerez Politikası */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Çerez Politikası</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Link Metni</label>
                            <input
                                type="text"
                                value={formData.cookie_text}
                                onChange={(e) => handleFormChange({ cookie_text: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Çerez Politikası"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
                            <textarea
                                value={formData.cookie_content}
                                onChange={(e) => handleFormChange({ cookie_content: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="Çerez politikasının tam içeriğini buraya yazın..."
                            />
                            <p className="text-sm text-gray-500 mt-1">{formData.cookie_content.length} karakter</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};
