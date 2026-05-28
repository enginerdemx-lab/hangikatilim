import { supabase } from '../supabaseClient';
import type { NewsPost, NewsCategory, PostStatus } from '../../types/database';

export interface NewsPostFormData {
    title: string;
    category?: NewsCategory;
    cover_image_url?: string;
    summary?: string;
    content?: string;
    is_featured: boolean;
    status: PostStatus;
    published_at?: string;
}

export const newsApi = {
    // Get all news posts (admin view - includes drafts)
    async getAllNews(): Promise<NewsPost[]> {
        const { data, error } = await supabase
            .from('news_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get published news only (for public view)
    async getPublishedNews(): Promise<NewsPost[]> {
        const { data, error } = await supabase
            .from('news_posts')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get limited published news for homepage carousel
    async getPublishedNewsLimit(limit: number = 9): Promise<NewsPost[]> {
        const { data, error } = await supabase
            .from('news_posts')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    // Get news by slug (for detail page)
    async getNewsBySlug(slug: string): Promise<NewsPost | null> {
        const { data, error } = await supabase
            .from('news_posts')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No rows found
            throw error;
        }
        return data;
    },

    // Get featured news
    async getFeaturedNews(): Promise<NewsPost[]> {
        const { data, error } = await supabase
            .from('news_posts')
            .select('*')
            .eq('status', 'published')
            .eq('is_featured', true)
            .order('published_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get single news post by ID
    async getNewsById(id: string): Promise<NewsPost | null> {
        const { data, error } = await supabase
            .from('news_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Generate URL-friendly slug from title
    generateSlug(title: string): string {
        const turkishMap: Record<string, string> = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
        };

        return title
            .split('')
            .map(char => turkishMap[char] || char)
            .join('')
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 80);
    },

    // Create new news post
    async createNews(newsData: NewsPostFormData): Promise<NewsPost> {
        // Auto-generate slug if title exists
        const slug = this.generateSlug(newsData.title);
        const dataWithSlug = { ...newsData, slug };

        const { data, error } = await supabase
            .from('news_posts')
            .insert([dataWithSlug])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update news post
    async updateNews(id: string, newsData: Partial<NewsPostFormData>): Promise<NewsPost> {
        // Regenerate slug if title is being updated
        const updateData = newsData.title
            ? { ...newsData, slug: this.generateSlug(newsData.title) }
            : newsData;

        const { data, error } = await supabase
            .from('news_posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete news post
    async deleteNews(id: string): Promise<void> {
        const { error } = await supabase
            .from('news_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Toggle featured status
    async toggleFeatured(id: string, isFeatured: boolean): Promise<void> {
        const { error } = await supabase
            .from('news_posts')
            .update({ is_featured: isFeatured })
            .eq('id', id);

        if (error) throw error;
    },

    // Update status (draft/published)
    async updateStatus(id: string, status: PostStatus): Promise<void> {
        const updateData: any = { status };

        // Set published_at when publishing
        if (status === 'published') {
            updateData.published_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('news_posts')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
    },

    // Increment view count
    async incrementViewCount(id: string): Promise<void> {
        try {
            // Önce RPC dene
            const { error: rpcError } = await supabase.rpc('increment_news_view_count', { row_id: id });

            if (rpcError) {
                console.warn('RPC view count failed, trying direct update:', rpcError.message);
                // RPC başarısız olursa doğrudan güncelle
                const { data: current } = await supabase
                    .from('news_posts')
                    .select('view_count')
                    .eq('id', id)
                    .single();

                const newCount = ((current?.view_count) || 0) + 1;
                const { error: updateError } = await supabase
                    .from('news_posts')
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
