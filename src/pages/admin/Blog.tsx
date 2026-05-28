import React, { useEffect, useState } from 'react';
import { blogApi } from '../../services/api/blog';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { BlogContent } from '../../components/BlogContent';
import { useToast } from '../../hooks/useToast';
import { useFormValidation, type ValidationRules } from '../../hooks/useFormValidation';
import { SubmitButton } from '../../components/admin/SubmitButton';
import type { BlogPost, BlogPostFormData } from '../../types/database';
import {
    Plus, Search, X, FileText, Eye, EyeOff, Trash2,
    Save, ExternalLink, Edit3, Calendar, BookOpen
} from 'lucide-react';

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
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

    const { success, error: showError } = useToast();
    const { validate, focusFirstError } = useFormValidation<BlogPostFormData>();

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
        } catch {
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) return;

        try {
            await blogApi.deletePost(id);
            success('Blog yazısı silindi');
            loadData();
        } catch {
            showError('Silme başarısız');
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await blogApi.toggleActive(id, !isActive);
            success(`Blog yazısı ${!isActive ? 'yayınlandı' : 'taslağa alındı'}`);
            loadData();
        } catch {
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

    const filteredPosts = posts.filter((post) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = !q
            || post.title.toLowerCase().includes(q)
            || (post.excerpt || '').toLowerCase().includes(q)
            || post.author.toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'all'
            || (statusFilter === 'active' && post.is_active)
            || (statusFilter === 'draft' && !post.is_active);

        return matchesSearch && matchesStatus;
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
                        <BookOpen size={24} className="text-slate-400" />
                        Blog
                        <span className="text-sm font-normal text-slate-400 ml-1">({posts.length})</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Blog yazılarını yönetin</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Yazı
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {editingPost ? 'Yazıyı Düzenle' : 'Yeni Yazı Ekle'}
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Başlık *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                placeholder="Blog yazısı başlığı"
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                URL Slug *
                                <span className="text-xs text-slate-400 ml-2">(Otomatik oluşturulur)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                placeholder="blog-yazisi-url"
                            />
                        </div>

                        {/* Row: Author, Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Yazar *</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                    placeholder="Yazar adı"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Yayın Tarihi *</label>
                                <input
                                    type="date"
                                    value={formData.published_at}
                                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Özet</label>
                            <textarea
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent resize-none"
                                placeholder="Kısa özet (liste ve arama sonuçlarında gösterilir)"
                            />
                        </div>

                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kapak Görseli</label>
                            <ImageUpload
                                folder="blog-covers"
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
                                content={formData.content}
                                onChange={(html) => setFormData({ ...formData, content: html })}
                                placeholder="Blog yazısı içeriğini buraya yazın..."
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
                                    <div className="text-sm text-slate-500 mb-4">
                                        {formData.author && <span>{formData.author}</span>}
                                        {formData.published_at && <span className="ml-2">• {new Date(formData.published_at).toLocaleDateString('tr-TR')}</span>}
                                    </div>
                                    <BlogContent html={formData.content} />
                                </div>
                            </details>
                        )}

                        {/* Active Toggle */}
                        <label className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                            <Eye size={16} className="text-emerald-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Yayınla (Aktif olarak göster)</span>
                        </label>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <SubmitButton loading={saving} className="flex-1">
                                <Save size={16} />
                                {editingPost ? 'Güncelle' : 'Kaydet'}
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
                        placeholder="Yazı ara..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'draft')}
                    className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Yayında</option>
                    <option value="draft">Taslak</option>
                </select>
            </div>

            {/* Blog List - Card Based (Same as News) */}
            <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                            {searchQuery || statusFilter !== 'all' ? 'Sonuç bulunamadı' : 'Henüz yazı yok'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {searchQuery || statusFilter !== 'all' ? 'Filtreleri değiştirmeyi deneyin' : 'İlk yazınızı eklemek için "Yeni Yazı" butonunu kullanın'}
                        </p>
                    </div>
                ) : (
                    filteredPosts.map((post) => (
                        <div
                            key={post.id}
                            className={`group flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all ${!post.is_active ? 'opacity-70' : ''}`}
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
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Author */}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                        {post.author}
                                    </span>
                                    {/* Status */}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${post.is_active
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {post.is_active ? 'Yayında' : 'Taslak'}
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
                                {/* Toggle Status */}
                                <button
                                    onClick={() => handleToggleActive(post.id, post.is_active)}
                                    className={`p-2 rounded-lg transition-colors ${post.is_active
                                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        : 'text-slate-400 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    title={post.is_active ? 'Taslağa çek' : 'Yayınla'}
                                >
                                    {post.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>

                                {/* View on site */}
                                {post.is_active && (
                                    <a
                                        href={`/blog/${post.slug || post.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Yazıyı Görüntüle"
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
