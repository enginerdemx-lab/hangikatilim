import { supabase } from '../supabaseClient';
import type { SiteSettings } from '../../types/database';

export const siteSettingsApi = {
    // Get site settings (should only be one row)
    async getSettings(): Promise<SiteSettings | null> {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .single();

        if (error) {
            // If no settings exist, return null
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    // Update site settings
    async updateSettings(id: string, settings: Partial<SiteSettings>): Promise<SiteSettings> {
        const { data, error } = await supabase
            .from('site_settings')
            .update(settings)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Create initial settings (if none exist)
    async createSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
        const { data, error } = await supabase
            .from('site_settings')
            .insert([settings])
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};
