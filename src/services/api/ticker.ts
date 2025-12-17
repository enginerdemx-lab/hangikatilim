import { supabase } from '../supabaseClient';
import type { TickerItem } from '../../types/database';

export interface TickerItemFormData {
    label?: string;
    title?: string;
    text: string;
    link?: string;
    sort_order: number;
    is_active: boolean;
}

export const tickerApi = {
    // Get all ticker items (admin view - includes inactive)
    async getAllTickerItems(): Promise<TickerItem[]> {
        try {
            const { data, error } = await supabase
                .from('ticker_items')
                .select('*');

            if (error) {
                console.error('[tickerApi] getAllTickerItems error:', error.message, error.code, error.details);
                throw error;
            }

            // Sort client-side
            const sortedData = (data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            return sortedData;
        } catch (err) {
            console.error('[tickerApi] Unexpected error:', err);
            throw err;
        }
    },

    // Get active ticker items only (for public view)
    async getActiveTickerItems(): Promise<TickerItem[]> {
        try {
            // First try without ordering to debug 400 error
            const { data, error } = await supabase
                .from('ticker_items')
                .select('*')
                .eq('is_active', true);

            if (error) {
                console.error('[tickerApi] getActiveTickerItems error:', error.message, error.code, error.details);
                throw error;
            }

            // Sort client-side as fallback
            const sortedData = (data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            console.log('[tickerApi] Fetched and sorted:', sortedData.length, 'items');
            return sortedData;
        } catch (err) {
            console.error('[tickerApi] Unexpected error:', err);
            throw err;
        }
    },

    // Get single ticker item by ID
    async getTickerItemById(id: string): Promise<TickerItem | null> {
        const { data, error } = await supabase
            .from('ticker_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create new ticker item
    async createTickerItem(tickerData: TickerItemFormData): Promise<TickerItem> {
        const { data, error } = await supabase
            .from('ticker_items')
            .insert([tickerData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update ticker item
    async updateTickerItem(id: string, tickerData: Partial<TickerItemFormData>): Promise<TickerItem> {
        const { data, error } = await supabase
            .from('ticker_items')
            .update(tickerData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete ticker item
    async deleteTickerItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('ticker_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Toggle active status
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('ticker_items')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },
};
