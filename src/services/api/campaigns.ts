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
    async updateCampaign(id: string, campaignData: Partial<CampaignFormData>): Promise<Campaign> {
        const { data, error } = await supabase
            .from('campaigns')
            .update(campaignData)
            .eq('id', id)
            .select(`
        *,
        company:companies(*)
      `)
            .single();

        if (error) throw error;
        return data;
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
        const { error } = await supabase
            .from('campaigns')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
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
            .update({ order_index: newOrderIndex })
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
        const { error: update1Error } = await supabase
            .from('campaigns')
            .update({ order_index: camp2.order_index })
            .eq('id', camp1.id);

        if (update1Error) throw update1Error;

        const { error: update2Error } = await supabase
            .from('campaigns')
            .update({ order_index: camp1.order_index })
            .eq('id', camp2.id);

        if (update2Error) throw update2Error;
    },
};
