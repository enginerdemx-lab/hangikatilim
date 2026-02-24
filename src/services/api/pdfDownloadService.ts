import { supabase } from '../supabaseClient';

// ============================================
// TYPES
// ============================================

export interface PdfDownloadLog {
    id: string;
    user_id: string;
    calculation_type: string;
    target_amount: number | null;
    down_payment: number | null;
    months: number | null;
    system_type: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    // Joined from profiles
    user_full_name?: string;
    user_email?: string;
    user_phone?: string;
}

export interface PdfDownloadFilters {
    calculationType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

export interface MemberDownloadStat {
    user_id: string;
    user_full_name: string;
    user_phone: string | null;
    download_count: number;
    last_download_at: string;
    downloads: PdfDownloadLog[];
}

// ============================================
// IP ADDRESS HELPER
// ============================================

let cachedIp: string | null = null;

const getClientIp = async (): Promise<string> => {
    if (cachedIp) return cachedIp;
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        cachedIp = data.ip;
        return data.ip;
    } catch {
        return 'unknown';
    }
};

// ============================================
// SERVICE
// ============================================

export const pdfDownloadService = {

    /**
     * Log a PDF download event (fire-and-forget from caller)
     */
    async logDownload(data: {
        userId: string;
        calculationType: string;
        targetAmount: number;
        downPayment: number;
        months: number;
        systemType: string;
    }): Promise<void> {
        try {
            const ip = await getClientIp();

            const { error } = await supabase
                .from('pdf_download_logs')
                .insert({
                    user_id: data.userId,
                    calculation_type: data.calculationType,
                    target_amount: data.targetAmount,
                    down_payment: data.downPayment,
                    months: data.months,
                    system_type: data.systemType,
                    ip_address: ip,
                    user_agent: navigator.userAgent,
                });

            if (error) {
                console.error('PDF download log error:', error);
            }
        } catch (err) {
            console.error('PDF download log failed:', err);
        }
    },

    /**
     * Get all PDF download logs with user profile info (for admin panel)
     */
    async getAllLogs(filters?: PdfDownloadFilters): Promise<PdfDownloadLog[]> {
        // We query pdf_download_logs and then join with profiles
        let query = supabase
            .from('pdf_download_logs')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    phone
                )
            `)
            .order('created_at', { ascending: false });

        if (filters?.calculationType && filters.calculationType !== 'all') {
            query = query.eq('calculation_type', filters.calculationType);
        }

        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }

        if (filters?.dateTo) {
            // Add a day to include the full end date
            const endDate = new Date(filters.dateTo);
            endDate.setDate(endDate.getDate() + 1);
            query = query.lt('created_at', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        // We also need email from auth - we'll get it separately
        // For now, get user IDs and fetch emails via admin service
        // Actually, since we're on anon key, we can't access auth.users directly
        // We'll rely on profiles table having full_name + phone
        // Email will be fetched from auth admin functions if available

        // Transform joined data
        const logs: PdfDownloadLog[] = (data || []).map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            calculation_type: row.calculation_type,
            target_amount: row.target_amount,
            down_payment: row.down_payment,
            months: row.months,
            system_type: row.system_type,
            ip_address: row.ip_address,
            user_agent: row.user_agent,
            created_at: row.created_at,
            user_full_name: row.profiles?.full_name || null,
            user_phone: row.profiles?.phone || null,
        }));

        // If search filter is applied, filter client-side (name/email)
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            return logs.filter(log =>
                log.user_full_name?.toLowerCase().includes(search) ||
                log.user_phone?.includes(search) ||
                log.ip_address?.includes(search)
            );
        }

        return logs;
    },

    /**
     * Get PDF download logs for a specific user (used in Members detail modal)
     */
    async getUserLogs(userId: string): Promise<PdfDownloadLog[]> {
        const { data, error } = await supabase
            .from('pdf_download_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get statistics for the admin page
     */
    async getStats(): Promise<{
        total: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
    }> {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [totalRes, todayRes, weekRes, monthRes] = await Promise.all([
            supabase.from('pdf_download_logs').select('id', { count: 'exact', head: true }),
            supabase.from('pdf_download_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
            supabase.from('pdf_download_logs').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
            supabase.from('pdf_download_logs').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
        ]);

        return {
            total: totalRes.count || 0,
            today: todayRes.count || 0,
            thisWeek: weekRes.count || 0,
            thisMonth: monthRes.count || 0,
        };
    },

    /**
     * Get per-member download statistics for the dashboard widget
     */
    async getMemberDownloadStats(): Promise<MemberDownloadStat[]> {
        const { data, error } = await supabase
            .from('pdf_download_logs')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    phone
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by user_id
        const map = new Map<string, MemberDownloadStat>();

        for (const row of (data || [])) {
            const uid = row.user_id;
            const log: PdfDownloadLog = {
                id: row.id,
                user_id: uid,
                calculation_type: row.calculation_type,
                target_amount: row.target_amount,
                down_payment: row.down_payment,
                months: row.months,
                system_type: row.system_type,
                ip_address: row.ip_address,
                user_agent: row.user_agent,
                created_at: row.created_at,
                user_full_name: (row as any).profiles?.full_name || null,
                user_phone: (row as any).profiles?.phone || null,
            };

            if (map.has(uid)) {
                const existing = map.get(uid)!;
                existing.download_count++;
                existing.downloads.push(log);
            } else {
                map.set(uid, {
                    user_id: uid,
                    user_full_name: log.user_full_name || 'İsimsiz',
                    user_phone: log.user_phone || null,
                    download_count: 1,
                    last_download_at: row.created_at,
                    downloads: [log],
                });
            }
        }

        // Sort by download count descending
        return Array.from(map.values()).sort((a, b) => b.download_count - a.download_count);
    },
};
