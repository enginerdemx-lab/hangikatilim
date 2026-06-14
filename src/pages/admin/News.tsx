import React, { useEffect, useState } from 'react';
import { newsApi, type NewsPostFormData } from '../../services/api/news';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { BlogContent } from '../../components/BlogContent';
import { useToast } from '../../hooks/useToast';
import { useFormValidation, type ValidationRules } from '../../hooks/useFormValidation';
import { SubmitButton } from '../../components/admin/SubmitButton';
import type { NewsPost, NewsCategory, PostStatus } from '../../types/database';
import {
    Plus, X, Save, Trash2, Edit3, ExternalLink, Star, StarOff,
    Eye, EyeOff, FileText, Search, Newspaper, Calendar, Filter
} from 'lucide-react';

// Validation rules
const validationRules: ValidationRules<NewsPostFormData> = {
    title: { required: 'Başlık zorunludur' },
};

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    sirket: { label: 'Şirket', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
    mevzuat: { label: 'Mevzuat', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400' },
    sektor: { label: 'Sektör', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
};

export const News: React.FC = () => {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
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
        published_at: new Date().toISOString().split('T')[0],
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
            published_at: post.published_at ? post.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
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
            published_at: new Date().toISOString().split('T')[0],
        });
        setEditingId(null);
        setIsEditing(false);
    };

    // Filter posts
    const filteredPosts = posts.filter(post => {
        const matchesSearch = !searchQuery ||
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.summary?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !filterCategory || post.category === filterCategory;
        const matchesStatus = !filterStatus || post.status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Newspaper size={24} className="text-slate-400" />
                        Haberler
                        <span className="text-sm font-normal text-slate-400 ml-1">({posts.length})</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Sektör haberlerini yönetin</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Haber
                    </button>
                )}
            </div>

            {/* Form */}
            {isEditing && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {editingId ? 'Haberi Düzenle' : 'Yeni Haber Ekle'}
                        </h2>
                        <button
                            onClick={resetForm}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Başlık *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                placeholder="Haber başlığı"
                            />
                            <p className={`mt-1 text-xs ${(formData.title?.length || 0) > 60 ? 'text-orange-500' : 'text-slate-400'}`}>
                                {formData.title?.length || 0}/60 karakter {(formData.title?.length || 0) > 60 ? '— SEO başlığı (title) otomatik ≤60 karaktere kısaltılır' : ''}
                            </p>
                        </div>

                        {/* Row: Category, Status, Date */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kategori</label>
                                <select
                                    value={formData.category || ''}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as NewsCategory || undefined })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                >
                                    <option value="">Kategori Seçin</option>
                                    <option value="sirket">Şirket</option>
                                    <option value="mevzuat">Mevzuat</option>
                                    <option value="sektor">Sektör</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Durum *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PostStatus })}
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                >
                                    <option value="draft">Taslak</option>
                                    <option value="published">Yayında</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Yayın Tarihi</label>
                                <input
                                    type="date"
                                    value={formData.published_at || ''}
                                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Özet</label>
                            <textarea
                                value={formData.summary || ''}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent resize-none"
                                placeholder="Kısa özet (liste ve arama sonuçlarında gösterilir)"
                            />
                        </div>

                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kapak Görseli</label>
                            <ImageUpload
                                folder="news-covers"
                                currentImageUrl={formData.cover_image_url}
                                onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                                onDelete={() => setFormData({ ...formData, cover_image_url: '' })}
                                label="Kapak Görseli"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">İçerik *</label>
                            <RichTextEditor
                                content={formData.content || ''}
                                onChange={(html) => setFormData({ ...formData, content: html })}
                                placeholder="Haber içeriğini buraya yazın..."
                            />
                        </div>

                        {/* Live Preview */}
                        {formData.content && (
                            <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white select-none">
                                    <Eye size={16} />
                                    Canlı Önizleme
                                </summary>
                                <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                                    {formData.cover_image_url && (
                                        <img src={formData.cover_image_url} alt="Kapak" className="w-full h-48 object-cover rounded-lg mb-4" />
                                    )}
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{formData.title || 'Başlık'}</h1>
                                    {formData.summary && <p className="text-slate-600 dark:text-slate-400 mb-4">{formData.summary}</p>}
                                    <BlogContent html={formData.content} />
                                </div>
                            </details>
                        )}

                        {/* Featured Toggle */}
                        <label className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.is_featured}
                                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                            />
                            <Star size={16} className="text-amber-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Manşet Haber (Ana sayfada öne çıkar)</span>
                        </label>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <SubmitButton loading={saving} className="flex-1">
                                <Save size={16} />
                                {editingId ? 'Güncelle' : 'Kaydet'}
                            </SubmitButton>
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={saving}
                                className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50"
                            >
                                İptal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Haber ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                >
                    <option value="">Tüm Kategoriler</option>
                    <option value="sirket">Şirket</option>
                    <option value="mevzuat">Mevzuat</option>
                    <option value="sektor">Sektör</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                >
                    <option value="">Tüm Durumlar</option>
                    <option value="published">Yayında</option>
                    <option value="draft">Taslak</option>
                </select>
            </div>

            {/* News List - Card Based */}
            <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <Newspaper size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                            {searchQuery || filterCategory || filterStatus ? 'Sonuç bulunamadı' : 'Henüz haber yok'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {searchQuery || filterCategory || filterStatus ? 'Filtreleri değiştirmeyi deneyin' : 'İlk haberinizi eklemek için "Yeni Haber" butonunu kullanın'}
                        </p>
                    </div>
                ) : (
                    filteredPosts.map((post) => (
                        <div
                            key={post.id}
                            className={`group flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all ${post.status === 'draft' ? 'opacity-70' : ''
                                }`}
                        >
                            {/* Image */}
                            {post.cover_image_url ? (
                                <img
                                    src={post.cover_image_url}
                                    alt={post.title}
                                    className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                                />
                            ) : (
                                <div className="w-20 h-14 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText size={20} className="text-slate-400" />
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {post.title}
                                    </h3>
                                    {post.is_featured && (
                                        <Star size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Category */}
                                    {post.category && CATEGORY_CONFIG[post.category] && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${CATEGORY_CONFIG[post.category].bg} ${CATEGORY_CONFIG[post.category].text}`}>
                                            {CATEGORY_CONFIG[post.category].label}
                                        </span>
                                    )}
                                    {/* Status */}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${post.status === 'published'
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {post.status === 'published' ? 'Yayında' : 'Taslak'}
                                    </span>
                                    {/* Date */}
                                    {post.published_at && (
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <Calendar size={10} />
                                            {new Date(post.published_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    )}
                                    {/* View Count */}
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                        <Eye size={10} className="text-blue-500" />
                                        <span className="font-medium text-slate-600 dark:text-slate-300">
                                            {post.view_count?.toLocaleString('tr-TR') || 0}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                {/* Toggle Featured */}
                                <button
                                    onClick={() => handleToggleFeatured(post.id, post.is_featured)}
                                    className={`p-2 rounded-lg transition-colors ${post.is_featured
                                        ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    title={post.is_featured ? 'Manşetten kaldır' : 'Manşet yap'}
                                >
                                    {post.is_featured ? <Star size={16} className="fill-current" /> : <StarOff size={16} />}
                                </button>

                                {/* Toggle Status */}
                                <button
                                    onClick={() => handleUpdateStatus(post.id, post.status === 'draft' ? 'published' : 'draft')}
                                    className={`p-2 rounded-lg transition-colors ${post.status === 'published'
                                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        : 'text-slate-400 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    title={post.status === 'published' ? 'Taslağa çek' : 'Yayınla'}
                                >
                                    {post.status === 'published' ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>

                                {/* View on site */}
                                {post.status === 'published' && (
                                    <a
                                        href={`/sektor-haberleri/${post.slug || post.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Haberi Görüntüle"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                )}

                                {/* Edit */}
                                <button
                                    onClick={() => handleEdit(post)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Düzenle"
                                >
                                    <Edit3 size={16} />
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Sil"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
