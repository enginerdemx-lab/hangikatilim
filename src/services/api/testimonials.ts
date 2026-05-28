import { supabase } from '../supabaseClient';
import type { Testimonial, TestimonialStatus } from '../../types/database';

export interface TestimonialFormData {
    user_name: string;
    user_city?: string;
    rating: number;
    comment: string;
}

export const testimonialsApi = {
    // ========== PUBLIC ==========

    /** Get approved testimonials for public display */
    async getApproved(): Promise<Testimonial[]> {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[testimonialsApi] getApproved error:', error);
            return [];
        }
        return data || [];
    },

    /** Submit a new testimonial (authenticated user) */
    async submit(userId: string, formData: TestimonialFormData): Promise<Testimonial> {
        const { data, error } = await supabase
            .from('testimonials')
            .insert([{
                user_id: userId,
                user_name: formData.user_name,
                user_city: formData.user_city || '',
                rating: formData.rating,
                comment: formData.comment,
                status: 'pending',
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ========== ADMIN ==========

    /** Get all testimonials (admin) */
    async getAll(): Promise<Testimonial[]> {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[testimonialsApi] getAll error:', error);
            return [];
        }
        return data || [];
    },

    /** Get testimonials by status (admin) */
    async getByStatus(status: TestimonialStatus): Promise<Testimonial[]> {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[testimonialsApi] getByStatus error:', error);
            return [];
        }
        return data || [];
    },

    /** Update testimonial status (admin) */
    async updateStatus(id: string, status: TestimonialStatus): Promise<void> {
        const { error } = await supabase
            .from('testimonials')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    /** Delete a testimonial (admin) */
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('testimonials')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /** Get count by status (admin dashboard) */
    async getCounts(): Promise<{ pending: number; approved: number; rejected: number }> {
        const { data, error } = await supabase
            .from('testimonials')
            .select('status');

        if (error) {
            console.error('[testimonialsApi] getCounts error:', error);
            return { pending: 0, approved: 0, rejected: 0 };
        }

        const counts = { pending: 0, approved: 0, rejected: 0 };
        (data || []).forEach((item: { status: string }) => {
            if (item.status === 'pending') counts.pending++;
            else if (item.status === 'approved') counts.approved++;
            else if (item.status === 'rejected') counts.rejected++;
        });
        return counts;
    },
};
