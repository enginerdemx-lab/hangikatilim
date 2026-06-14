import React, { useEffect, useState } from 'react';
import { blogCategoryApi } from '../../services/api/blog';
import { useToast } from '../../hooks/useToast';
import { SubmitButton } from '../../components/admin/SubmitButton';
import type { BlogCategory } from '../../types/database';
import {
    Tags, Plus, Trash2, Edit3, Check, X,
    ChevronUp, ChevronDown, FolderTree,
} from 'lucide-react';

export const BlogCategories: React.FC = () => {
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const [reordering, setReordering] = useState(false);

    const { success, error: showError } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await blogCategoryApi.getAll();
            setCategories(data);
        } catch {
            showError('Kategoriler yüklenemedi. SQL (create-blog-categories.sql) çalıştırıldı mı?');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;

        if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
            showError('Bu kategori zaten var');
            return;
        }

        setAdding(true);
        try {
            await blogCategoryApi.create(name);
            success('Kategori eklendi');
            setNewName('');
            loadData();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
            showError(`Eklenemedi: ${msg}`);
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (cat: BlogCategory) => {
        setEditingId(cat.id);
        setEditName(cat.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleSaveEdit = async (cat: BlogCategory) => {
        const name = editName.trim();
        if (!name) return;
        if (name === cat.name) {
            cancelEdit();
            return;
        }
        if (categories.some((c) => c.id !== cat.id && c.name.toLowerCase() === name.toLowerCase())) {
            showError('Bu isimde başka bir kategori var');
            return;
        }

        setSavingEdit(true);
        try {
            await blogCategoryApi.rename(cat.id, cat.name, name);
            success('Kategori güncellendi (bu kategorideki yazılar da güncellendi)');
            cancelEdit();
            loadData();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
            showError(`Güncellenemedi: ${msg}`);
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDelete = async (cat: BlogCategory) => {
        if (!confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?\n\nBu kategorideki yazıların kategorisi boşaltılacak (yazılar silinmez).`)) return;

        try {
            await blogCategoryApi.remove(cat.id, cat.name);
            success('Kategori silindi');
            loadData();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
            showError(`Silinemedi: ${msg}`);
        }
    };

    const move = async (index: number, dir: -1 | 1) => {
        const target = index + dir;
        if (target < 0 || target >= categories.length) return;

        const next = [...categories];
        [next[index], next[target]] = [next[target], next[index]];
        // Sıra numaralarını 1..n olarak yeniden ata
        const renumbered = next.map((c, i) => ({ ...c, sort_order: i + 1 }));
        setCategories(renumbered);

        setReordering(true);
        try {
            await blogCategoryApi.reorder(renumbered.map((c) => ({ id: c.id, sort_order: c.sort_order })));
        } catch {
            showError('Sıralama kaydedilemedi');
            loadData();
        } finally {
            setReordering(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Tags size={24} className="text-slate-400" />
                    Blog Kategorileri
                    <span className="text-sm font-normal text-slate-400 ml-1">({categories.length})</span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Kategori ekleyin, adlarını düzenleyin, sıralayın veya silin. Değişiklikler hem blog formuna hem de blog sayfasına yansır.
                </p>
            </div>

            {/* Add new */}
            <form
                onSubmit={handleAdd}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5"
            >
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Yeni Kategori</label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Kategori adı (örn. Konut Finansmanı)"
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                    />
                    <SubmitButton loading={adding} className="sm:w-auto">
                        <Plus size={16} />
                        Ekle
                    </SubmitButton>
                </div>
            </form>

            {/* List */}
            {categories.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <FolderTree size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Henüz kategori yok</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">İlk kategoriyi yukarıdaki alandan ekleyin.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {categories.map((cat, index) => (
                        <div
                            key={cat.id}
                            className="group flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                        >
                            {/* Reorder */}
                            <div className="flex flex-col -my-1">
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={index === 0 || reordering}
                                    className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Yukarı taşı"
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={index === categories.length - 1 || reordering}
                                    className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Aşağı taşı"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            <span className="w-6 text-center text-xs font-semibold text-slate-400">{index + 1}</span>

                            {/* Name / edit */}
                            <div className="flex-1 min-w-0">
                                {editingId === cat.id ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(cat); }
                                            if (e.key === 'Escape') cancelEdit();
                                        }}
                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 focus:border-transparent"
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate block">{cat.name}</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {editingId === cat.id ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleSaveEdit(cat)}
                                            disabled={savingEdit}
                                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            title="Kaydet"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            disabled={savingEdit}
                                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="İptal"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(cat)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Yeniden adlandır"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(cat)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500">
                Not: Bir kategoriyi yeniden adlandırdığınızda o kategorideki yazılar otomatik güncellenir. Sildiğinizde yazılar silinmez, yalnızca kategorisi boşaltılır.
            </p>
        </div>
    );
};
