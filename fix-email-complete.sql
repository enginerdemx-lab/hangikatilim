-- ==========================================
-- E-POSTA SİSTEMİ TAM DÜZELTME
-- Tüm fonksiyonları düzeltir
-- ==========================================

-- 1. Eski fonksiyonları sil
DROP FUNCTION IF EXISTS public.get_notification_subscribers() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_subscribers() CASCADE;

-- 2. get_notification_subscribers - DÜZELTİLMİŞ
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
    -- Newsletter subscribers (direkt email kolonu var)
    SELECT 
        ns.id,
        ns.email::TEXT,
        COALESCE(ns.name, '')::TEXT as full_name,
        ns.unsubscribe_token::TEXT
    FROM newsletter_subscribers ns
    WHERE ns.is_active = true
    
    UNION ALL
    
    -- Kayıtlı üyeler (auth.users'dan email al)
    SELECT 
        p.id,
        u.email::TEXT,
        COALESCE(p.full_name, '')::TEXT,
        NULL::TEXT as unsubscribe_token
    FROM profiles p
    INNER JOIN auth.users u ON u.id = p.id
    WHERE p.email_notifications = true;
END;
$$;

-- 3. get_all_subscribers - DÜZELTİLMİŞ
CREATE OR REPLACE FUNCTION public.get_all_subscribers()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    source TEXT,
    is_member BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    -- Newsletter subscribers
    SELECT 
        ns.id,
        ns.email::TEXT,
        COALESCE(ns.name, '')::TEXT as full_name,
        COALESCE(ns.source, 'newsletter')::TEXT,
        false as is_member
    FROM newsletter_subscribers ns
    WHERE ns.is_active = true
    
    UNION ALL
    
    -- Kayıtlı üyeler (auth.users'dan email al)
    SELECT 
        p.id,
        u.email::TEXT,
        COALESCE(p.full_name, '')::TEXT,
        'member'::TEXT as source,
        true as is_member
    FROM profiles p
    INNER JOIN auth.users u ON u.id = p.id
    WHERE p.email_notifications = true;
END;
$$;

-- 4. Yetkilendirme
GRANT EXECUTE ON FUNCTION public.get_notification_subscribers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_subscribers() TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_subscribers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_subscribers() TO anon;

-- 5. Test et
SELECT 'TEST: get_all_subscribers' as test_name;
SELECT * FROM get_all_subscribers() LIMIT 5;

SELECT 'TEST: get_notification_subscribers' as test_name;
SELECT * FROM get_notification_subscribers() LIMIT 5;
