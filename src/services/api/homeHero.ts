import { supabase } from '../supabaseClient';
import type { HomeHero } from '../../types/database';

// Define valid database columns to prevent 400 errors from unknown fields
const VALID_DB_COLUMNS = [
    'title',
    'subtitle',
    'background_image_url',
    'mobile_image_url',
    'background_gradient_start',
    'background_gradient_end',
    'image_fit_mode',
    'object_position_x',
    'object_position_y',
    'cta1_label',
    'cta1_link',
    'cta2_label',
    'cta2_link',
    'sort_order',
    'is_active',
];

// Filter payload to only include valid DB columns
function filterPayload(data: Partial<HomeHero>): Partial<HomeHero> {
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
        if (VALID_DB_COLUMNS.includes(key)) {
            const value = (data as Record<string, unknown>)[key];
            // Skip undefined, null, or NaN values
            if (value !== undefined && value !== null && !Number.isNaN(value)) {
                filtered[key] = value;
            }
        }
    }
    return filtered as Partial<HomeHero>;
}

export const homeHeroApi = {
    // Get all hero slides
    async getAllSlides(): Promise<HomeHero[]> {
        const { data, error } = await supabase
            .from('home_hero')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[homeHeroApi] getAllSlides error:', error);
            throw error;
        }
        return data || [];
    },

    // Get single slide by ID
    async getSlideById(id: string): Promise<HomeHero | null> {
        const { data, error } = await supabase
            .from('home_hero')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[homeHeroApi] getSlideById error:', error);
            throw error;
        }
        return data;
    },

    // Create hero slide
    async createSlide(slideData: Partial<HomeHero>): Promise<HomeHero> {
        const cleanPayload = filterPayload(slideData);
        console.log('[homeHeroApi] createSlide payload:', cleanPayload);

        const { data, error } = await supabase
            .from('home_hero')
            .insert([cleanPayload])
            .select()
            .single();

        if (error) {
            console.error('[homeHeroApi] createSlide error:', error);
            throw error;
        }
        return data;
    },

    // Update hero slide
    async updateSlide(id: string, slideData: Partial<HomeHero>): Promise<HomeHero> {
        const cleanPayload = filterPayload(slideData);
        console.log('[homeHeroApi] updateSlide payload:', cleanPayload);

        const { data, error } = await supabase
            .from('home_hero')
            .update(cleanPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[homeHeroApi] updateSlide error:', error);
            throw error;
        }
        return data;
    },

    // Delete hero slide
    async deleteSlide(id: string): Promise<void> {
        const { error } = await supabase
            .from('home_hero')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[homeHeroApi] deleteSlide error:', error);
            throw error;
        }
    },

    // Update sort order for slides
    async updateSortOrder(id: string, newOrder: number): Promise<void> {
        const { error } = await supabase
            .from('home_hero')
            .update({ sort_order: newOrder })
            .eq('id', id);

        if (error) {
            console.error('[homeHeroApi] updateSortOrder error:', error);
            throw error;
        }
    },

    // Reorder slides (swap two slides)
    async reorderSlides(slides: { id: string; sort_order: number }[]): Promise<void> {
        for (const slide of slides) {
            await this.updateSortOrder(slide.id, slide.sort_order);
        }
    },
};

