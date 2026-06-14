import { supabase } from '../supabaseClient';
import type { Campaign, CampaignFormData } from '../../types/database';

export const campaignsApi = {
    // Get all campaigns with company data (admin view - includes inactive)
    async getAllCampaigns(): Promise<Campaign[]> {
        const { data, error } = await supabase
            .from('campaigns')
            .select(`
        *,
        company:companies(*)
      `)
            .order('order_index', { ascending: true })
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get active campaigns only (for public view)
    async getActiveCampaigns(): Promise<Campaign[]> {
        const { data, error } = await supabase
            .from('campaigns')
            .select(`
        *,
        company:companies(*)
      `)
            .eq('is_active', true)
            .eq('companies.is_active', true)
            .order('order_index', { ascending: true })
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get campaigns by company
    async getCampaignsByCompany(companyId: string): Promise<Campaign[]> {
        const { data, error } = await supabase
            .from('campaigns')
            .select(`
        *,
        company:companies(*)
      `)
            .eq('company_id', companyId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get single campaign by ID
    async getCampaignById(id: string): Promise<Campaign | null> {
        const { data, error } = await supabase
            .from('campaigns')
            .select(`
        *,
        company:companies(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Get campaign by slug (for public detail page)
    async getCampaignBySlug(slug: string): Promise<Campaign | null> {
        const { data, error } = await supabase
            .from('campaigns')
            .select(`
        *,
        company:companies(*)
      `)
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // Increment view count (called from the public campaign detail page).
    // Mirrors news/blog: prefer the SECURITY DEFINER RPC (works for anon visitors,
    // bypasses RLS), fall back to a direct update if the RPC is unavailable.
    async incrementViewCount(id: string): Promise<void> {
        try {
            const { error: rpcError } = await supabase.rpc('increment_campaign_view_count', { row_id: id });
            if (rpcError) {
                console.warn('Campaign RPC view count failed, trying direct update:', rpcError.message);
                const { data: current } = await supabase
                    .from('campaigns')
                    .select('view_count')
                    .eq('id', id)
                    .single();
                const newCount = ((current?.view_count) || 0) + 1;
                const { error: updateError } = await supabase
                    .from('campaigns')
                    .update({ view_count: newCount })
                    .eq('id', id);
                if (updateError) console.error('Direct campaign view count update failed:', updateError.message);
            }
        } catch (error) {
            console.error('Error incrementing campaign view count:', error);
        }
    },

    // Create new campaign
    async createCampaign(campaignData: CampaignFormData): Promise<Campaign> {
        const { data, error } = await supabase
            .from('campaigns')
            .insert([campaignData])
            .select(`
        *,
        company:companies(*)
      `)
            .single();

        if (error) throw error;
        return data;
    },

    // Update campaign
    async updateCampaign(id: string, campaignData: Partial<CampaignFormData>): Promise<void> {
        // Explicitly whitelist only fields that exist in the database
        const safeData: Record<string, unknown> = {};

        if (campaignData.company_id !== undefined) safeData.company_id = campaignData.company_id;
        if (campaignData.title !== undefined) safeData.title = campaignData.title;
        if (campaignData.badge_type !== undefined) safeData.badge_type = campaignData.badge_type || null;
        if (campaignData.vade_months !== undefined) safeData.vade_months = campaignData.vade_months;
        if (campaignData.amount_tl !== undefined) safeData.amount_tl = campaignData.amount_tl;
        if (campaignData.bullet_points !== undefined) safeData.bullet_points = campaignData.bullet_points;
        if (campaignData.application_link !== undefined) safeData.application_link = campaignData.application_link;
        if (campaignData.terms_link !== undefined) safeData.terms_link = campaignData.terms_link;
        if (campaignData.application_button_text !== undefined) safeData.application_button_text = campaignData.application_button_text;
        if (campaignData.terms_button_text !== undefined) safeData.terms_button_text = campaignData.terms_button_text;
        if (campaignData.image_url !== undefined) safeData.image_url = campaignData.image_url;
        if (campaignData.mobile_image_url !== undefined) safeData.mobile_image_url = campaignData.mobile_image_url;
        if (campaignData.slug !== undefined) safeData.slug = campaignData.slug || null;
        if (campaignData.content !== undefined) safeData.content = campaignData.content || null;
        if (campaignData.is_active !== undefined) safeData.is_active = campaignData.is_active;
        safeData.updated_at = new Date().toISOString();

        console.log('[campaignsApi] updateCampaign id:', id, 'safeData:', safeData);

        const { error, count } = await supabase
            .from('campaigns')
            .update(safeData, { count: 'exact' })
            .eq('id', id);

        if (error) {
            console.error('[campaignsApi] updateCampaign error:', error);
            throw error;
        }

        console.log('[campaignsApi] updateCampaign count:', count);
        if (count === 0) {
            throw new Error('Kampanya güncellenemedi. Supabase RLS politikası UPDATE işlemini engelliyor. Supabase Dashboard > Authentication > Policies > campaigns tablosunda UPDATE politikası eklemeniz gerekiyor.');
        }
    },

    // Delete campaign
    async deleteCampaign(id: string): Promise<void> {
        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Toggle active status
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        console.log('[campaignsApi] toggleActive:', id, 'to:', isActive);

        const { error, count } = await supabase
            .from('campaigns')
            .update({ is_active: isActive, updated_at: new Date().toISOString() }, { count: 'exact' })
            .eq('id', id);

        if (error) {
            console.error('[campaignsApi] toggleActive error:', error);
            throw error;
        }

        console.log('[campaignsApi] toggleActive count:', count);
        if (count === 0) {
            throw new Error('Durum değiştirilemedi. Supabase RLS politikası UPDATE işlemini engelliyor. Supabase Dashboard > Authentication > Policies > campaigns tablosunda UPDATE politikası eklemeniz gerekiyor.');
        }
    },

    // Search campaigns
    async searchCampaigns(query: string): Promise<Campaign[]> {
        const { data, error } = await supabase
            .from('campaigns')
            .select(`
        *,
        company:companies(*)
      `)
            .or(`title.ilike.%${query}%,companies.name.ilike.%${query}%`)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Update campaign order
    async updateCampaignOrder(campaignId: string, newOrderIndex: number): Promise<void> {
        const { error } = await supabase
            .from('campaigns')
            .update({ order_index: newOrderIndex, updated_at: new Date().toISOString() })
            .eq('id', campaignId);

        if (error) throw error;
    },

    // Swap order of two campaigns
    async swapCampaignOrder(campaign1Id: string, campaign2Id: string): Promise<void> {
        // Get both campaigns' current orders
        const { data: campaigns, error: fetchError } = await supabase
            .from('campaigns')
            .select('id, order_index')
            .in('id', [campaign1Id, campaign2Id]);

        if (fetchError) throw fetchError;
        if (!campaigns || campaigns.length !== 2) throw new Error('Campaigns not found');

        const [camp1, camp2] = campaigns;

        // Swap their order_index values
        const updatedAt = new Date().toISOString();

        const { error: update1Error } = await supabase
            .from('campaigns')
            .update({ order_index: camp2.order_index, updated_at: updatedAt })
            .eq('id', camp1.id);

        if (update1Error) throw update1Error;

        const { error: update2Error } = await supabase
            .from('campaigns')
            .update({ order_index: camp1.order_index, updated_at: updatedAt })
            .eq('id', camp2.id);

        if (update2Error) throw update2Error;
    },
};
