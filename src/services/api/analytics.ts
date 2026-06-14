import { supabase } from '../supabaseClient';

// GA4 Analytics Data Types
export interface AnalyticsData {
    // Status fields for Data Health card
    status: 'ok' | 'error';
    lastFetchedAt: string;
    hasError: boolean;
    errorMessage: string | null;
    // Analytics data
    users: number;
    sessions: number;
    pageViews: number;
    events: {
        pdf_download: number;
        ai_button_click: number;
        calculation_saved: number;
        share_link_copy?: number;
        share_whatsapp?: number;
    };
    topPages: { path: string; views: number }[];
    // 30 günlük günlük trafik serisi (tarih artan sıralı)
    timeseries?: { date: string; users: number; sessions: number; pageViews: number }[];
    lastUpdated: string;
    error?: string;
}

// GA4 Realtime (son 30 dakika)
export interface RealtimeData {
    activeUsers: number;
    perMinute: number[]; // 30 eleman; index 0 = şu an, 29 = 29 dk önce
    byCountry: { country: string; users: number }[];
    lastUpdated: string;
    hasError: boolean;
    errorMessage: string | null;
}

// Data Health Status
export type HealthStatus = 'healthy' | 'warning' | 'error';

export interface DataHealthInfo {
    isConnected: boolean;
    status: HealthStatus;
    lastFetchedAt: string | null;
    hasError: boolean;
    errorMessage: string | null;
    isDataStale: boolean;
}

// Default empty state
const emptyAnalytics: AnalyticsData = {
    status: 'error',
    lastFetchedAt: new Date().toISOString(),
    hasError: true,
    errorMessage: null,
    users: 0,
    sessions: 0,
    pageViews: 0,
    events: {
        pdf_download: 0,
        ai_button_click: 0,
        calculation_saved: 0,
    },
    topPages: [],
    lastUpdated: new Date().toISOString(),
};

// Local cache (5 minute TTL)
let localCache: { data: AnalyticsData; timestamp: number; httpStatus?: number } | null = null;
const LOCAL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STALE_DATA_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

export const analyticsService = {
    /**
     * Fetch GA4 analytics overview from Supabase Edge Function
     * Returns cached data if available and not expired
     */
    async getOverview(skipCache = false): Promise<AnalyticsData> {
        try {
            // Check local cache first (unless explicitly skipping)
            if (!skipCache && localCache && Date.now() - localCache.timestamp < LOCAL_CACHE_TTL) {
                return localCache.data;
            }

            const { data, error } = await supabase.functions.invoke('analytics-overview');

            if (error) {
                const errorData: AnalyticsData = {
                    ...emptyAnalytics,
                    status: 'error',
                    hasError: true,
                    errorMessage: error.message,
                    error: error.message
                };
                localCache = { data: errorData, timestamp: Date.now(), httpStatus: 500 };
                return errorData;
            }

            if (!data) {
                const emptyData: AnalyticsData = {
                    ...emptyAnalytics,
                    errorMessage: 'Veri alınamadı'
                };
                localCache = { data: emptyData, timestamp: Date.now(), httpStatus: 204 };
                return emptyData;
            }

            // Update local cache with success
            localCache = { data: data as AnalyticsData, timestamp: Date.now(), httpStatus: 200 };

            return data as AnalyticsData;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Bağlantı hatası';
            const errorData: AnalyticsData = {
                ...emptyAnalytics,
                status: 'error',
                hasError: true,
                errorMessage: errorMsg,
                error: errorMsg
            };
            localCache = { data: errorData, timestamp: Date.now(), httpStatus: 0 };
            return errorData;
        }
    },

    /**
     * Fetch GA4 realtime (last 30 minutes) active users.
     * Not cached client-side — the dashboard polls this periodically.
     */
    async getRealtime(): Promise<RealtimeData> {
        const empty = (msg: string | null): RealtimeData => ({
            activeUsers: 0,
            perMinute: [],
            byCountry: [],
            lastUpdated: new Date().toISOString(),
            hasError: true,
            errorMessage: msg,
        });

        try {
            const { data, error } = await supabase.functions.invoke('analytics-overview', {
                body: { part: 'realtime' },
            });

            if (error) return empty(error.message);
            // Edge Function henüz güncellenmediyse realtime alanları gelmez
            if (!data || !Array.isArray((data as any).perMinute)) {
                return empty('Realtime verisi yok (Edge Function güncel mi?)');
            }

            const rt = data as any;
            return {
                activeUsers: rt.activeUsers || 0,
                perMinute: rt.perMinute || [],
                byCountry: rt.byCountry || [],
                lastUpdated: rt.lastUpdated || new Date().toISOString(),
                hasError: false,
                errorMessage: null,
            };
        } catch (error) {
            return empty(error instanceof Error ? error.message : 'Bağlantı hatası');
        }
    },

    /**
     * Get Data Health information for dashboard card
     */
    getDataHealth(analytics: AnalyticsData | null): DataHealthInfo {
        if (!analytics) {
            return {
                isConnected: false,
                status: 'error',
                lastFetchedAt: null,
                hasError: true,
                errorMessage: 'Veri yüklenemedi',
                isDataStale: true,
            };
        }

        const lastFetchedAt = analytics.lastFetchedAt || analytics.lastUpdated;
        const isStale = lastFetchedAt
            ? (Date.now() - new Date(lastFetchedAt).getTime()) > STALE_DATA_THRESHOLD
            : true;

        const isConnected = analytics.status === 'ok' && !analytics.hasError;

        let status: HealthStatus = 'healthy';
        if (analytics.hasError || !isConnected) {
            status = 'error';
        } else if (isStale) {
            status = 'warning';
        }

        return {
            isConnected,
            status,
            lastFetchedAt: lastFetchedAt || null,
            hasError: analytics.hasError,
            errorMessage: analytics.errorMessage || analytics.error || null,
            isDataStale: isStale,
        };
    },

    /**
     * Clear local cache (useful for manual refresh)
     */
    clearCache() {
        localCache = null;
    },

    /**
     * Force refresh - bypasses cache
     */
    async forceRefresh(): Promise<AnalyticsData> {
        this.clearCache();
        return this.getOverview(true);
    },

    /**
     * Check if analytics is configured (Edge Function deployed)
     */
    async isConfigured(): Promise<boolean> {
        try {
            const data = await this.getOverview();
            return !data.error?.includes('Missing GA4 configuration');
        } catch {
            return false;
        }
    },
};
