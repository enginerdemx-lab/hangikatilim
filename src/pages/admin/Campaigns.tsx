import React, { useEffect, useState } from 'react';
import { campaignsApi } from '../../services/api/campaigns';
import { companiesApi } from '../../services/api/companies';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { useToast } from '../../hooks/useToast';
import { useFormValidation, type ValidationRules } from '../../hooks/useFormValidation';
import { SubmitButton } from '../../components/admin/SubmitButton';
import type { Campaign, Company, CampaignFormData, BadgeType } from '../../types/database';

// Validation rules
const validationRules: ValidationRules<CampaignFormData> = {
    company_id: { required: 'Firma seçimi zorunludur' },
    title: { required: 'Kampanya başlığı zorunludur' },
};

export const Campaigns: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const { success, error: showError } = useToast();
    const { errors, validate, clearErrors, focusFirstError } = useFormValidation<CampaignFormData>();

    // Form state
    const [formData, setFormData] = useState<CampaignFormData>({
        company_id: '',
        title: '',
        badge_type: undefined,
        vade_months: null,
        amount_tl: null,
        bullet_points: [],
        application_link: '',
        terms_link: '',
        application_button_text: 'Hemen Başvur',
        terms_button_text: 'Koşulları İncele',
        image_url: '',
        mobile_image_url: '',
        slug: '',
        content: '',
        is_active: true,
    });
    const [bulletInput, setBulletInput] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [campaignsData, companiesData] = await Promise.all([
                campaignsApi.getAllCampaigns(),
                companiesApi.getActiveCompanies(),
            ]);
            setCampaigns(campaignsData);
            setCompanies(companiesData);
        } catch (err) {
            showError('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[Campaigns] handleSubmit called, formData:', formData);

        // Validate form
        if (!validate(formData, validationRules)) {
            console.log('[Campaigns] Validation failed');
            focusFirstError();
            return;
        }

        setSaving(true);
        try {
            if (editingCampaign) {
                console.log('[Campaigns] Updating campaign:', editingCampaign.id);
                await campaignsApi.updateCampaign(editingCampaign.id, formData);
                success('Kampanya güncellendi');
            } else {
                console.log('[Campaigns] Creating new campaign');
                await campaignsApi.createCampaign(formData);
                success('Kampanya oluşturuldu');
            }

            resetForm();
            loadData();
        } catch (err) {
            console.error('[Campaigns] Submit error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
            showError(`Kaydetme başarısız: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            company_id: campaign.company_id,
            title: campaign.title,
            badge_type: campaign.badge_type,
            vade_months: campaign.vade_months ?? null,
            amount_tl: campaign.amount_tl ?? null,
            bullet_points: campaign.bullet_points || [],
            application_link: campaign.application_link || '',
            terms_link: campaign.terms_link || '',
            application_button_text: campaign.application_button_text || 'Hemen Başvur',
            terms_button_text: campaign.terms_button_text || 'Koşulları İncele',
            image_url: campaign.image_url || '',
            mobile_image_url: campaign.mobile_image_url || '',
            slug: campaign.slug || '',
            content: campaign.content || '',
            is_active: campaign.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;

        try {
            await campaignsApi.deleteCampaign(id);
            success('Kampanya silindi');
            loadData();
        } catch (err) {
            showError('Silme başarısız');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        console.log('[Campaigns] Toggle:', id, 'current:', isActive, '-> new:', !isActive);
        setTogglingId(id);
        // Optimistic update - change UI immediately
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: !isActive } : c));
        try {
            await campaignsApi.toggleActive(id, !isActive);
            success(`Kampanya ${!isActive ? 'aktif' : 'pasif'} edildi`);
            await loadData();
        } catch (err) {
            console.error('[Campaigns] Toggle error:', err);
            // Revert optimistic update
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c));
            showError('Durum değiştirilemedi');
        } finally {
            setTogglingId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            company_id: '',
            title: '',
            badge_type: undefined,
            vade_months: null,
            amount_tl: null,
            bullet_points: [],
            application_link: '',
            terms_link: '',
            application_button_text: 'Hemen Başvur',
            terms_button_text: 'Koşulları İncele',
            image_url: '',
            mobile_image_url: '',
            slug: '',
            content: '',
            is_active: true,
        });
        setBulletInput('');
        setEditingCampaign(null);
        setShowForm(false);
    };

    // Slug oluşturucu
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
            .replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const addBulletPoint = () => {
        if (!bulletInput.trim()) return;
        setFormData({
            ...formData,
            bullet_points: [...(formData.bullet_points || []), bulletInput.trim()],
        });
        setBulletInput('');
    };

    const removeBulletPoint = (index: number) => {
        const newPoints = formData.bullet_points.filter((_, i) => i !== index);
        setFormData({ ...formData, bullet_points: newPoints });
    };

    // Move campaign up/down in order
    const handleMoveUp = async (campaign: Campaign, index: number) => {
        if (index === 0) return; // Already at top
        const prevCampaign = filteredCampaigns[index - 1];
        try {
            await campaignsApi.swapCampaignOrder(campaign.id, prevCampaign.id);
            await loadData();
            success('Kampanya sırası güncellendi');
        } catch (err) {
            showError('Sıra güncellenemedi');
        }
    };

    const handleMoveDown = async (campaign: Campaign, index: number) => {
        if (index === filteredCampaigns.length - 1) return; // Already at bottom
        const nextCampaign = filteredCampaigns[index + 1];
        try {
            await campaignsApi.swapCampaignOrder(campaign.id, nextCampaign.id);
            await loadData();
            success('Kampanya sırası güncellendi');
        } catch (err) {
            showError('Sıra güncellemedi');
        }
    };

    const filteredCampaigns = campaigns.filter((campaign) =>
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.company?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Kampanyalar</h1>
                    <p className="text-gray-600 mt-1">{campaigns.length} kampanya</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                    + Yeni Kampanya
                </button>
            </div>

            {/* Search */}
            {!showForm && (
                <div className="bg-white rounded-lg shadow p-4">
                    <input
                        type="text"
                        placeholder="Kampanya veya firma ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingCampaign ? 'Kampanya Düzenle' : 'Yeni Kampanya'}
                        </h2>
                        <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Company */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Firma *</label>
                                <select
                                    value={formData.company_id}
                                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Firma seçin</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>{company.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Badge Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Etiket</label>
                                <select
                                    value={formData.badge_type || ''}
                                    onChange={(e) => setFormData({ ...formData, badge_type: e.target.value as BadgeType || undefined })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Etiket yok</option>
                                    <option value="faizsiz_firsat">Faizsiz Fırsat</option>
                                    <option value="ozel_kampanya">Özel Kampanya</option>
                                    <option value="sponsorlu">Sponsorlu</option>
                                    <option value="hemen_teslim">🚗 Hemen Teslim Araç</option>
                                </select>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kampanya Başlığı *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Örn: 12 Ay Vadeli Faizsiz Kredi"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Vade */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay) <span className="text-gray-400 text-xs">(Opsiyonel)</span></label>
                                <input
                                    type="number"
                                    value={formData.vade_months ?? ''}
                                    onChange={(e) => setFormData({ ...formData, vade_months: e.target.value ? parseInt(e.target.value) : null })}
                                    min="1"
                                    placeholder="Boş bırakılabilir"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (TL) <span className="text-gray-400 text-xs">(Opsiyonel)</span></label>
                                <input
                                    type="text"
                                    value={formData.amount_tl ? formData.amount_tl.toLocaleString('tr-TR') : ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? parseInt(e.target.value.replace(/\D/g, '')) : null;
                                        setFormData({ ...formData, amount_tl: val });
                                    }}
                                    placeholder="Boş bırakılabilir"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Campaign Image (ÖNEMLİ) */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kampanya Görselleri</h3>

                            {/* Desktop Image */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Masaüstü Görseli (Y atay/geniş)</h4>
                                <ImageUpload
                                    folder="campaign-images"
                                    currentImageUrl={formData.image_url}
                                    onUploadComplete={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                                    onDelete={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                    label="Masaüstü için yatay görsel (Örn: 800x400px)"
                                />
                            </div>

                            {/* Mobile Image */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Mobil Görseli (Dikey/portre)</h4>
                                <ImageUpload
                                    folder="campaign-images"
                                    currentImageUrl={formData.mobile_image_url}
                                    onUploadComplete={(url) => setFormData(prev => ({ ...prev, mobile_image_url: url }))}
                                    onDelete={() => setFormData(prev => ({ ...prev, mobile_image_url: '' }))}
                                    label="Mobil için dikey görsel (Örn: 400x600px)"
                                />
                            </div>
                        </div>

                        {/* Bullet Points */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kampanya Avantajları</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={bulletInput}
                                    onChange={(e) => setBulletInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBulletPoint())}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Avantaj ekle ve Enter'a bas"
                                />
                                <button
                                    type="button"
                                    onClick={addBulletPoint}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Ekle
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {formData.bullet_points?.map((point, index) => (
                                    <li key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
                                        <span className="flex-1">{point}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeBulletPoint(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Application Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Başvuru Linki</label>
                                <input
                                    type="url"
                                    value={formData.application_link}
                                    onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Application Button Text */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Başvuru Buton Yazısı</label>
                                <input
                                    type="text"
                                    value={formData.application_button_text}
                                    onChange={(e) => setFormData({ ...formData, application_button_text: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Hemen Başvur"
                                />
                            </div>

                            {/* Terms Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Koşullar Linki</label>
                                <input
                                    type="url"
                                    value={formData.terms_link}
                                    onChange={(e) => setFormData({ ...formData, terms_link: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Terms Button Text */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Koşullar Buton Yazısı</label>
                                <input
                                    type="text"
                                    value={formData.terms_button_text}
                                    onChange={(e) => setFormData({ ...formData, terms_button_text: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Koşulları İncele"
                                />
                            </div>
                        </div>

                        {/* Slug (URL) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sayfa URL (Slug)</label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/kampanyalar/</span>
                                    <input
                                        type="text"
                                        value={formData.slug || ''}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full pl-[120px] pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="kampanya-adi"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium whitespace-nowrap"
                                >
                                    Otomatik Oluştur
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Boş bırakırsanız kampanya detay sayfası oluşturulmaz.</p>
                        </div>

                        {/* Rich Content Editor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Detay İçeriği (Haber gibi)</label>
                            <RichTextEditor
                                key={editingCampaign?.id || 'new'}
                                content={formData.content || ''}
                                onChange={(val) => setFormData({ ...formData, content: val })}
                                placeholder="Kampanya detaylarını buraya yazın. Görseller, tablolar, listeler ekleyebilirsiniz..."
                            />
                            <p className="text-xs text-gray-400 mt-1">Bu içerik kampanyanın kendi detay sayfasında gösterilir.</p>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Aktif</label>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <SubmitButton loading={saving} className="flex-1">
                                {editingCampaign ? 'Güncelle' : 'Oluştur'}
                            </SubmitButton>
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={saving}
                                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
                            >
                                İptal
                            </button>
                        </div>
                    </form>

                    {/* LIVE PREVIEW PANEL */}
                    {showForm && (
                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 sticky top-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Canlı Önizleme
                                </h3>

                                {/* Exact Campaign Card Design from CampaignsPage */}
                                <div className="transform scale-75 origin-top -mt-4">
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-gray-50">
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${formData.badge_type === 'faizsiz_firsat' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                formData.badge_type === 'ozel_kampanya' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    formData.badge_type === 'sponsorlu' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        'bg-gray-50 text-gray-400 border-gray-200'
                                                }`}>
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                                </svg>
                                                {formData.badge_type === 'faizsiz_firsat' ? 'FAİZSİZ FIRSAT' :
                                                    formData.badge_type === 'ozel_kampanya' ? 'ÖZEL KAMPANYA' :
                                                        formData.badge_type === 'sponsorlu' ? 'SPONSORLU' : 'ETİKET YOK'}
                                            </div>
                                            <div className="text-xs text-gray-400">Son Güncelleme: Bugün</div>
                                        </div>

                                        <div className="p-5 flex flex-col md:flex-row gap-4 items-center">
                                            {/* Campaign Image and Logo Section */}
                                            <div className="w-full md:w-auto flex-shrink-0 flex flex-row gap-3 items-center">
                                                {/* Campaign Banner Image */}
                                                {formData.image_url && (
                                                    <div className="w-72 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden shadow-md border border-gray-200">
                                                        <img src={formData.image_url} alt={formData.title} className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {/* Company Logo */}
                                                <div className="flex flex-col items-center justify-center text-center gap-2">
                                                    <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 p-1">
                                                        {companies.find(c => c.id === formData.company_id)?.logo_url ? (
                                                            <img
                                                                src={companies.find(c => c.id === formData.company_id)!.logo_url!}
                                                                alt="Company"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-xs text-gray-800 max-w-[80px] truncate">
                                                        {companies.find(c => c.id === formData.company_id)?.name?.split(' ')[0] || 'Kampanya'}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <div className="flex-1 text-center md:text-left border-l-0 md:border-l border-gray-100 md:pl-6 w-full">
                                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                                    {formData.title || 'Kampanya Başlığı'}
                                                </h4>
                                                <div className="flex items-center justify-center md:justify-start gap-4 mb-3 text-sm text-gray-600">
                                                    {formData.vade_months > 0 && (
                                                        <>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-gray-400">Vade</span>
                                                                <span className="font-bold text-gray-900">{formData.vade_months} Ay</span>
                                                            </div>
                                                            <div className="w-px h-8 bg-gray-200"></div>
                                                        </>
                                                    )}
                                                    {formData.amount_tl > 0 && (
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-400">Tutar</span>
                                                            <span className="font-bold text-gray-900">{formData.amount_tl.toLocaleString('tr-TR')} TL</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <ul className="space-y-1">
                                                    {formData.bullet_points?.filter(bp => bp.trim()).map((feature, idx) => (
                                                        <li key={idx} className="flex items-center gap-2 text-xs text-gray-500 justify-center md:justify-start">
                                                            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Button Section */}
                                            <div className="w-full md:w-auto flex-shrink-0 flex flex-col gap-2">
                                                <button className="w-full bg-white border-2 border-[#210CAE] text-[#210CAE] hover:bg-gradient-to-r hover:from-[#4DC9E6] hover:to-[#210CAE] hover:text-white font-bold py-2.5 px-6 rounded-lg transition-all text-sm">
                                                    Hemen Başvur
                                                </button>
                                                <a href="#" className="block text-center text-xs font-semibold text-gray-500 hover:text-blue-600 hover:underline">
                                                    Koşulları İncele
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Campaign List - Modern Card Design */}
            {!showForm && (
                <div className="space-y-4">
                    {filteredCampaigns.map((campaign, index) => {
                        const badgeMap: Record<string, { text: string; bg: string; text_color: string }> = {
                            'faizsiz_firsat': { text: 'Faizsiz Fırsat', bg: 'bg-orange-50 dark:bg-orange-900/20', text_color: 'text-orange-700 dark:text-orange-400' },
                            'ozel_kampanya': { text: 'Özel Kampanya', bg: 'bg-blue-50 dark:bg-blue-900/20', text_color: 'text-blue-700 dark:text-blue-400' },
                            'sponsorlu': { text: 'Sponsorlu', bg: 'bg-purple-50 dark:bg-purple-900/20', text_color: 'text-purple-700 dark:text-purple-400' },
                            'hemen_teslim': { text: '🚗 Hemen Teslim', bg: 'bg-red-50 dark:bg-red-900/20', text_color: 'text-red-700 dark:text-red-400' },
                        };
                        const badge = campaign.badge_type ? badgeMap[campaign.badge_type] : null;

                        return (
                            <div
                                key={campaign.id}
                                className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-200 hover:shadow-lg ${campaign.is_active
                                    ? 'border-gray-200 dark:border-slate-700'
                                    : 'border-gray-200 dark:border-slate-700 opacity-60'
                                    }`}
                            >
                                <div className="p-5 flex flex-col md:flex-row items-center gap-5">
                                    {/* Order Arrows */}
                                    <div className="flex md:flex-col gap-1 flex-shrink-0 order-first">
                                        <button
                                            onClick={() => handleMoveUp(campaign, index)}
                                            disabled={index === 0}
                                            className={`p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            title="Yukarı taşı"
                                        >
                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleMoveDown(campaign, index)}
                                            disabled={index === filteredCampaigns.length - 1}
                                            className={`p-1.5 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${index === filteredCampaigns.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            title="Aşağı taşı"
                                        >
                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Campaign Image */}
                                    <div className="w-full md:w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                        {campaign.image_url ? (
                                            <img src={campaign.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Campaign Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base truncate">
                                                {campaign.title}
                                            </h3>
                                            {badge && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg} ${badge.text_color}`}>
                                                    {badge.text}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                            {campaign.company?.name && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    {campaign.company.name}
                                                </span>
                                            )}
                                            {(campaign.vade_months ?? 0) > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {campaign.vade_months} Ay
                                                </span>
                                            )}
                                            {(campaign.amount_tl ?? 0) > 0 && (
                                                <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                                                    {campaign.amount_tl!.toLocaleString('tr-TR')} TL
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={() => handleToggleActive(campaign.id, campaign.is_active)}
                                                disabled={togglingId === campaign.id}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${campaign.is_active
                                                    ? 'bg-green-500 focus:ring-green-500'
                                                    : 'bg-gray-300 dark:bg-slate-600 focus:ring-gray-400'
                                                    }`}
                                                title={campaign.is_active ? 'Pasife al' : 'Aktife al'}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${campaign.is_active ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <span className={`text-[10px] font-bold ${campaign.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                                {campaign.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleEdit(campaign)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(campaign.id)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredCampaigns.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Kampanya bulunamadı</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
