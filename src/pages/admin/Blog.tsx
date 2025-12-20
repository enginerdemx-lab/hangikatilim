import React, { useEffect, useState } from 'react';
import { blogApi } from '../../services/api/blog';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { BlogContent } from '../../components/BlogContent';
import { useToast } from '../../hooks/useToast';
import { useFormValidation, type ValidationRules } from '../../hooks/useFormValidation';
import { SubmitButton } from '../../components/admin/SubmitButton';
import type { BlogPost, BlogPostFormData } from '../../types/database';

// Validation rules
const validationRules: ValidationRules<BlogPostFormData> = {
    title: { required: 'Başlık zorunludur' },
    slug: { required: 'URL slug zorunludur' },
    author: { required: 'Yazar zorunludur' },
    content: { required: 'İçerik zorunludur' },
    published_at: { required: 'Yayın tarihi zorunludur' },
};

export const Blog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { success, error: showError } = useToast();
    const { errors, validate, clearErrors, focusFirstError } = useFormValidation<BlogPostFormData>();

    // Form state
    const [formData, setFormData] = useState<BlogPostFormData>({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover_image_url: '',
        author: '',
        published_at: new Date().toISOString().split('T')[0],
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await blogApi.getAllPosts();
            setPosts(data);
        } catch (err) {
            showError('Blog yazıları yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleTitleChange = (title: string) => {
        setFormData({
            ...formData,
            title,
            slug: editingPost ? formData.slug : generateSlug(title),
        });
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
            if (editingPost) {
                await blogApi.updatePost(editingPost.id, formData);
                success('Kaydedildi');
            } else {
                await blogApi.createPost(formData);
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

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            content: post.content,
            cover_image_url: post.cover_image_url || '',
            author: post.author,
            published_at: post.published_at.split('T')[0],
            is_active: post.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) return;

        try {
            await blogApi.deletePost(id);
            success('Blog yazısı silindi');
            loadData();
        } catch (err) {
            showError('Silme başarısız');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await blogApi.toggleActive(id, !isActive);
            success(`Blog yazısı ${!isActive ? 'yayınlandı' : 'taslağa alındı'}`);
            loadData();
        } catch (err) {
            showError('Durum değiştirilemedi');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            cover_image_url: '',
            author: '',
            published_at: new Date().toISOString().split('T')[0],
            is_active: true,
        });
        setEditingPost(null);
        setShowForm(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadData();
            return;
        }

        try {
            const data = await blogApi.searchPosts(searchQuery);
            setPosts(data);
        } catch (err) {
            showError('Arama başarısız');
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
                    <p className="text-gray-600 mt-1">{posts.length} yazı</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                    + Yeni Yazı
                </button>
            </div>

            {/* Search */}
            {!showForm && (
                <div className="bg-white rounded-lg shadow p-4 flex gap-3">
                    <input
                        type="text"
                        placeholder="Başlık, özet veya yazar ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Ara
                    </button>
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); loadData(); }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Temizle
                        </button>
                    )}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingPost ? 'Yazı Düzenle' : 'Yeni Yazı'}
                        </h2>
                        <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Başlık */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Başlık *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Blog yazısı başlığı"
                                />
                            </div>

                            {/* Slug */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL Slug *
                                    <span className="text-xs text-gray-500 ml-2">(Otomatik oluşturulur)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="blog-yazisi-url"
                                />
                            </div>

                            {/* Yazar */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Yazar *</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Yazar adı"
                                />
                            </div>

                            {/* Yayın Tarihi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Yayın Tarihi *</label>
                                <input
                                    type="date"
                                    value={formData.published_at}
                                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Özet */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Özet</label>
                            <textarea
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Kısa özet (opsiyonel)"
                            />
                        </div>

                        {/* İçerik - Rich Text Editor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">İçerik *</label>
                            <RichTextEditor
                                content={formData.content}
                                onChange={(html) => setFormData({ ...formData, content: html })}
                                placeholder="Blog yazısı içeriğini buraya yazın..."
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Görselleri sürükle-bırak veya kopyala-yapıştır ile ekleyebilirsiniz
                            </p>
                        </div>

                        {/* Canlı Önizleme */}
                        {formData.content && (
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    👁️ Canlı Önizleme
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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
                                    <div className="text-sm text-gray-500 mb-4">
                                        {formData.author && <span>{formData.author}</span>}
                                        {formData.published_at && (
                                            <span className="ml-2">
                                                • {new Date(formData.published_at).toLocaleDateString('tr-TR')}
                                            </span>
                                        )}
                                    </div>
                                    <BlogContent html={formData.content} />
                                </div>
                            </div>
                        )}

                        {/* Kapak Görseli */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kapak Görseli</h3>
                            <ImageUpload
                                folder="blog-covers"
                                currentImageUrl={formData.cover_image_url}
                                onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                                onDelete={() => setFormData({ ...formData, cover_image_url: '' })}
                                label="Kapak Görseli"
                            />
                        </div>

                        {/* Aktif */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                Yayınla (Aktif)
                            </label>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <SubmitButton loading={saving} className="flex-1">
                                {editingPost ? 'Güncelle' : 'Yayınla'}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yazı</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yazar</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {posts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {post.cover_image_url && (
                                                <img src={post.cover_image_url} alt="" className="w-16 h-16 object-cover rounded" />
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-900">{post.title}</div>
                                                {post.excerpt && (
                                                    <div className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{post.author}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(post.published_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleActive(post.id, post.is_active)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${post.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {post.is_active ? 'Yayında' : 'Taslak'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(post)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
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
