import React, { useEffect, useState, useRef } from 'react';
import {
    Plus, Trash2, Edit, ArrowUp, ArrowDown, Save, X,
    Image as ImageIcon, ExternalLink, Eye, EyeOff, Upload
} from 'lucide-react';
import { sponsorsApi, Sponsor, SponsorFormData } from '../../services/api/sponsors';
import { companiesApi } from '../../services/api/companies';
import { siteSettingsApi } from '../../services/api/siteSettings';
import type { Company } from '../../types/database';
import { useToast } from '../../hooks/useToast';
import { SubmitButton } from '../../components/admin/SubmitButton';

// Available gradient colors
const colorOptions = [
    { name: 'Mavi', value: 'from-blue-500 to-blue-600' },
    { name: 'Yeşil', value: 'from-green-500 to-green-600' },
    { name: 'Mor', value: 'from-purple-500 to-purple-600' },
    { name: 'Kırmızı', value: 'from-red-500 to-red-600' },
    { name: 'Turuncu', value: 'from-orange-500 to-orange-600' },
    { name: 'Cyan', value: 'from-cyan-500 to-cyan-600' },
    { name: 'Pembe', value: 'from-pink-500 to-pink-600' },
    { name: 'Amber', value: 'from-amber-500 to-amber-600' },
];

