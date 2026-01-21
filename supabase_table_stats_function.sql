-- Function to get table statistics
-- Run this in Supabase SQL Editor to create the required function

CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE (
    table_name text,
    row_count bigint,
    total_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.relname::text as table_name,
        c.reltuples::bigint as row_count,
        pg_size_pretty(pg_total_relation_size(c.oid)) as total_size
    FROM pg_class c
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_table_stats() TO service_role;
