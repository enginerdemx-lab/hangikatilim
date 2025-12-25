-- ==========================================
-- SIMPLIFIED GET NOTIFICATION SUBSCRIBERS
-- Basitleştirilmiş abone listesi fonksiyonu
-- ==========================================

-- Drop and recreate with simpler logic
DROP FUNCTION IF EXISTS public.get_notification_subscribers();

CREATE OR REPLACE FUNCTION public.get_notification_subscribers()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    unsubscribe_token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    -- Newsletter subscribers only (simpler approach)
    SELECT 
        ns.id,
        ns.email::TEXT,
        COALESCE(ns.name, '')::TEXT as full_name,
        COALESCE(ns.unsubscribe_token::TEXT, ns.id::TEXT) as unsubscribe_token
    FROM newsletter_subscribers ns
    WHERE ns.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_notification_subscribers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_subscribers() TO anon;
