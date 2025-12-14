import { supabase } from '../supabaseClient';
import type { HowItWorksStep, InfoCard, LicensedCompany, FAQItem } from '../../types/database';

export const homeContentApi = {
    // ===== HOW IT WORKS =====
    async getHowItWorksSteps(): Promise<HowItWorksStep[]> {
        const { data, error } = await supabase
            .from('how_it_works_steps')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createHowItWorksStep(step: Omit<HowItWorksStep, 'id' | 'created_at' | 'updated_at'>): Promise<HowItWorksStep> {
        const { data, error } = await supabase
            .from('how_it_works_steps')
            .insert([step])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateHowItWorksStep(id: string, step: Partial<HowItWorksStep>): Promise<void> {
        const { error } = await supabase
            .from('how_it_works_steps')
            .update(step)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteHowItWorksStep(id: string): Promise<void> {
        const { error } = await supabase
            .from('how_it_works_steps')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ===== INFO CARDS =====
    async getInfoCards(section?: string): Promise<InfoCard[]> {
        let query = supabase
            .from('info_cards')
            .select('*')
            .eq('is_active', true);

        if (section) {
            query = query.eq('section', section);
        }

        const { data, error } = await query.order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createInfoCard(card: Omit<InfoCard, 'id' | 'created_at' | 'updated_at'>): Promise<InfoCard> {
        const { data, error } = await supabase
            .from('info_cards')
            .insert([card])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateInfoCard(id: string, card: Partial<InfoCard>): Promise<void> {
        const { error } = await supabase
            .from('info_cards')
            .update(card)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteInfoCard(id: string): Promise<void> {
        const { error } = await supabase
            .from('info_cards')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ===== LICENSED COMPANIES =====
    async getLicensedCompanies(): Promise<LicensedCompany[]> {
        const { data, error } = await supabase
            .from('licensed_companies')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createLicensedCompany(company: Omit<LicensedCompany, 'id' | 'created_at' | 'updated_at'>): Promise<LicensedCompany> {
        const { data, error } = await supabase
            .from('licensed_companies')
            .insert([company])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateLicensedCompany(id: string, company: Partial<LicensedCompany>): Promise<void> {
        const { error } = await supabase
            .from('licensed_companies')
            .update(company)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteLicensedCompany(id: string): Promise<void> {
        const { error } = await supabase
            .from('licensed_companies')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ===== FAQ =====
    async getFAQItems(): Promise<FAQItem[]> {
        const { data, error } = await supabase
            .from('faq_items')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createFAQItem(faq: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>): Promise<FAQItem> {
        const { data, error } = await supabase
            .from('faq_items')
            .insert([faq])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateFAQItem(id: string, faq: Partial<FAQItem>): Promise<void> {
        const { error } = await supabase
            .from('faq_items')
            .update(faq)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteFAQItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('faq_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ===== ALIASES FOR COMPONENT COMPATIBILITY =====
    // FAQ aliases
    async getFAQs(): Promise<FAQItem[]> {
        return this.getFAQItems();
    },
    async createFAQ(faq: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>): Promise<FAQItem> {
        return this.createFAQItem(faq);
    },
    async updateFAQ(id: string, faq: Partial<FAQItem>): Promise<void> {
        return this.updateFAQItem(id, faq);
    },
    async deleteFAQ(id: string): Promise<void> {
        return this.deleteFAQItem(id);
    },

    // Company Logo aliases (maps to LicensedCompanies)
    async getCompanyLogos(): Promise<LicensedCompany[]> {
        return this.getLicensedCompanies();
    },
    async createCompanyLogo(company: Omit<LicensedCompany, 'id' | 'created_at' | 'updated_at'>): Promise<LicensedCompany> {
        return this.createLicensedCompany(company);
    },
    async updateCompanyLogo(id: string, company: Partial<LicensedCompany>): Promise<void> {
        return this.updateLicensedCompany(id, company);
    },
    async deleteCompanyLogo(id: string): Promise<void> {
        return this.deleteLicensedCompany(id);
    },
};
