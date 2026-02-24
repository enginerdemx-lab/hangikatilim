import { supabase } from '../supabaseClient';
import type { BlogPost, BlogPostFormData } from '../../types/database';

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
            await supabase.rpc('increment_blog_view_count', { row_id: id });
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    },
};
