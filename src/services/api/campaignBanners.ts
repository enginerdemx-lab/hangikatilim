import { supabase } from '../supabaseClient';

export interface CampaignBanner {
    id: string;
    title: string | null;
    image_url: string;
    link_url: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CampaignBannerFormData {
    title?: string;
    image_url: string;
    link_url?: string;
    sort_order?: number;
    is_active?: boolean;
}

export const campaignBannersApi = {
    // Get all active banners (public)
    async getActiveBanners(): Promise<CampaignBanner[]> {
        const { data, error } = await supabase
            .from('campaign_banners')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching campaign banners:', error);
            return [];
        }
        return data || [];
    },

    // Get all banners (admin)
    async getAllBanners(): Promise<CampaignBanner[]> {
        const { data, error } = await supabase
            .from('campaign_banners')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching all campaign banners:', error);
            return [];
        }
        return data || [];
    },

    // Create banner
    async createBanner(banner: CampaignBannerFormData): Promise<CampaignBanner | null> {
        const { data, error } = await supabase
            .from('campaign_banners')
            .insert([{
                ...banner,
                sort_order: banner.sort_order ?? 0,
                is_active: banner.is_active ?? true,
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating campaign banner:', error);
            throw error;
        }
        return data;
    },

    // Update banner
    async updateBanner(id: string, updates: Partial<CampaignBannerFormData>): Promise<CampaignBanner | null> {
        const { data, error } = await supabase
            .from('campaign_banners')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating campaign banner:', error);
            throw error;
        }
        return data;
    },

    // Delete banner
    async deleteBanner(id: string): Promise<void> {
        const { error } = await supabase
            .from('campaign_banners')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting campaign banner:', error);
            throw error;
        }
    },

    // Toggle active status
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('campaign_banners')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error toggling banner status:', error);
            throw error;
        }
    },

    // Reorder banners
    async reorderBanners(orderedIds: string[]): Promise<void> {
        const updates = orderedIds.map((id, index) => ({
            id,
            sort_order: index,
            updated_at: new Date().toISOString(),
        }));

        for (const update of updates) {
            await supabase
                .from('campaign_banners')
                .update({ sort_order: update.sort_order, updated_at: update.updated_at })
                .eq('id', update.id);
        }
    },
};
