import { supabase } from '../supabaseClient';

// Types
export interface QuickLinksSettings {
    id: string;
    section_title: string;
    section_subtitle: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface QuickLinksItem {
    id: string;
    title: string;
    icon: string;
    link_url: string;
    is_external: boolean;
    badge_text?: string;
    is_active: boolean;
    order_no: number;
    created_at: string;
    updated_at: string;
}

export interface QuickLinksItemFormData {
    title: string;
    icon: string;
    link_url: string;
    is_external?: boolean;
    badge_text?: string;
    is_active?: boolean;
    order_no?: number;
}

export const quickLinksApi = {
    // ========== SETTINGS ==========
    async getSettings(): Promise<QuickLinksSettings | null> {
        const { data, error } = await supabase
            .from('home_quicklinks_settings')
            .select('*')
            .single();

        if (error) {
            console.error('[quickLinksApi] getSettings error:', error);
            return null;
        }
        return data;
    },

    async updateSettings(settings: Partial<QuickLinksSettings>): Promise<QuickLinksSettings | null> {
        // Get existing settings first
        const existing = await this.getSettings();
        if (!existing) return null;

        const { data, error } = await supabase
            .from('home_quicklinks_settings')
            .update(settings)
            .eq('id', existing.id)
            .select()
            .single();

        if (error) {
            console.error('[quickLinksApi] updateSettings error:', error);
            throw error;
        }
        return data;
    },

    // ========== ITEMS ==========
    async getAllItems(): Promise<QuickLinksItem[]> {
        const { data, error } = await supabase
            .from('home_quicklinks_items')
            .select('*')
            .order('order_no', { ascending: true });

        if (error) {
            console.error('[quickLinksApi] getAllItems error:', error);
            return [];
        }
        return data || [];
    },

    async getActiveItems(): Promise<QuickLinksItem[]> {
        const { data, error } = await supabase
            .from('home_quicklinks_items')
            .select('*')
            .eq('is_active', true)
            .order('order_no', { ascending: true });

        if (error) {
            console.error('[quickLinksApi] getActiveItems error:', error);
            return [];
        }
        return data || [];
    },

    async createItem(itemData: QuickLinksItemFormData): Promise<QuickLinksItem> {
        const { data, error } = await supabase
            .from('home_quicklinks_items')
            .insert([{ ...itemData, is_active: true }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateItem(id: string, itemData: Partial<QuickLinksItemFormData>): Promise<QuickLinksItem> {
        const { data, error } = await supabase
            .from('home_quicklinks_items')
            .update(itemData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('home_quicklinks_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('home_quicklinks_items')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },

    async reorderItems(items: { id: string; order_no: number }[]): Promise<void> {
        // Update each item's order
        for (const item of items) {
            await supabase
                .from('home_quicklinks_items')
                .update({ order_no: item.order_no })
                .eq('id', item.id);
        }
    }
};
