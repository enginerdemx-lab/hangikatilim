import React, { useEffect, useState } from 'react';
import { companiesApi } from '../../services/api/companies';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { useToast } from '../../hooks/useToast';
import { useFormValidation, type ValidationRules } from '../../hooks/useFormValidation';
import { SubmitButton } from '../../components/admin/SubmitButton';
import type { Company, CompanyFormData } from '../../types/database';

// Validation rules
const validationRules: ValidationRules<CompanyFormData> = {
    name: { required: 'Firma adı zorunludur' },
};

export const Companies: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { success, error: showError } = useToast();
    const { errors, validate, clearErrors, focusFirstError } = useFormValidation<CompanyFormData>();

    // Form state
    const [formData, setFormData] = useState<CompanyFormData>({
        name: '',
        logo_url: '',
        description: '',
        about_content: '',
        founded_year: undefined,
        branch_count: undefined,
        website_url: '',
        is_licensed: true,
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await companiesApi.getAllCompanies();
            setCompanies(data);
        } catch (err) {
            showError('Firmalar yüklenemedi');
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
            if (editingCompany) {
                await companiesApi.updateCompany(editingCompany.id, formData);
                success('Kaydedildi');
            } else {
                await companiesApi.createCompany(formData);
                success('Kaydedildi');
            }

            resetForm();
            loadData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
            showError(`Kaydetme başarısız: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (company: Company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            logo_url: company.logo_url || '',
            description: company.description || '',
            about_content: company.about_content || '',
            founded_year: company.founded_year || undefined,
            branch_count: company.branch_count || undefined,
            website_url: company.website_url || '',
            is_licensed: company.is_licensed,
            is_active: company.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu firmayı silmek istediğinizden emin misiniz? İlişkili kampanyalar da silinecektir.')) return;

        try {
            await companiesApi.deleteCompany(id);
            success('Firma silindi');
            loadData();
        } catch (err) {
            showError('Silme başarısız');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await companiesApi.toggleActive(id, !isActive);
            success(`Firma ${!isActive ? 'aktif' : 'pasif'} edildi`);
            loadData();
        } catch (err) {
            showError('Durum değiştirilemedi');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            logo_url: '',
            description: '',
            about_content: '',
            founded_year: undefined,
            branch_count: undefined,
            website_url: '',
            is_licensed: true,
            is_active: true,
        });
        setEditingCompany(null);
        setShowForm(false);
    };

    const filteredCompanies = companies.filter((company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Firmalar</h1>
                    <p className="text-gray-600 mt-1">{companies.length} firma</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                    + Yeni Firma
                </button>
            </div>

            {/* Search */}
            {!showForm && (
                <div className="bg-white rounded-lg shadow p-4">
                    <input
                        type="text"
                        placeholder="Firma ara..."
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
                            {editingCompany ? 'Firma Düzenle' : 'Yeni Firma'}
                        </h2>
                        <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Firma Adı */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Firma Adı *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Örn: KATILIMEVİM"
                            />
                        </div>

                        {/* Logo Upload */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Firma Logosu</h3>
                            <ImageUpload
                                folder="logos"
                                currentImageUrl={formData.logo_url}
                                onUploadComplete={(url) => setFormData({ ...formData, logo_url: url })}
                                onDelete={() => setFormData({ ...formData, logo_url: '' })}
                                label="Logo"
                            />
                        </div>

                        {/* Açıklama */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Firma hakkında kısa açıklama"
                            />
                        </div>

                        {/* Detaylı İçerik (Rich Text) */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaylı İçerik</h3>
                            <RichTextEditor
                                content={formData.about_content || ''}
                                onChange={(content) => setFormData({ ...formData, about_content: content })}
                                placeholder="Firma hakkında detaylı bilgi, görseller ve formatlı metin..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Kuruluş Yılı */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Kuruluş Yılı</label>
                                <input
                                    type="number"
                                    value={formData.founded_year || ''}
                                    onChange={(e) => setFormData({ ...formData, founded_year: e.target.value ? parseInt(e.target.value) : undefined })}
                                    min="1900"
                                    max={new Date().getFullYear()}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="2018"
                                />
                            </div>

                            {/* Şube Sayısı */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Şube Sayısı</label>
                                <input
                                    type="number"
                                    value={formData.branch_count || ''}
                                    onChange={(e) => setFormData({ ...formData, branch_count: e.target.value ? parseInt(e.target.value) : undefined })}
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="50"
                                />
                            </div>

                            {/* Web Sitesi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Web Sitesi</label>
                                <input
                                    type="url"
                                    value={formData.website_url}
                                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_licensed"
                                    checked={formData.is_licensed}
                                    onChange={(e) => setFormData({ ...formData, is_licensed: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="is_licensed" className="text-sm font-medium text-gray-700">Lisanslı</label>
                            </div>

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
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <SubmitButton loading={saving} className="flex-1">
                                {editingCompany ? 'Güncelle' : 'Oluştur'}
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
                </div>
            )}

            {/* List */}
            {!showForm && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Sıra</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firma</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bilgiler</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredCompanies.map((company, index) => (
                                <tr key={company.id} className="hover:bg-gray-50">
                                    {/* SORTING ARROWS - NOW AT LEFT! */}
                                    <td className="px-2 py-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    const currentIndex = filteredCompanies.findIndex(c => c.id === company.id);
                                                    if (currentIndex > 0) showError('Sıralama için order_index alanı gerekli');
                                                }}
                                                disabled={index === 0}
                                                className={`p-1.5 rounded transition-all ${index === 0
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                                                    }`}
                                                title="Yukarı Taşı"
                                            >
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const currentIndex = filteredCompanies.findIndex(c => c.id === company.id);
                                                    if (currentIndex < filteredCompanies.length - 1) showError('Sıralama için order_index alanı gerekli');
                                                }}
                                                disabled={index === filteredCompanies.length - 1}
                                                className={`p-1.5 rounded transition-all ${index === filteredCompanies.length - 1
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                                                    }`}
                                                title="Aşağı Taşı"
                                            >
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {company.logo_url && (
                                                <img src={company.logo_url} alt="" className="w-12 h-12 object-contain rounded" />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{company.name}</div>
                                                {company.description && (
                                                    <div className="text-sm text-gray-500 line-clamp-1">{company.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {company.founded_year && <div>Kuruluş: {company.founded_year}</div>}
                                        {company.branch_count && <div>Şube: {company.branch_count}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => handleToggleActive(company.id, company.is_active)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${company.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {company.is_active ? 'Aktif' : 'Pasif'}
                                            </button>
                                            {company.is_licensed && (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                    Lisanslı
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(company)}
                                                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => handleDelete(company.id)}
                                                className="text-red-600 hover:text-red-800 font-medium transition-colors"
                                            >
                                                Sil
                                            </button>
                                        </div>
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
