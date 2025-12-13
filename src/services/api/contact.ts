import { supabase } from '../supabaseClient';
import type { ContactSettings, ContactMessage, MessageStatus } from '../../types/database';

export interface ContactSettingsFormData {
    email?: string;
    phone?: string;
    address?: string;
    working_hours?: string;
    map_embed_url?: string;
}

export const contactApi = {
    // ===== CONTACT SETTINGS =====

    // Get contact settings (there should be only one record)
    async getSettings(): Promise<ContactSettings | null> {
        const { data, error } = await supabase
            .from('contact_settings')
            .select('*')
            .single();

        if (error) {
            // If no record exists, return null
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    // Update contact settings
    async updateSettings(id: string, settingsData: Partial<ContactSettingsFormData>): Promise<ContactSettings> {
        const { data, error } = await supabase
            .from('contact_settings')
            .update(settingsData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Create contact settings (if doesn't exist)
    async createSettings(settingsData: ContactSettingsFormData): Promise<ContactSettings> {
        const { data, error } = await supabase
            .from('contact_settings')
            .insert([settingsData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ===== CONTACT MESSAGES =====

    // Get all contact messages
    async getAllMessages(): Promise<ContactMessage[]> {
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get messages by status
    async getMessagesByStatus(status: MessageStatus): Promise<ContactMessage[]> {
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get single message by ID
    async getMessageById(id: string): Promise<ContactMessage | null> {
        const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Update message status
    async updateMessageStatus(id: string, status: MessageStatus): Promise<void> {
        const { error } = await supabase
            .from('contact_messages')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    // Delete message
    async deleteMessage(id: string): Promise<void> {
        const { error } = await supabase
            .from('contact_messages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Submit contact message (for public form)
    async submitMessage(messageData: {
        name: string;
        email: string;
        phone?: string;
        subject?: string;
        message: string;
    }): Promise<ContactMessage> {
        const { data, error } = await supabase
            .from('contact_messages')
            .insert([{ ...messageData, status: 'new' }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};
