import { supabase } from '../supabaseClient';
import type { HomeHero } from '../../types/database';

export const homeHeroApi = {
    // Get all hero slides
    async getAllSlides(): Promise<HomeHero[]> {
        const { data, error } = await supabase
            .from('home_hero')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get single slide by ID
    async getSlideById(id: string): Promise<HomeHero | null> {
        const { data, error } = await supabase
            .from('home_hero')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create hero slide
    async createSlide(slideData: Partial<HomeHero>): Promise<HomeHero> {
        const { data, error } = await supabase
            .from('home_hero')
            .insert([slideData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update hero slide
    async updateSlide(id: string, slideData: Partial<HomeHero>): Promise<HomeHero> {
        const { data, error } = await supabase
            .from('home_hero')
            .update(slideData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete hero slide
    async deleteSlide(id: string): Promise<void> {
        const { error } = await supabase
            .from('home_hero')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
