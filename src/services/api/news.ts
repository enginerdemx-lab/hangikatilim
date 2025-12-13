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

    // Create new news post
    async createNews(newsData: NewsPostFormData): Promise<NewsPost> {
        const { data, error } = await supabase
            .from('news_posts')
            .insert([newsData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update news post
    async updateNews(id: string, newsData: Partial<NewsPostFormData>): Promise<NewsPost> {
        const { data, error } = await supabase
            .from('news_posts')
            .update(newsData)
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
};
