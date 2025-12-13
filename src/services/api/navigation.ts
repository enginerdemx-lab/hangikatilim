import { supabase } from '../supabaseClient';
import type { NavItem } from '../../types/database';

export interface NavItemFormData {
    label: string;
    link: string;
    sort_order: number;
    is_active: boolean;
}

export const navigationApi = {
    // Get all navigation items (admin view - includes inactive)
    async getAllNavItems(): Promise<NavItem[]> {
        const { data, error } = await supabase
            .from('nav_items')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get active navigation items only (for public view)
    async getActiveNavItems(): Promise<NavItem[]> {
        const { data, error } = await supabase
            .from('nav_items')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get single nav item by ID
    async getNavItemById(id: string): Promise<NavItem | null> {
        const { data, error } = await supabase
            .from('nav_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create new nav item
    async createNavItem(navData: NavItemFormData): Promise<NavItem> {
        const { data, error } = await supabase
            .from('nav_items')
            .insert([navData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update nav item
    async updateNavItem(id: string, navData: Partial<NavItemFormData>): Promise<NavItem> {
        const { data, error } = await supabase
            .from('nav_items')
            .update(navData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete nav item
    async deleteNavItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('nav_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Toggle active status
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('nav_items')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },
};
