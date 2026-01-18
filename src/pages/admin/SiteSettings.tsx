import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { siteSettingsApi } from '../../services/api/siteSettings';
import { uiEffectsApi, SnowConfig, DEFAULT_SNOW_CONFIG } from '../../services/api/uiEffects';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import type { SiteSettings } from '../../types/database';
import { Save, RefreshCw, Search, Settings, Globe, Mail, Share2, Smartphone, FileText, Copy, Check, Snowflake, Eye, X, Plus, TrendingUp } from 'lucide-react';
import { startSnow, stopSnow, updateSnow, isSnowRunning } from '../../utils/snowEffect';

type TabType = 'genel' | 'seo' | 'footer' | 'sosyal' | 'uygulama' | 'hukuki' | 'efektler' | 'piyasa';

// Reusable Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.005] ${className}`}>
        {title && (
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>
        )}
        <div className="p-5">{children}</div>
    </div>
);

// Input Field Component
const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    helper?: string;
    rows?: number;
    showCopy?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, helper, rows, showCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (value) {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
            <div className="relative">
                {rows ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={rows}
                        placeholder={placeholder}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent resize-none"
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={`w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent ${showCopy ? 'pr-10' : ''}`}
                    />
                )}
                {showCopy && value && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                )}
            </div>
            {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
    );
};

// Toggle Switch Component
const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-slate-900 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </label>
);

// Brand Image Card Component
const BrandImageCard: React.FC<{
    title: string;
    imageUrl: string;
    onUpload: (url: string) => void;
    onUrlChange: (url: string) => void;
    onDelete: () => void;
    folder: string;
}> = ({ title, imageUrl, onUpload, onUrlChange, onDelete, folder }) => (
    <Card className="flex-1">
        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">{title}</h4>
        <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="max-h-full max-w-full object-contain" />
            ) : (
                <span className="text-xs text-slate-400">Görsel yok</span>
            )}
        </div>
        <ImageUpload
            folder={folder}
            currentImageUrl={imageUrl}
            onUploadComplete={onUpload}
            onDelete={onDelete}
            label={title}
            compact
        />
        <input
            type="text"
            value={imageUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="veya URL yapıştır..."
            className="mt-2 w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400"
        />
    </Card>
);

