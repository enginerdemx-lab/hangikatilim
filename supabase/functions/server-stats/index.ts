import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TableStats {
    name: string;
    rowCount: number;
    sizePretty: string;
}

interface ServerStats {
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
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get database table statistics
        const { data: tableStats, error: tableError } = await supabase.rpc('get_table_stats');

        let tables: TableStats[] = [];
        let totalDbSize = 'N/A';
        let tableCount = 0;

        if (!tableError && tableStats) {
            tables = tableStats.map((t: any) => ({
                name: t.table_name,
                rowCount: parseInt(t.row_count) || 0,
                sizePretty: t.total_size || '0 bytes'
            }));
            tableCount = tables.length;

            // Calculate total size
            const totalBytes = tableStats.reduce((acc: number, t: any) => {
                const sizeStr = t.total_size || '0 bytes';
                const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(bytes|kB|MB|GB)/i);
                if (match) {
                    const value = parseFloat(match[1]);
                    const unit = match[2].toLowerCase();
                    const multipliers: Record<string, number> = { 'bytes': 1, 'kb': 1024, 'mb': 1024 * 1024, 'gb': 1024 * 1024 * 1024 };
                    return acc + (value * (multipliers[unit] || 1));
                }
                return acc;
            }, 0);

            if (totalBytes < 1024) totalDbSize = `${totalBytes} bytes`;
            else if (totalBytes < 1024 * 1024) totalDbSize = `${(totalBytes / 1024).toFixed(1)} KB`;
            else if (totalBytes < 1024 * 1024 * 1024) totalDbSize = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
            else totalDbSize = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }

        // Get storage bucket info
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        let storageBuckets: { name: string; fileCount: number; sizePretty: string }[] = [];
        let totalFiles = 0;

        if (!bucketsError && buckets) {
            for (const bucket of buckets) {
                try {
                    const { data: files } = await supabase.storage.from(bucket.name).list('', { limit: 1000 });
                    const fileCount = files?.length || 0;
                    totalFiles += fileCount;
                    storageBuckets.push({
                        name: bucket.name,
                        fileCount,
                        sizePretty: 'N/A' // Size per bucket requires iteration which is expensive
                    });
                } catch (e) {
                    storageBuckets.push({ name: bucket.name, fileCount: 0, sizePretty: 'Error' });
                }
            }
        }

        // Get auth user count
        let totalUsers = 0;
        try {
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            totalUsers = count || 0;
        } catch (e) {
            // profiles table might not exist, try auth.users via admin API
            try {
                const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1 });
                // This gives us total from the response
                totalUsers = 0; // Admin API doesn't directly give count, would need pagination
            } catch (authErr) {
                totalUsers = 0;
            }
        }

        const stats: ServerStats = {
            database: {
                totalSize: totalDbSize,
                tableCount,
                tables: tables.sort((a, b) => b.rowCount - a.rowCount).slice(0, 10) // Top 10 tables
            },
            storage: {
                buckets: storageBuckets,
                totalFiles
            },
            auth: {
                totalUsers
            },
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(stats), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Server stats error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to get server stats' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
