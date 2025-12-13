import React, { useEffect, useState } from 'react';
import { campaignsApi } from '../../services/api/campaigns';
import { companiesApi } from '../../services/api/companies';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../hooks/useToast';
import type { Campaign, Company, CampaignFormData, BadgeType } from '../../types/database';

export const Campaigns: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { success, error: showError } = useToast();

    // Form state
    const [formData, setFormData] = useState<CampaignFormData>({
        company_id: '',
        title: '',
        badge_type: undefined,
        vade_months: 12,
        amount_tl: 50000,
        bullet_points: [],
        application_link: '',
        terms_link: '',
        image_url: '',
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

        try {
            if (editingCampaign) {
                await campaignsApi.updateCampaign(editingCampaign.id, formData);
                success('Kampanya güncellendi');
            } else {
                await campaignsApi.createCampaign(formData);
                success('Kampanya oluşturuldu');
            }

            resetForm();
            loadData();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'İşlem başarısız');
        }
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            company_id: campaign.company_id,
            title: campaign.title,
            badge_type: campaign.badge_type,
            vade_months: campaign.vade_months,
            amount_tl: campaign.amount_tl,
            bullet_points: campaign.bullet_points || [],
            application_link: campaign.application_link || '',
            terms_link: campaign.terms_link || '',
            image_url: campaign.image_url || '',
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
        try {
            await campaignsApi.toggleActive(id, !isActive);
            success(`Kampanya ${!isActive ? 'aktif' : 'pasif'} edildi`);
            loadData();
        } catch (err) {
            showError('Durum değiştirilemedi');
        }
    };

    const resetForm = () => {
        setFormData({
            company_id: '',
            title: '',
            badge_type: undefined,
            vade_months: 12,
            amount_tl: 50000,
            bullet_points: [],
            application_link: '',
            terms_link: '',
            image_url: '',
            is_active: true,
        });
        setBulletInput('');
        setEditingCampaign(null);
        setShowForm(false);
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
        setFormData({
            ...formData,
            bullet_points: formData.bullet_points?.filter((_, i) => i !== index) || [],
        });
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

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vade (Ay) *</label>
                                <input
                                    type="number"
                                    value={formData.vade_months}
                                    onChange={(e) => setFormData({ ...formData, vade_months: parseInt(e.target.value) })}
                                    required
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (TL) *</label>
                                <input
                                    type="number"
                                    value={formData.amount_tl}
                                    onChange={(e) => setFormData({ ...formData, amount_tl: parseInt(e.target.value) })}
                                    required
                                    min="0"
                                    step="1000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Campaign Image (ÖNEMLİ) */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kampanya Görseli (Firma logosundan ayrı)</h3>
                            <ImageUpload
                                folder="campaign-images"
                                currentImageUrl={formData.image_url}
                                onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                                onDelete={() => setFormData({ ...formData, image_url: '' })}
                                label="Kampanya Özel Görseli"
                            />
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
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700"
                            >
                                {editingCampaign ? 'Güncelle' : 'Oluştur'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                            >
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {!showForm && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kampanya</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firma</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vade/Tutar</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredCampaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {campaign.image_url && (
                                                <img src={campaign.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{campaign.title}</div>
                                                {campaign.badge_type && (
                                                    <span className="text-xs text-gray-500">{campaign.badge_type}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{campaign.company?.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {campaign.vade_months} ay / {campaign.amount_tl.toLocaleString('tr-TR')} TL
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(campaign.id, campaign.is_active)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {campaign.is_active ? 'Aktif' : 'Pasif'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(campaign)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(campaign.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
