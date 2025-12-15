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
        const { data, error } = await supabase
            .from('ticker_items')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get active ticker items only (for public view)
    async getActiveTickerItems(): Promise<TickerItem[]> {
        const { data, error } = await supabase
            .from('ticker_items')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
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
