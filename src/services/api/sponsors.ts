import { supabase } from '../supabaseClient';
import { storageService } from '../storageService';

// Types
export interface Sponsor {
    id: string;
    name: string;
    logo_url: string | null;
    title: string;
    description: string | null;
    cta_text: string;
    cta_url: string;
    color: string;
    is_active: boolean;
    order_no: number;
    created_at: string;
    updated_at: string;
}

export interface SponsorFormData {
    name: string;
    logo_url?: string | null;
    title: string;
    description?: string;
    cta_text?: string;
    cta_url: string;
    color?: string;
    is_active?: boolean;
    order_no?: number;
}

export const sponsorsApi = {
    // ========== READ OPERATIONS ==========
    async getAll(): Promise<Sponsor[]> {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .order('order_no', { ascending: true });

        if (error) {
            console.error('[sponsorsApi] getAll error:', error);
            return [];
        }
        return data || [];
    },

    async getActive(): Promise<Sponsor[]> {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('is_active', true)
            .order('order_no', { ascending: true });

        if (error) {
            console.error('[sponsorsApi] getActive error:', error);
            return [];
        }
        return data || [];
    },

    async getById(id: string): Promise<Sponsor | null> {
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[sponsorsApi] getById error:', error);
            return null;
        }
        return data;
    },

    // ========== WRITE OPERATIONS ==========
    async create(sponsorData: SponsorFormData): Promise<Sponsor> {
        const { data, error } = await supabase
            .from('sponsors')
            .insert([{
                ...sponsorData,
                is_active: sponsorData.is_active ?? true,
                cta_text: sponsorData.cta_text || 'Detayları Gör',
                color: sponsorData.color || 'from-blue-500 to-blue-600'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, sponsorData: Partial<SponsorFormData>): Promise<Sponsor> {
        const { data, error } = await supabase
            .from('sponsors')
            .update(sponsorData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('sponsors')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ========== STATUS OPERATIONS ==========
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('sponsors')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },

    async reorderItems(items: { id: string; order_no: number }[]): Promise<void> {
        for (const item of items) {
            await supabase
                .from('sponsors')
                .update({ order_no: item.order_no })
                .eq('id', item.id);
        }
    },

    // ========== LOGO UPLOAD ==========
    async uploadLogo(file: File): Promise<string> {
        const url = await storageService.uploadFile(file, 'sponsors');
        return url;
    }
};
