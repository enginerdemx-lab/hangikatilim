import { supabase } from '../supabaseClient';

export interface CalculationFeedback {
    id: string;
    user_id: string | null;
    is_positive: boolean;
    comment: string | null;
    calculation_params: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface FeedbackStats {
    total: number;
    positive: number;
    negative: number;
    positive_rate: number | null;
}

export interface SubmitFeedbackParams {
    is_positive: boolean;
    comment?: string;
    feedback_reason?: string; // Reason for negative feedback
    calculation_params?: Record<string, unknown>;
}

export const feedbackService = {
    // Submit feedback (public - anyone can submit)
    async submitFeedback(params: SubmitFeedbackParams): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('calculation_feedback')
                .insert({
                    user_id: user?.id || null,
                    is_positive: params.is_positive,
                    comment: params.comment || params.feedback_reason || null,
                    calculation_params: params.calculation_params || null,
                    user_agent: navigator.userAgent,
                });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Feedback submit error:', error);
            return { success: false, error: 'Geri bildirim gönderilemedi' };
        }
    },

    // Get all feedback (admin only)
    async getFeedbackList(options?: {
        filter?: 'all' | 'positive' | 'negative';
        limit?: number;
        offset?: number;
    }): Promise<CalculationFeedback[]> {
        try {
            let query = supabase
                .from('calculation_feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (options?.filter === 'positive') {
                query = query.eq('is_positive', true);
            } else if (options?.filter === 'negative') {
                query = query.eq('is_positive', false);
            }

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            if (options?.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Feedback list error:', error);
            return [];
        }
    },

    // Get feedback stats (admin only)
    async getFeedbackStats(): Promise<FeedbackStats> {
        try {
            const { data, error } = await supabase.rpc('get_feedback_stats');
            if (error) throw error;
            return data || { total: 0, positive: 0, negative: 0, positive_rate: null };
        } catch (error) {
            console.error('Feedback stats error:', error);
            return { total: 0, positive: 0, negative: 0, positive_rate: null };
        }
    },

    // Delete feedback (admin only)
    async deleteFeedback(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('calculation_feedback')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Feedback delete error:', error);
            return false;
        }
    }
};

export default feedbackService;