// Preview Card Component
const PreviewCard: React.FC<{ sponsor: SponsorFormData; isNew?: boolean }> = ({ sponsor, isNew }) => (
    <div className="group block bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 transition-all duration-300">
        {/* Gradient Accent */}
        <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${sponsor.color || 'from-blue-500 to-blue-600'} mb-3`} />

        {/* Logo or Name */}
        <div className="flex items-center gap-2 mb-3">
            {sponsor.logo_url ? (
                <img src={sponsor.logo_url} alt={sponsor.name} className="h-14 w-auto object-contain" />
            ) : (
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                    {sponsor.name || 'Sponsor Adı'}
                </span>
            )}
        </div>

        {/* Title */}
        <h5 className="text-sm font-bold text-gray-800 dark:text-white mb-1">
            {sponsor.title || 'Başlık'}
        </h5>

        {/* Description */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
            {sponsor.description || 'Açıklama...'}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-1 text-xs font-semibold text-primary-600">
            <span>{sponsor.cta_text || 'Detayları Gör'}</span>
            <ExternalLink size={12} />
        </div>
    </div>
);

export const Sponsors: React.FC = () => {
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<Sponsor | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [sponsorAreaEnabled, setSponsorAreaEnabled] = useState(true);
    const [settingsId, setSettingsId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<SponsorFormData>({
        name: '',
        logo_url: null,
        title: '',
        description: '',
        cta_text: 'Detayları Gör',
        cta_url: '',
        color: 'from-blue-500 to-blue-600',
        is_active: true,
        order_no: 0
    });

    // Load sponsors
    useEffect(() => {
        loadSponsors();
    }, []);

    const loadSponsors = async () => {
        setLoading(true);
        const [sponsorData, companyData] = await Promise.all([
            sponsorsApi.getAll(),
            companiesApi.getActiveCompanies()
        ]);
        setSponsors(sponsorData);
        setCompanies(companyData);
        setLoading(false);
    };

    // Load sponsor area enabled setting
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await siteSettingsApi.getSettings();
                if (settings) {
                    setSponsorAreaEnabled(settings.sponsor_area_enabled ?? true);
                    setSettingsId(settings.id);
                }
            } catch (error) {
                console.error('Failed to load sponsor settings:', error);
            }
        };
        loadSettings();
    }, []);

    // Toggle sponsor area enabled
    const handleToggleSponsorArea = async () => {
        if (!settingsId) return;
        const newValue = !sponsorAreaEnabled;
        setSponsorAreaEnabled(newValue);
        try {
            await siteSettingsApi.updateSettings(settingsId, { sponsor_area_enabled: newValue });
            showToast(newValue ? 'Sponsor alanı etkinleştirildi' : 'Sponsor alanı devre dışı bırakıldı', 'success');
        } catch (error) {
            console.error('Failed to toggle sponsor area:', error);
            setSponsorAreaEnabled(!newValue); // Revert on error
            showToast('Ayar güncellenemedi', 'error');
        }
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editing) {
                await sponsorsApi.update(editing.id, formData);
                showToast('Sponsor güncellendi', 'success');
            } else {
                await sponsorsApi.create({
                    ...formData,
                    order_no: sponsors.length + 1
                });
                showToast('Sponsor eklendi', 'success');
            }
            await loadSponsors();
            resetForm();
        } catch (error) {
            console.error('Save error:', error);
            showToast('Kayıt hatası', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Handle edit
    const handleEdit = (sponsor: Sponsor) => {
        setEditing(sponsor);
        setFormData({
            name: sponsor.name,
            logo_url: sponsor.logo_url,
            title: sponsor.title,
            description: sponsor.description || '',
            cta_text: sponsor.cta_text,
            cta_url: sponsor.cta_url,
            color: sponsor.color,
            is_active: sponsor.is_active,
            order_no: sponsor.order_no
        });
        setShowForm(true);
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Bu sponsoru silmek istediğinize emin misiniz?')) return;

        try {
            await sponsorsApi.delete(id);
            showToast('Sponsor silindi', 'success');
            await loadSponsors();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Silme hatası', 'error');
        }
    };

    // Handle toggle active
    const handleToggleActive = async (id: string, currentState: boolean) => {
        try {
            await sponsorsApi.toggleActive(id, !currentState);
            await loadSponsors();
        } catch (error) {
            console.error('Toggle error:', error);
            showToast('Durum değiştirme hatası', 'error');
        }
    };

    // Handle reorder
    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newSponsors = [...sponsors];
        [newSponsors[index - 1], newSponsors[index]] = [newSponsors[index], newSponsors[index - 1]];

        const reorderData = newSponsors.map((s, i) => ({ id: s.id, order_no: i + 1 }));
        await sponsorsApi.reorderItems(reorderData);
        setSponsors(newSponsors);
    };

    const handleMoveDown = async (index: number) => {
        if (index === sponsors.length - 1) return;
        const newSponsors = [...sponsors];
        [newSponsors[index], newSponsors[index + 1]] = [newSponsors[index + 1], newSponsors[index]];

        const reorderData = newSponsors.map((s, i) => ({ id: s.id, order_no: i + 1 }));
        await sponsorsApi.reorderItems(reorderData);
        setSponsors(newSponsors);
    };

    // Handle logo upload
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const logoUrl = await sponsorsApi.uploadLogo(file);
            setFormData(prev => ({ ...prev, logo_url: logoUrl }));
            showToast('Logo yüklendi', 'success');
        } catch (error) {
            console.error('Logo upload error:', error);
            showToast('Logo yükleme hatası', 'error');
        } finally {
            setUploadingLogo(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setEditing(null);
        setShowForm(false);
        setFormData({
            name: '',
            logo_url: null,
            title: '',
            description: '',
            cta_text: 'Detayları Gör',
            cta_url: '',
            color: 'from-blue-500 to-blue-600',
            is_active: true,
            order_no: 0
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sponsor Yönetimi</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Hesaplayıcı altında görünen sponsor kartlarını yönetin
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Global Toggle */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sponsor Alanı</span>
                        <button
                            onClick={handleToggleSponsorArea}
                            className={`relative w-12 h-6 rounded-full transition-colors ${sponsorAreaEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                        >
                            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${sponsorAreaEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-xs font-semibold ${sponsorAreaEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                            {sponsorAreaEnabled ? 'Açık' : 'Kapalı'}
                        </span>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus size={18} />
                            Yeni Sponsor
                        </button>
                    )}
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {editing ? 'Sponsor Düzenle' : 'Yeni Sponsor Ekle'}
                        </h2>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Form Fields */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Sponsor Adı *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Örn: Katılım Finans"
                                />
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Logo
                                </label>
                                <div className="flex items-center gap-3">
                                    {formData.logo_url ? (
                                        <div className="relative">
                                            <img
                                                src={formData.logo_url}
                                                alt="Logo"
                                                className="h-12 w-auto object-contain border rounded-lg p-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, logo_url: null }))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-12 w-24 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                                            <ImageIcon size={20} className="text-gray-400" />
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingLogo}
                                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                    >
                                        {uploadingLogo ? (
                                            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Upload size={16} />
                                        )}
                                        Logo Yükle
                                    </button>
                                </div>
                                {/* URL Input */}
                                <div className="flex gap-2 mt-2">
                                    <input
                                        id="sponsor-logo-url"
                                        type="url"
                                        placeholder="veya Logo URL yapıştır..."
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val) {
                                                    setFormData(prev => ({ ...prev, logo_url: val }));
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.querySelector('#sponsor-logo-url') as HTMLInputElement;
                                            if (input?.value.trim()) {
                                                setFormData(prev => ({ ...prev, logo_url: input.value.trim() }));
                                                input.value = '';
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                                    >
                                        Uygula
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">PNG veya SVG formatında, max 500KB — veya harici URL yapıştırın</p>

                                {/* Company Logo Picker */}
                                {companies.filter(c => c.logo_url).length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">veya firma logolarından seç:</p>
                                        <div className="grid grid-cols-5 gap-2">
                                            {companies.filter(c => c.logo_url).map((company) => (
                                                <button
                                                    key={company.id}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, logo_url: company.logo_url }))}
                                                    className={`p-2 border-2 rounded-lg hover:border-primary-400 transition-all ${formData.logo_url === company.logo_url ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-slate-600'}`}
                                                    title={company.name}
                                                >
                                                    <img
                                                        src={company.logo_url!}
                                                        alt={company.name}
                                                        className="h-8 w-full object-contain"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Başlık *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Örn: Faizsiz Finansman Fırsatı"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Açıklama
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                    placeholder="Kısa bir açıklama..."
                                />
                            </div>

                            {/* CTA Text */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Buton Metni
                                </label>
                                <input
                                    type="text"
                                    value={formData.cta_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cta_text: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Örn: Detayları Gör"
                                />
                            </div>

                            {/* CTA URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Link URL *
                                </label>
                                <input
                                    type="text"
                                    value={formData.cta_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cta_url: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Örn: /kampanyalar veya https://..."
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Renk Teması
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                                            className={`p-2 rounded-lg border-2 transition-all ${formData.color === color.value
                                                ? 'border-primary-600 ring-2 ring-primary-200'
                                                : 'border-gray-200 dark:border-slate-600'
                                                }`}
                                        >
                                            <div className={`h-4 rounded bg-gradient-to-r ${color.value}`} />
                                            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">{color.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-2">
                                <SubmitButton loading={saving}>
                                    <Save size={18} />
                                    {editing ? 'Güncelle' : 'Kaydet'}
                                </SubmitButton>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>

                        {/* Live Preview */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Önizleme</h3>
                            <PreviewCard sponsor={formData} isNew={!editing} />
                        </div>
                    </div>
                </div>
            )}

            {/* Sponsors List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="font-bold text-gray-900 dark:text-white">Sponsor Listesi</h2>
                </div>

                {sponsors.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Henüz sponsor eklenmemiş
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-slate-700">
                        {sponsors.map((sponsor, index) => (
                            <div
                                key={sponsor.id}
                                className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${!sponsor.is_active ? 'opacity-50' : ''}`}
                            >
                                {/* Order Number */}
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === sponsors.length - 1}
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>

                                {/* Logo or Name */}
                                <div className="w-16 h-10 flex items-center justify-center bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                                    {sponsor.logo_url ? (
                                        <img src={sponsor.logo_url} alt={sponsor.name} className="h-8 w-auto object-contain" />
                                    ) : (
                                        <ImageIcon size={20} className="text-gray-400" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-white truncate">{sponsor.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{sponsor.title}</div>
                                </div>

                                {/* Color Preview */}
                                <div className={`w-6 h-6 rounded bg-gradient-to-r ${sponsor.color}`} />

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleActive(sponsor.id, sponsor.is_active)}
                                        className={`p-2 rounded-lg transition-colors ${sponsor.is_active
                                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                            }`}
                                        title={sponsor.is_active ? 'Aktif' : 'Pasif'}
                                    >
                                        {sponsor.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(sponsor)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sponsor.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sponsors;
