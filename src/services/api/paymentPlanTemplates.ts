import { supabase } from '../supabaseClient';

// Domain types
export interface PaymentPlanTemplate {
    id: string;
    name: string;
    description: string;
    company_id: string | null;
    target_amount: number;
    down_payment_percent: number;
    tier_durations: number[];
    tier_first_installment: number | null;
    tier_multiplier: number | null;
    tier_amounts: number[] | null;
    has_balloon: boolean;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export type PaymentPlanTemplateInput = Omit<
    PaymentPlanTemplate,
    'id' | 'created_at' | 'updated_at'
>;

const TABLE = 'payment_plan_templates';

export const paymentPlanTemplatesApi = {
    /** Admin: tüm şablonlar (aktif/pasif) */
    async list(): Promise<PaymentPlanTemplate[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) {
            console.error('paymentPlanTemplatesApi.list error', error);
            return [];
        }
        return (data ?? []) as PaymentPlanTemplate[];
    },

    /** Public: yalnızca aktif şablonlar */
    async listActive(): Promise<PaymentPlanTemplate[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        if (error) {
            console.error('paymentPlanTemplatesApi.listActive error', error);
            return [];
        }
        return (data ?? []) as PaymentPlanTemplate[];
    },

    async getById(id: string): Promise<PaymentPlanTemplate | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            console.error('paymentPlanTemplatesApi.getById error', error);
            return null;
        }
        return (data ?? null) as PaymentPlanTemplate | null;
    },

    async create(input: PaymentPlanTemplateInput): Promise<PaymentPlanTemplate> {
        const { data, error } = await supabase
            .from(TABLE)
            .insert([input])
            .select()
            .single();
        if (error) throw error;
        return data as PaymentPlanTemplate;
    },

    async update(id: string, input: Partial<PaymentPlanTemplateInput>): Promise<PaymentPlanTemplate> {
        const { data, error } = await supabase
            .from(TABLE)
            .update(input)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as PaymentPlanTemplate;
    },

    async remove(id: string): Promise<void> {
        const { error } = await supabase.from(TABLE).delete().eq('id', id);
        if (error) throw error;
    },
};
