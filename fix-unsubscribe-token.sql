-- ==========================================
-- FIX UNSUBSCRIBE TOKEN & UPDATE TEMPLATES
-- Token oluşturma ve template güncellemesi
-- ==========================================

-- 1. unsubscribe_token kolonu UUID tipinde - doğrudan UUID değeri atayalım
UPDATE newsletter_subscribers 
SET unsubscribe_token = gen_random_uuid()
WHERE unsubscribe_token IS NULL;

-- 2. get_notification_subscribers fonksiyonunu güncelle - UUID'yi TEXT'e çevir
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
        COALESCE(ns.unsubscribe_token::TEXT, ns.id::TEXT) as unsubscribe_token
    FROM newsletter_subscribers ns
    WHERE ns.is_active = true
    
    UNION ALL
    
    -- Kayıtlı üyeler (auth.users'dan email al, id'yi token olarak kullan)
    SELECT 
        p.id,
        u.email::TEXT,
        COALESCE(p.full_name, '')::TEXT,
        p.id::TEXT as unsubscribe_token  -- Üyeler için id kullanılır
    FROM profiles p
    INNER JOIN auth.users u ON u.id = p.id
    WHERE p.email_notifications = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_notification_subscribers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_subscribers() TO anon;

-- 3. Unsubscribe fonksiyonunu güncelle - hem UUID token hem id ile çalışsın
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_found BOOLEAN := FALSE;
    v_uuid UUID;
BEGIN
    -- p_token'ı UUID'ye çevir
    BEGIN
        v_uuid := p_token::UUID;
    EXCEPTION WHEN OTHERS THEN
        -- UUID değilse çık
        RETURN FALSE;
    END;
    
    -- Newsletter subscribers tablosunda token ile ara
    UPDATE newsletter_subscribers
    SET is_active = false
    WHERE unsubscribe_token = v_uuid;
    
    IF FOUND THEN
        v_found := TRUE;
    END IF;
    
    -- Profiles tablosunda id ile ara
    UPDATE profiles
    SET email_notifications = false
    WHERE id = v_uuid;
    
    IF FOUND THEN
        v_found := TRUE;
    END IF;
    
    RETURN v_found;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(TEXT) TO anon;

-- 4. Email template'lerini güncelle - "Abonelikten Çık" olarak değiştir
UPDATE email_templates 
SET body_html = REPLACE(body_html, 'Bildirimleri kapat', 'Abonelikten Çık')
WHERE body_html LIKE '%Bildirimleri kapat%';