export const SiteSettings: React.FC = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('genel');
    const [searchQuery, setSearchQuery] = useState('');

    // Snow Effect State
    const [snowConfig, setSnowConfig] = useState<SnowConfig>(DEFAULT_SNOW_CONFIG);
    const [snowLoading, setSnowLoading] = useState(false);
    const [snowSaving, setSnowSaving] = useState(false);
    const [snowPreviewing, setSnowPreviewing] = useState(false);
    const [newExcludedPage, setNewExcludedPage] = useState('');

    const { success, error: showError } = useToast();

    // Form state (renk alanları kaldırıldı)
    const [formData, setFormData] = useState({
        site_name: 'Katılım Uzmanı',
        logo_url: '',
        dark_logo_url: '',
        favicon_url: '',
        default_seo_title: '',
        default_seo_description: '',
        og_image_url: '',
        footer_description: '',
        footer_email: '',
        footer_phone: '',
        footer_address: '',
        app_store_url: '',
        google_play_url: '',
        app_gallery_url: '',
        app_store_badge_url: '',
        google_play_badge_url: '',
        app_gallery_badge_url: '',
        show_app_store_badge: true,
        show_google_play_badge: true,
        show_app_gallery_badge: true,
        kvkk_text: 'KVKK Aydınlatma Metni',
        privacy_text: 'Gizlilik Politikası',
        terms_text: 'Kullanım Koşulları',
        cookie_text: 'Çerez Politikası',
        kvkk_content: '',
        privacy_content: '',
        terms_content: '',
        cookie_content: '',
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        linkedin_url: '',
        copyright_text: '',
        ticker_active: true,
        gold_ons_price: '2060',
    });

    const [originalData, setOriginalData] = useState<typeof formData | null>(null);

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        try {
            const data = await siteSettingsApi.getSettings();
            if (data) {
                setSettings(data);
                const newFormData = {
                    site_name: data.site_name || 'Katılım Uzmanı',
                    logo_url: data.logo_url || '',
                    dark_logo_url: data.dark_logo_url || '',
                    favicon_url: data.favicon_url || '',
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
                    ticker_active: data.ticker_active !== false,
                    gold_ons_price: data.gold_ons_price?.toString() || '2060',
                };
                setFormData(newFormData);
                setOriginalData(newFormData);
            }
        } catch (err) {
            showError('Ayarlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    // Load snow config
    const loadSnowConfig = useCallback(async () => {
        try {
            setSnowLoading(true);
            const config = await uiEffectsApi.getSnowConfig();
            setSnowConfig(config);
        } catch (err) {
            console.error('Snow config yüklenemedi:', err);
        } finally {
            setSnowLoading(false);
        }
    }, []);

    // Load snow config when Efektler tab is active
    useEffect(() => {
        if (activeTab === 'efektler') {
            loadSnowConfig();
        }
    }, [activeTab, loadSnowConfig]);

    // Cleanup preview on unmount or tab change
    useEffect(() => {
        return () => {
            if (isSnowRunning()) {
                stopSnow();
            }
        };
    }, [activeTab]);

    // Handle snow config change
    const handleSnowConfigChange = (updates: Partial<SnowConfig>) => {
        setSnowConfig(prev => ({ ...prev, ...updates }));
    };

    // Toggle preview
    const handleSnowPreview = () => {
        if (snowPreviewing) {
            stopSnow();
            setSnowPreviewing(false);
        } else {
            startSnow(snowConfig);
            setSnowPreviewing(true);
        }
    };

    // Save snow config
    const handleSaveSnowConfig = async () => {
        try {
            setSnowSaving(true);
            await uiEffectsApi.updateSnowConfig(snowConfig);
            success('Kar efekti ayarları kaydedildi');

            // Update preview if active
            if (snowPreviewing) {
                updateSnow(snowConfig);
            }
        } catch (err) {
            showError('Kar efekti ayarları kaydedilemedi');
        } finally {
            setSnowSaving(false);
        }
    };

    // Add excluded page
    const addExcludedPage = () => {
        if (newExcludedPage.trim() && !snowConfig.excludedPages.includes(newExcludedPage.trim())) {
            handleSnowConfigChange({
                excludedPages: [...snowConfig.excludedPages, newExcludedPage.trim()]
            });
            setNewExcludedPage('');
        }
    };

    // Remove excluded page
    const removeExcludedPage = (page: string) => {
        handleSnowConfigChange({
            excludedPages: snowConfig.excludedPages.filter(p => p !== page)
        });
    };

    const hasChanges = useMemo(() => {
        if (!originalData) return false;
        return JSON.stringify(formData) !== JSON.stringify(originalData);
    }, [formData, originalData]);

    const handleFormChange = (updates: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Renk alanları hariç tüm formData'yı gönder
            const updateData: Partial<SiteSettings> = {
                ...formData,
                gold_ons_price: parseFloat(formData.gold_ons_price) || 2060
            };
            if (settings?.id) {
                await siteSettingsApi.updateSettings(settings.id, updateData);
                success('Ayarlar kaydedildi');
                setOriginalData(formData);

                // Site tarafında cache invalidation için window event tetikle
                window.dispatchEvent(new CustomEvent('siteSettingsUpdated'));
            }
            await loadSettings();
        } catch (err) {
            showError('Kaydetme başarısız');
        } finally {
            setSaving(false);
        }
    };

    const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode; keywords: string[] }> = [
        { id: 'genel', label: 'Genel', icon: <Settings size={16} />, keywords: ['logo', 'favicon', 'site adı', 'marka'] },
        { id: 'seo', label: 'SEO', icon: <Globe size={16} />, keywords: ['seo', 'başlık', 'açıklama', 'og', 'meta'] },
        { id: 'footer', label: 'Footer', icon: <Mail size={16} />, keywords: ['footer', 'iletişim', 'email', 'telefon', 'adres', 'copyright'] },
        { id: 'sosyal', label: 'Sosyal Medya', icon: <Share2 size={16} />, keywords: ['facebook', 'twitter', 'instagram', 'linkedin', 'sosyal'] },
        { id: 'uygulama', label: 'Uygulama', icon: <Smartphone size={16} />, keywords: ['app store', 'google play', 'app gallery', 'uygulama', 'mobil'] },
        { id: 'hukuki', label: 'Hukuki', icon: <FileText size={16} />, keywords: ['kvkk', 'gizlilik', 'kullanım', 'çerez', 'politika', 'hukuki'] },
        { id: 'efektler', label: 'Efektler', icon: <Snowflake size={16} />, keywords: ['kar', 'snow', 'efekt', 'animasyon', 'kış'] },
        { id: 'piyasa', label: 'Piyasa Şeridi', icon: <TrendingUp size={16} />, keywords: ['ticker', 'kur', 'döviz', 'altın', 'piyasa', 'market', 'finance'] },
    ];

    // Search filter
    const filteredTabs = searchQuery
        ? tabs.filter(t => t.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) || t.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : tabs;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 pb-4 -mx-6 px-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site Ayarları</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Site genelindeki ayarları yönetin</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {settings?.updated_at && (
                            <span className="text-xs text-slate-500 hidden sm:inline">
                                Son: {new Date(settings.updated_at).toLocaleDateString('tr-TR')}
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white dark:text-slate-900 rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
                        >
                            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mt-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ayar ara... (logo, seo, sosyal...)"
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Pill Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
                {filteredTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'genel' && (
                    <>
                        {/* Site Name */}
                        <Card title="Site Bilgisi">
                            <InputField
                                label="Site Adı"
                                value={formData.site_name}
                                onChange={(v) => handleFormChange({ site_name: v })}
                                placeholder="Katılım Uzmanı"
                                helper="Tarayıcı sekmesinde ve SEO'da kullanılır"
                            />
                        </Card>

                        {/* Brand Assets */}
                        <Card title="Marka Görselleri">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <BrandImageCard
                                    title="Logo (Light)"
                                    imageUrl={formData.logo_url}
                                    onUpload={(url) => handleFormChange({ logo_url: url })}
                                    onUrlChange={(url) => handleFormChange({ logo_url: url })}
                                    onDelete={() => handleFormChange({ logo_url: '' })}
                                    folder="branding"
                                />
                                <BrandImageCard
                                    title="Logo (Dark)"
                                    imageUrl={formData.dark_logo_url}
                                    onUpload={(url) => handleFormChange({ dark_logo_url: url })}
                                    onUrlChange={(url) => handleFormChange({ dark_logo_url: url })}
                                    onDelete={() => handleFormChange({ dark_logo_url: '' })}
                                    folder="branding"
                                />
                                <BrandImageCard
                                    title="Favicon"
                                    imageUrl={formData.favicon_url}
                                    onUpload={(url) => handleFormChange({ favicon_url: url })}
                                    onUrlChange={(url) => handleFormChange({ favicon_url: url })}
                                    onDelete={() => handleFormChange({ favicon_url: '' })}
                                    folder="branding"
                                />
                            </div>
                        </Card>
                    </>
                )}

                {activeTab === 'seo' && (
                    <Card title="SEO Ayarları">
                        <div className="space-y-4">
                            <InputField
                                label="Varsayılan SEO Başlığı"
                                value={formData.default_seo_title}
                                onChange={(v) => handleFormChange({ default_seo_title: v })}
                                placeholder="Katılım Uzmanı - Katılım Bankacılığı Karşılaştırma"
                            />
                            <InputField
                                label="Varsayılan SEO Açıklaması"
                                value={formData.default_seo_description}
                                onChange={(v) => handleFormChange({ default_seo_description: v })}
                                placeholder="Katılım bankalarının kampanyalarını karşılaştırın..."
                                rows={3}
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">OG Görseli</label>
                                <ImageUpload
                                    folder="seo"
                                    currentImageUrl={formData.og_image_url}
                                    onUploadComplete={(url) => handleFormChange({ og_image_url: url })}
                                    onDelete={() => handleFormChange({ og_image_url: '' })}
                                    label="OG Image"
                                />
                                <p className="mt-1 text-xs text-slate-500">Sosyal medya paylaşımlarında görünür (1200x630px önerilir)</p>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'footer' && (
                    <Card title="Footer İletişim">
                        <div className="space-y-4">
                            <InputField
                                label="Footer Açıklaması"
                                value={formData.footer_description}
                                onChange={(v) => handleFormChange({ footer_description: v })}
                                placeholder="Kısa bir site açıklaması..."
                                rows={2}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField
                                    label="E-posta"
                                    value={formData.footer_email}
                                    onChange={(v) => handleFormChange({ footer_email: v })}
                                    type="email"
                                    placeholder="info@example.com"
                                    showCopy
                                />
                                <InputField
                                    label="Telefon"
                                    value={formData.footer_phone}
                                    onChange={(v) => handleFormChange({ footer_phone: v })}
                                    placeholder="+90 XXX XXX XX XX"
                                    showCopy
                                />
                            </div>
                            <InputField
                                label="Adres"
                                value={formData.footer_address}
                                onChange={(v) => handleFormChange({ footer_address: v })}
                                rows={2}
                                placeholder="İstanbul, Türkiye"
                            />
                            <InputField
                                label="Copyright Metni"
                                value={formData.copyright_text}
                                onChange={(v) => handleFormChange({ copyright_text: v })}
                                placeholder="© 2025 Katılım Uzmanı. Tüm hakları saklıdır."
                            />
                        </div>
                    </Card>
                )}

                {activeTab === 'sosyal' && (
                    <Card title="Sosyal Medya Linkleri">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="Facebook"
                                value={formData.facebook_url}
                                onChange={(v) => handleFormChange({ facebook_url: v })}
                                type="url"
                                placeholder="https://facebook.com/..."
                                showCopy
                            />
                            <InputField
                                label="X (Twitter)"
                                value={formData.twitter_url}
                                onChange={(v) => handleFormChange({ twitter_url: v })}
                                type="url"
                                placeholder="https://x.com/..."
                                showCopy
                            />
                            <InputField
                                label="Instagram"
                                value={formData.instagram_url}
                                onChange={(v) => handleFormChange({ instagram_url: v })}
                                type="url"
                                placeholder="https://instagram.com/..."
                                showCopy
                            />
                            <InputField
                                label="LinkedIn"
                                value={formData.linkedin_url}
                                onChange={(v) => handleFormChange({ linkedin_url: v })}
                                type="url"
                                placeholder="https://linkedin.com/company/..."
                                showCopy
                            />
                        </div>
                    </Card>
                )}

                {activeTab === 'uygulama' && (
                    <div className="space-y-4">
                        {/* App Store */}
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">App Store</h4>
                                <Toggle
                                    checked={formData.show_app_store_badge}
                                    onChange={(v) => handleFormChange({ show_app_store_badge: v })}
                                    label={formData.show_app_store_badge ? 'Aktif' : 'Pasif'}
                                />
                            </div>
                            <div className="space-y-3">
                                <InputField
                                    label="App Store URL"
                                    value={formData.app_store_url}
                                    onChange={(v) => handleFormChange({ app_store_url: v })}
                                    type="url"
                                    placeholder="https://apps.apple.com/app/..."
                                    showCopy
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Badge Görseli</label>
                                    <ImageUpload
                                        folder="badges"
                                        currentImageUrl={formData.app_store_badge_url}
                                        onUploadComplete={(url) => handleFormChange({ app_store_badge_url: url })}
                                        onDelete={() => handleFormChange({ app_store_badge_url: '' })}
                                        label="App Store Badge"
                                        compact
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Google Play */}
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Google Play</h4>
                                <Toggle
                                    checked={formData.show_google_play_badge}
                                    onChange={(v) => handleFormChange({ show_google_play_badge: v })}
                                    label={formData.show_google_play_badge ? 'Aktif' : 'Pasif'}
                                />
                            </div>
                            <div className="space-y-3">
                                <InputField
                                    label="Google Play URL"
                                    value={formData.google_play_url}
                                    onChange={(v) => handleFormChange({ google_play_url: v })}
                                    type="url"
                                    placeholder="https://play.google.com/store/apps/..."
                                    showCopy
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Badge Görseli</label>
                                    <ImageUpload
                                        folder="badges"
                                        currentImageUrl={formData.google_play_badge_url}
                                        onUploadComplete={(url) => handleFormChange({ google_play_badge_url: url })}
                                        onDelete={() => handleFormChange({ google_play_badge_url: '' })}
                                        label="Google Play Badge"
                                        compact
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* App Gallery */}
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">App Gallery (Huawei)</h4>
                                <Toggle
                                    checked={formData.show_app_gallery_badge}
                                    onChange={(v) => handleFormChange({ show_app_gallery_badge: v })}
                                    label={formData.show_app_gallery_badge ? 'Aktif' : 'Pasif'}
                                />
                            </div>
                            <div className="space-y-3">
                                <InputField
                                    label="App Gallery URL"
                                    value={formData.app_gallery_url}
                                    onChange={(v) => handleFormChange({ app_gallery_url: v })}
                                    type="url"
                                    placeholder="https://appgallery.huawei.com/app/..."
                                    showCopy
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Badge Görseli</label>
                                    <ImageUpload
                                        folder="badges"
                                        currentImageUrl={formData.app_gallery_badge_url}
                                        onUploadComplete={(url) => handleFormChange({ app_gallery_badge_url: url })}
                                        onDelete={() => handleFormChange({ app_gallery_badge_url: '' })}
                                        label="App Gallery Badge"
                                        compact
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'hukuki' && (
                    <div className="space-y-4">
                        {/* KVKK */}
                        <Card title="KVKK Aydınlatma Metni">
                            <div className="space-y-3">
                                <InputField
                                    label="Link Metni"
                                    value={formData.kvkk_text}
                                    onChange={(v) => handleFormChange({ kvkk_text: v })}
                                    placeholder="KVKK Aydınlatma Metni"
                                />
                                <InputField
                                    label="İçerik"
                                    value={formData.kvkk_content}
                                    onChange={(v) => handleFormChange({ kvkk_content: v })}
                                    rows={5}
                                    placeholder="KVKK metninin içeriği..."
                                    helper={`${formData.kvkk_content.length} karakter`}
                                />
                            </div>
                        </Card>

                        {/* Privacy */}
                        <Card title="Gizlilik Politikası">
                            <div className="space-y-3">
                                <InputField
                                    label="Link Metni"
                                    value={formData.privacy_text}
                                    onChange={(v) => handleFormChange({ privacy_text: v })}
                                    placeholder="Gizlilik Politikası"
                                />
                                <InputField
                                    label="İçerik"
                                    value={formData.privacy_content}
                                    onChange={(v) => handleFormChange({ privacy_content: v })}
                                    rows={5}
                                    placeholder="Gizlilik politikası içeriği..."
                                    helper={`${formData.privacy_content.length} karakter`}
                                />
                            </div>
                        </Card>

                        {/* Terms */}
                        <Card title="Kullanım Koşulları">
                            <div className="space-y-3">
                                <InputField
                                    label="Link Metni"
                                    value={formData.terms_text}
                                    onChange={(v) => handleFormChange({ terms_text: v })}
                                    placeholder="Kullanım Koşulları"
                                />
                                <InputField
                                    label="İçerik"
                                    value={formData.terms_content}
                                    onChange={(v) => handleFormChange({ terms_content: v })}
                                    rows={5}
                                    placeholder="Kullanım koşulları içeriği..."
                                    helper={`${formData.terms_content.length} karakter`}
                                />
                            </div>
                        </Card>

                        {/* Cookies */}
                        <Card title="Çerez Politikası">
                            <div className="space-y-3">
                                <InputField
                                    label="Link Metni"
                                    value={formData.cookie_text}
                                    onChange={(v) => handleFormChange({ cookie_text: v })}
                                    placeholder="Çerez Politikası"
                                />
                                <InputField
                                    label="İçerik"
                                    value={formData.cookie_content}
                                    onChange={(v) => handleFormChange({ cookie_content: v })}
                                    rows={5}
                                    placeholder="Çerez politikası içeriği..."
                                    helper={`${formData.cookie_content.length} karakter`}
                                />
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'efektler' && (
                    <div className="space-y-4">
                        {snowLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600"></div>
                            </div>
                        ) : (
                            <>
                                {/* Snow Effect Toggle & Save */}
                                <Card>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <Snowflake size={24} className="text-blue-500" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Kar Efekti</h3>
                                                <p className="text-sm text-slate-500">Site genelinde kar yağışı animasyonu</p>
                                            </div>
                                        </div>
                                        <Toggle
                                            checked={snowConfig.enabled}
                                            onChange={(v) => handleSnowConfigChange({ enabled: v })}
                                            label={snowConfig.enabled ? 'Aktif' : 'Pasif'}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSnowPreview}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${snowPreviewing
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <Eye size={16} />
                                            {snowPreviewing ? 'Önizlemeyi Kapat' : 'Canlı Önizleme'}
                                        </button>
                                        <button
                                            onClick={handleSaveSnowConfig}
                                            disabled={snowSaving}
                                            className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-400 text-white dark:text-slate-900 rounded-xl font-medium transition-colors"
                                        >
                                            {snowSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                            Kaydet
                                        </button>
                                    </div>
                                </Card>

                                {/* Parameters */}
                                <Card title="Parametreler">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Intensity */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Yoğunluk: {snowConfig.intensity}
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="200"
                                                step="10"
                                                value={snowConfig.intensity}
                                                onChange={(e) => handleSnowConfigChange({ intensity: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                <span>0</span>
                                                <span>200</span>
                                            </div>
                                        </div>

                                        {/* Speed */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Hız: {snowConfig.speed.toFixed(1)}
                                            </label>
                                            <input
                                                type="range"
                                                min="0.2"
                                                max="3.0"
                                                step="0.1"
                                                value={snowConfig.speed}
                                                onChange={(e) => handleSnowConfigChange({ speed: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                <span>Yavaş</span>
                                                <span>Hızlı</span>
                                            </div>
                                        </div>

                                        {/* Size Min */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Min Boyut: {snowConfig.sizeMin.toFixed(1)}px
                                            </label>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="4.0"
                                                step="0.1"
                                                value={snowConfig.sizeMin}
                                                onChange={(e) => handleSnowConfigChange({ sizeMin: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                                            />
                                        </div>

                                        {/* Size Max */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Max Boyut: {snowConfig.sizeMax.toFixed(1)}px
                                            </label>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="4.0"
                                                step="0.1"
                                                value={snowConfig.sizeMax}
                                                onChange={(e) => handleSnowConfigChange({ sizeMax: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                                            />
                                        </div>

                                        {/* Wind */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Rüzgar: {snowConfig.wind.toFixed(1)}
                                            </label>
                                            <input
                                                type="range"
                                                min="-1.0"
                                                max="1.0"
                                                step="0.1"
                                                value={snowConfig.wind}
                                                onChange={(e) => handleSnowConfigChange({ wind: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                <span>← Sola</span>
                                                <span>Sağa →</span>
                                            </div>
                                        </div>

                                        {/* Opacity */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Opaklık: {Math.round(snowConfig.opacity * 100)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={snowConfig.opacity}
                                                onChange={(e) => handleSnowConfigChange({ opacity: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* Options */}
                                <Card title="Seçenekler">
                                    <div className="space-y-4">
                                        <Toggle
                                            checked={snowConfig.winterMode}
                                            onChange={(v) => handleSnowConfigChange({ winterMode: v })}
                                            label="Sadece Kış Modu (Aralık, Ocak, Şubat aylarında otomatik aktif)"
                                        />
                                        <p className="text-xs text-slate-500 ml-13">
                                            Bu seçenek aktifken, kar efekti sadece kış aylarında (Aralık-Şubat) otomatik olarak açılır.
                                            Diğer aylarda "Aktif" durumu yok sayılır.
                                        </p>
                                    </div>
                                </Card>

                                {/* Excluded Pages */}
                                <Card title="Hariç Tutulacak Sayfalar">
                                    <p className="text-sm text-slate-500 mb-4">
                                        Kar efektinin görünmeyeceği sayfaları belirleyin. Örn: /admin, /login
                                    </p>

                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={newExcludedPage}
                                            onChange={(e) => setNewExcludedPage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addExcludedPage()}
                                            placeholder="/sayfa-yolu"
                                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        />
                                        <button
                                            onClick={addExcludedPage}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Plus size={16} />
                                            Ekle
                                        </button>
                                    </div>

                                    {snowConfig.excludedPages.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {snowConfig.excludedPages.map((page) => (
                                                <div
                                                    key={page}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
                                                >
                                                    <span className="text-slate-700 dark:text-slate-300">{page}</span>
                                                    <button
                                                        onClick={() => removeExcludedPage(page)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Henüz hariç tutulan sayfa yok</p>
                                    )}
                                </Card>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'piyasa' && (
                    <Card title="Piyasa Şeridi Ayarları">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Piyasa Şeridi (Ticker)</h4>
                                    <p className="text-sm text-slate-500">Üst menü altında döviz ve altın kurlarını gösterir.</p>
                                </div>
                                <Toggle
                                    checked={formData.ticker_active}
                                    onChange={(v) => handleFormChange({ ticker_active: v })}
                                    label={formData.ticker_active ? 'Aktif' : 'Pasif'}
                                />
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                                <InputField
                                    label="Ons Altın Fiyatı (USD)"
                                    value={formData.gold_ons_price}
                                    onChange={(v) => handleFormChange({ gold_ons_price: v })}
                                    type="number"
                                    placeholder="2060"
                                    helper="Gram altın hesaplaması için kullanılır: (Ons * Dolar) / 31.1035"
                                />
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
