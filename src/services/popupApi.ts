import { supabase } from './supabaseClient';

export interface Popup {
    id: string;
    name: string;
    type: 'corner' | 'modal' | 'fullscreen';
    template: 'custom' | 'email' | 'membership' | 'announcement' | 'discount';

    // Content
    title?: string;
    subtitle?: string;
    body_text?: string;
    image_url?: string;

    // Button 1
    button1_text?: string;
    button1_url?: string;
    button1_style?: { bg: string; text: string };

    // Button 2
    button2_text?: string;
    button2_url?: string;
    button2_style?: { bg: string; text: string };

    // Styling
    styles?: {
        bgColor: string;
        titleFont: string;
        titleSize: string;
        titleColor: string;
        bodyFont: string;
        bodySize: string;
        bodyColor: string;
        borderRadius: string;
    };

    // Trigger
    trigger_type: 'immediate' | 'delay' | 'scroll' | 'exit_intent';
    trigger_delay_seconds?: number;
    trigger_scroll_percent?: number;

    // Scheduling
    start_date?: string;
    end_date?: string;
    show_once_per_session: boolean;
    show_on_pages: string[];

    // Countdown
    show_countdown: boolean;
    countdown_end?: string;

    // Email
    collect_email: boolean;
    email_placeholder?: string;
    email_button_text?: string;

    // Status
    is_active: boolean;
    priority: number;

    created_at?: string;
    updated_at?: string;
}

export interface PopupEmailSubscriber {
    id: string;
    popup_id?: string;
    email: string;
    subscribed_at: string;
}

export const popupApi = {
    // Get all popups (admin)
    async getAll(): Promise<Popup[]> {
        const { data, error } = await supabase
            .from('popups')
            .select('*')
            .order('priority', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get active popups for frontend
    async getActive(): Promise<Popup[]> {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('popups')
            .select('*')
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order('priority', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Get single popup
    async getById(id: string): Promise<Popup | null> {
        const { data, error } = await supabase
            .from('popups')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create popup
    async create(popup: Partial<Popup>): Promise<Popup> {
        const { data, error } = await supabase
            .from('popups')
            .insert([popup])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update popup
    async update(id: string, popup: Partial<Popup>): Promise<Popup> {
        const { data, error } = await supabase
            .from('popups')
            .update({ ...popup, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete popup
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('popups')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Toggle active status
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await supabase
            .from('popups')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    // Subscribe email
    async subscribeEmail(popupId: string | null, email: string): Promise<void> {
        const { error } = await supabase
            .from('popup_email_subscribers')
            .insert([{ popup_id: popupId, email }]);

        if (error) {
            if (error.code === '23505') {
                throw new Error('Bu e-posta zaten kayıtlı');
            }
            throw error;
        }
    },

    // Get email subscribers (admin)
    async getSubscribers(): Promise<PopupEmailSubscriber[]> {
        const { data, error } = await supabase
            .from('popup_email_subscribers')
            .select('*')
            .order('subscribed_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
