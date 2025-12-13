import { supabase } from '../supabaseClient';
import type { CalculatorSettings } from '../../types/database';

export interface CalculatorSettingsFormData {
    default_amount: number;
    min_amount: number;
    max_amount: number;
    min_vade: number;
    max_vade: number;
    description?: string;
    help_text?: string;
}

export const calculatorApi = {
    // Get calculator settings (there should be only one record)
    async getSettings(): Promise<CalculatorSettings | null> {
        const { data, error } = await supabase
            .from('calculator_settings')
            .select('*')
            .single();

        if (error) {
            // If no record exists, return null
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    // Update calculator settings
    async updateSettings(id: string, settingsData: Partial<CalculatorSettingsFormData>): Promise<CalculatorSettings> {
        const { data, error } = await supabase
            .from('calculator_settings')
            .update(settingsData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Create calculator settings (if doesn't exist)
    async createSettings(settingsData: CalculatorSettingsFormData): Promise<CalculatorSettings> {
        const { data, error } = await supabase
            .from('calculator_settings')
            .insert([settingsData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};
