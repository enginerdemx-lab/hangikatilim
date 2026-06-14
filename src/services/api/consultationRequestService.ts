import { supabase } from '../supabaseClient';

export type ConsultationStatus = 'new' | 'contacted' | 'completed' | 'archived';
export type ConsultationSystemType = 'CEKILISLI' | 'CEKILISSIZ';

export interface ConsultationRequest {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    amount: number;
    monthly_payment: number | null;
    city: string | null;
    district: string | null;
    system_type: ConsultationSystemType;
    consent: boolean;
    status: ConsultationStatus;
    admin_note: string | null;
    user_agent: string | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
}

export interface ConsultationRequestPayload {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    amount: number;
    monthly_payment?: number | null;
    city?: string | null;
    district?: string | null;
    system_type: ConsultationSystemType;
    consent: boolean;
}

export interface ConsultationRequestStats {
    total: number;
    new: number;
    contacted: number;
    completed: number;
    archived: number;
}

export const consultationRequestService = {
    async submit(payload: ConsultationRequestPayload): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('consultation_requests')
                .insert({
                    first_name: payload.first_name.trim(),
                    last_name: payload.last_name.trim(),
                    phone: payload.phone.trim(),
                    email: payload.email.trim().toLowerCase(),
                    amount: payload.amount,
                    monthly_payment: payload.monthly_payment ?? null,
                    city: payload.city ?? null,
                    district: payload.district ?? null,
                    system_type: payload.system_type,
                    consent: payload.consent,
                    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                });
            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('Consultation submit error:', err);
            return { success: false, error: err?.message || 'Talep gonderilemedi' };
        }
    },

    async list(options?: { status?: ConsultationStatus | 'all'; limit?: number }): Promise<ConsultationRequest[]> {
        try {
            let q = supabase
                .from('consultation_requests')
                .select('*')
                .order('created_at', { ascending: false });
            if (options?.status && options.status !== 'all') {
                q = q.eq('status', options.status);
            }
            if (options?.limit) {
                q = q.limit(options.limit);
            }
            const { data, error } = await q;
            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Consultation list error:', err);
            return [];
        }
    },

    async stats(): Promise<ConsultationRequestStats> {
        try {
            const { data, error } = await supabase
                .from('consultation_requests')
                .select('status');
            if (error) throw error;
            const rows = data || [];
            return {
                total: rows.length,
                new: rows.filter((r: any) => r.status === 'new').length,
                contacted: rows.filter((r: any) => r.status === 'contacted').length,
                completed: rows.filter((r: any) => r.status === 'completed').length,
                archived: rows.filter((r: any) => r.status === 'archived').length,
            };
        } catch (err) {
            console.error('Consultation stats error:', err);
            return { total: 0, new: 0, contacted: 0, completed: 0, archived: 0 };
        }
    },

    async updateStatus(id: string, status: ConsultationStatus, adminNote?: string): Promise<boolean> {
        try {
            const payload: any = { status };
            if (typeof adminNote === 'string') payload.admin_note = adminNote;
            const { error } = await supabase
                .from('consultation_requests')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Consultation update error:', err);
            return false;
        }
    },

    async updateNote(id: string, adminNote: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('consultation_requests')
                .update({ admin_note: adminNote })
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Consultation note update error:', err);
            return false;
        }
    },

    async remove(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('consultation_requests')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Consultation delete error:', err);
            return false;
        }
    },
};

export default consultationRequestService;
