import { supabase } from '../supabaseClient';
import type { Company, CompanyFormData } from '../../types/database';

export const companiesApi = {
    // Get all companies (admin view - includes inactive)
    async getAllCompanies(): Promise<Company[]> {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get active companies only (for public view and dropdowns)
    async getActiveCompanies(): Promise<Company[]> {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get single company by ID
    async getCompanyById(id: string): Promise<Company | null> {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Get single company by slug (name converted to URL-friendly format)
    async getCompanyBySlug(slug: string): Promise<Company | null> {
        // First try to find by exact name match (slug is URL-decoded)
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        // Find company by matching slug
        const company = data?.find(c => {
            const companySlug = c.name
                .toLowerCase()
                .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ı/g, 'i')
                .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return companySlug === slug;
        });

        return company || null;
    },

    // Create new company
    async createCompany(companyData: CompanyFormData): Promise<Company> {
        const { data, error } = await supabase
            .from('companies')
            .insert([companyData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update company
    async updateCompany(id: string, companyData: Partial<CompanyFormData>): Promise<Company> {
        const { data, error } = await supabase
            .from('companies')
            .update(companyData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete company
    async deleteCompany(id: string): Promise<void> {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Toggle active status
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('companies')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },
};
