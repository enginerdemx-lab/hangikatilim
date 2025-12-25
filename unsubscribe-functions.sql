-- ==========================================
-- UNSUBSCRIBE FUNCTION
-- Abonelik iptal fonksiyonu
-- ==========================================

-- Newsletter subscribers için unsubscribe
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_found BOOLEAN := FALSE;
BEGIN
    -- Newsletter subscribers tablosunda ara
    UPDATE newsletter_subscribers
    SET is_active = false
    WHERE unsubscribe_token = p_token;
    
    IF FOUND THEN
        v_found := TRUE;
    END IF;
    
    -- Profiles tablosunda da ara (üyeler için)
    UPDATE profiles
    SET email_notifications = false
    WHERE id IN (
        SELECT id FROM newsletter_subscribers WHERE unsubscribe_token = p_token
    );
    
    RETURN v_found;
END;
$$;

-- Yetkilendirme
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(TEXT) TO anon;

-- Abone silme fonksiyonu (admin için)
CREATE OR REPLACE FUNCTION public.delete_subscriber(p_subscriber_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Newsletter subscribers'dan sil
    DELETE FROM newsletter_subscribers WHERE id = p_subscriber_id;
    
    IF FOUND THEN
        RETURN TRUE;
    END IF;
    
    -- Profil ise sadece notifications'ı kapat
    UPDATE profiles
    SET email_notifications = false
    WHERE id = p_subscriber_id;
    
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_subscriber(UUID) TO authenticated;
