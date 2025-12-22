import React, { useEffect, useState } from 'react';
import { newsApi, type NewsPostFormData } from '../../services/api/news';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { BlogContent } from '../../components/BlogContent';
import { useToast } from '../../hooks/useToast';
import { useFormValidation, type ValidationRules } from '../../hooks/useFormValidation';
import { SubmitButton } from '../../components/admin/SubmitButton';
import type { NewsPost, NewsCategory, PostStatus } from '../../types/database';

// Validation rules
const validationRules: ValidationRules<NewsPostFormData> = {
    title: { required: 'Başlık zorunludur' },
};

export const News: React.FC = () => {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { showToast } = useToast();
    const { errors, validate, clearErrors, focusFirstError } = useFormValidation<NewsPostFormData>();

    const [formData, setFormData] = useState<NewsPostFormData>({
        title: '',
        category: undefined,
        cover_image_url: '',
        summary: '',
        content: '',
        is_featured: false,
        status: 'draft',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await newsApi.getAllNews();
            setPosts(data);
        } catch (error) {
            console.error('Failed to load news:', error);
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
                await newsApi.updateNews(editingId, formData);
                showToast('Kaydedildi', 'success');
            } else {
                await newsApi.createNews(formData);
                showToast('Kaydedildi', 'success');
            }
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to save news:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            showToast(`Kaydetme başarısız: ${errorMessage}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (post: NewsPost) => {
        setFormData({
            title: post.title,
            category: post.category,
            cover_image_url: post.cover_image_url || '',
            summary: post.summary || '',
            content: post.content || '',
            is_featured: post.is_featured,
            status: post.status,
        });
        setEditingId(post.id);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu haberi silmek istediğinizden emin misiniz?')) return;

        try {
            await newsApi.deleteNews(id);
            showToast('Haber silindi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to delete news:', error);
            showToast('Silme başarısız', 'error');
        }
    };

    const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
        try {
            await newsApi.toggleFeatured(id, !isFeatured);
            showToast('Öne çıkarma güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to toggle featured:', error);
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const handleUpdateStatus = async (id: string, status: PostStatus) => {
        try {
            await newsApi.updateStatus(id, status);
            showToast('Durum güncellendi', 'success');
            loadData();
        } catch (error) {
            console.error('Failed to update status:', error);
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            category: undefined,
            cover_image_url: '',
            summary: '',
            content: '',
            is_featured: false,
            status: 'draft',
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
                    <h1 className="text-3xl font-bold text-gray-900">Sektör Haberleri</h1>
                    <p className="text-gray-600 mt-2">Haber içeriklerini yönetin</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-semibold">Yeni Haber Ekle</span>
                    </button>
                )}
            </div>

            {/* Form - Collapsible */}
            {isEditing && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {editingId ? '✏️ Haberi Düzenle' : '✨ Yeni Haber Ekle'}
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info Section */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <span className="text-blue-600">📝</span>
                                Temel Bilgiler
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Başlık *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="Haber başlığı giriniz"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kategori
                                        </label>
                                        <select
                                            value={formData.category || ''}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as NewsCategory || undefined })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        >
                                            <option value="">Kategori Seçin</option>
                                            <option value="sirket">🏢 Şirket</option>
                                            <option value="mevzuat">📜 Mevzuat</option>
                                            <option value="sektor">💼 Sektör</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Durum *
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as PostStatus })}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        >
                                            <option value="draft">📝 Taslak</option>
                                            <option value="published">✅ Yayında</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Özet
                                    </label>
                                    <textarea
                                        value={formData.summary || ''}
                                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="Kısa özet (liste görünümünde gösterilecek)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Section - Rich Text Editor */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <span className="text-purple-600">📄</span>
                                İçerik
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Haber İçeriği *
                                </label>
                                <RichTextEditor
                                    content={formData.content || ''}
                                    onChange={(html) => setFormData({ ...formData, content: html })}
                                    placeholder="Haber içeriğini buraya yazın..."
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 Görselleri sürükle-bırak veya kopyala-yapıştır ile ekleyebilirsiniz
                                </p>
                            </div>

                            {/* Live Preview */}
                            {formData.content && (
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        👁️ Canlı Önizleme
                                    </h3>
                                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                                        {formData.cover_image_url && (
                                            <img
                                                src={formData.cover_image_url}
                                                alt="Kapak"
                                                className="w-full h-48 object-cover rounded-lg mb-4"
                                            />
                                        )}
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                            {formData.title || 'Başlık'}
                                        </h1>
                                        {formData.summary && (
                                            <p className="text-gray-600 mb-4">{formData.summary}</p>
                                        )}
                                        <BlogContent html={formData.content} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Media Section */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <span className="text-green-600">🖼️</span>
                                Görsel
                            </h3>
                            <ImageUpload
                                folder="news-covers"
                                currentImageUrl={formData.cover_image_url}
                                onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                                onDelete={() => setFormData({ ...formData, cover_image_url: '' })}
                                label="Kapak Görseli"
                            />
                        </div>

                        {/* Options Section */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.is_featured}
                                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                    className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition">
                                    ⭐ Manşet Haber (Ana sayfada öne çıkar)
                                </span>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <SubmitButton loading={saving} className="flex-1">
                                {editingId ? '💾 Güncelle' : '✨ Haberi Ekle'}
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


            {/* News List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        📰 Haberler
                        <span className="text-sm font-normal text-gray-600">({posts.length} adet)</span>
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Haber</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Kategori</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Durum</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Manşet</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {post.cover_image_url ? (
                                                <img
                                                    src={post.cover_image_url}
                                                    alt={post.title}
                                                    className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                                    <span className="text-2xl">📰</span>
                                                </div>
                                            )}
                                            <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">{post.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {post.category ? (
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${post.category === 'sirket' ? 'bg-blue-100 text-blue-800' :
                                                post.category === 'mevzuat' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {post.category === 'sirket' ? '🏢 Şirket' :
                                                    post.category === 'mevzuat' ? '📜 Mevzuat' :
                                                        '💼 Sektör'}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleUpdateStatus(post.id, post.status === 'draft' ? 'published' : 'draft')}
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 ${post.status === 'published'
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                }`}
                                        >
                                            {post.status === 'published' ? '✅ Yayında' : '📝 Taslak'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleFeatured(post.id, post.is_featured)}
                                            className={`text-3xl transition-all hover:scale-125 ${post.is_featured ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-yellow-400'
                                                }`}
                                            title={post.is_featured ? 'Manşetten kaldır' : 'Manşet yap'}
                                        >
                                            ⭐
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(post)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            ✏️ Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition"
                                        >
                                            🗑️ Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {posts.length === 0 && (
                        <div className="text-center py-16 bg-gray-50">
                            <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz haber yok</h3>
                            <p className="text-gray-600 mb-4">İlk haberinizi eklemek için yukarıdaki butonu kullanın</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
