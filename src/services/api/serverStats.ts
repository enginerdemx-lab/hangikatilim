import { supabase } from '../supabaseClient';

export interface TableStats {
    name: string;
    rowCount: number;
    sizePretty: string;
}

export interface ServerStats {
    database: {
        totalSize: string;
        tableCount: number;
        tables: TableStats[];
    };
    storage: {
        buckets: { name: string; fileCount: number; sizePretty: string }[];
        totalFiles: number;
    };
    auth: {
        totalUsers: number;
    };
    timestamp: string;
    error?: string;
}

const CACHE_KEY = 'serverStats';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
    data: ServerStats;
    timestamp: number;
}

let cache: CachedData | null = null;

export const serverStatsService = {
    async getStats(skipCache = false): Promise<ServerStats> {
        // Check cache
        if (!skipCache && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
            return cache.data;
        }

        try {
            const { data, error } = await supabase.functions.invoke('server-stats');

            if (error) {
                console.error('Server stats error:', error);
                return {
                    database: { totalSize: 'N/A', tableCount: 0, tables: [] },
                    storage: { buckets: [], totalFiles: 0 },
                    auth: { totalUsers: 0 },
                    timestamp: new Date().toISOString(),
                    error: error.message || 'Edge Function çağrısı başarısız'
                };
            }

            // Update cache
            cache = { data, timestamp: Date.now() };

            return data as ServerStats;
        } catch (err) {
            console.error('Failed to fetch server stats:', err);
            return {
                database: { totalSize: 'N/A', tableCount: 0, tables: [] },
                storage: { buckets: [], totalFiles: 0 },
                auth: { totalUsers: 0 },
                timestamp: new Date().toISOString(),
                error: 'Sunucu istatistikleri alınamadı'
            };
        }
    },

    clearCache() {
        cache = null;
    }
};

export default serverStatsService;
