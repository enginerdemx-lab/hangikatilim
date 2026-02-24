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
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Failed to get calculator settings:', error);
            return null;
        }
        return data;
    },

    // Update calculator settings
    async updateSettings(id: string, settingsData: Partial<CalculatorSettingsFormData>): Promise<CalculatorSettings> {
        // First try normal update
        const { data, error } = await supabase
            .from('calculator_settings')
            .update(settingsData)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Update failed, trying upsert:', error);
            // Fallback: try upsert
            const { data: upsertData, error: upsertError } = await supabase
                .from('calculator_settings')
                .upsert({ id, ...settingsData })
                .select();

            if (upsertError) throw upsertError;
            if (!upsertData || upsertData.length === 0) throw new Error('Kayıt güncellenemedi');
            return upsertData[0];
        }

        if (!data || data.length === 0) {
            throw new Error('Kayıt bulunamadı veya yetki hatası. Lütfen sayfayı yenileyip tekrar deneyin.');
        }
        return data[0];
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
