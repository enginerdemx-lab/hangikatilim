import { supabase } from '../supabaseClient';
import type { BlogPost, BlogPostFormData, BlogCategory } from '../../types/database';

// Yedek (fallback) kategoriler — blog_categories tablosu henüz oluşturulmadıysa
// veya boşsa kullanılır. Artık asıl kaynak veritabanıdır (blogCategoryApi).
export const BLOG_CATEGORIES = [
    'Katılım Finansı',
    'Yatırım',
    'Tasarruf',
    'Güncel Haberler',
] as const;

export const blogApi = {
    // Get all blog posts (admin)
    async getAllPosts(): Promise<BlogPost[]> {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('published_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get active blog posts (public)
    async getActivePosts(): Promise<BlogPost[]> {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('is_active', true)
            .order('published_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get single blog post by ID
    async getPostById(id: string): Promise<BlogPost | null> {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Get single blog post by slug
    async getPostBySlug(slug: string): Promise<BlogPost | null> {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;
        return data;
    },

    // Create blog post
    async createPost(postData: BlogPostFormData): Promise<BlogPost> {
        const { data, error } = await supabase
            .from('blog_posts')
            .insert([postData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update blog post
    async updatePost(id: string, postData: Partial<BlogPostFormData>): Promise<BlogPost> {
        const { data, error } = await supabase
            .from('blog_posts')
            .update(postData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete blog post
    async deletePost(id: string): Promise<void> {
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Toggle active status
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('blog_posts')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },

    // Search blog posts
    async searchPosts(query: string): Promise<BlogPost[]> {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,author.ilike.%${query}%`)
            .order('published_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Increment view count
    async incrementViewCount(id: string): Promise<void> {
        try {
            // Önce RPC dene
            const { error: rpcError } = await supabase.rpc('increment_blog_view_count', { row_id: id });

            if (rpcError) {
                console.warn('RPC view count failed, trying direct update:', rpcError.message);
                // RPC başarısız olursa doğrudan güncelle
                const { data: current } = await supabase
                    .from('blog_posts')
                    .select('view_count')
                    .eq('id', id)
                    .single();

                const newCount = ((current?.view_count) || 0) + 1;
                const { error: updateError } = await supabase
                    .from('blog_posts')
                    .update({ view_count: newCount })
                    .eq('id', id);

                if (updateError) {
                    console.error('Direct view count update also failed:', updateError.message);
                }
            }
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    },
};

// ============================================
// Blog Kategorileri API (admin panelden yönetilir)
// ============================================
export const blogCategoryApi = {
    // Tüm kategoriler (admin yönetim ekranı)
    async getAll(): Promise<BlogCategory[]> {
        const { data, error } = await supabase
            .from('blog_categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Sadece kategori adları (form açılır menüsü + public yan menü).
    // Tablo yoksa/boşsa sabit listeye düşer; böylece SQL çalıştırılmadan da çökmez.
    async getNames(): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('blog_categories')
                .select('name')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            if (!data || data.length === 0) return [...BLOG_CATEGORIES];
            return data.map((d) => d.name);
        } catch {
            return [...BLOG_CATEGORIES];
        }
    },

    // Yeni kategori (listenin sonuna eklenir)
    async create(name: string): Promise<BlogCategory> {
        const { data: last } = await supabase
            .from('blog_categories')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1);

        const nextOrder = ((last && last[0]?.sort_order) || 0) + 1;

        const { data, error } = await supabase
            .from('blog_categories')
            .insert([{ name: name.trim(), sort_order: nextOrder }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Yeniden adlandır + mevcut yazılardaki kategori adını da güncelle
    async rename(id: string, oldName: string, newName: string): Promise<void> {
        const trimmed = newName.trim();
        const { error } = await supabase
            .from('blog_categories')
            .update({ name: trimmed })
            .eq('id', id);

        if (error) throw error;

        if (oldName && oldName !== trimmed) {
            // Eski adı taşıyan yazıları yeni ada taşı (kategori bağlantısı korunur)
            await supabase
                .from('blog_posts')
                .update({ category: trimmed })
                .eq('category', oldName);
        }
    },

    // Sil + bu kategorideki yazıların kategorisini boşalt
    async remove(id: string, name: string): Promise<void> {
        const { error } = await supabase
            .from('blog_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (name) {
            await supabase
                .from('blog_posts')
                .update({ category: null })
                .eq('category', name);
        }
    },

    // Sıralamayı güncelle (yukarı/aşağı taşıma)
    async reorder(items: { id: string; sort_order: number }[]): Promise<void> {
        await Promise.all(
            items.map((it) =>
                supabase
                    .from('blog_categories')
                    .update({ sort_order: it.sort_order })
                    .eq('id', it.id)
            )
        );
    },
};
