-- NEWSLETTER ABONELİK SİSTEMİ
-- Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. NEWSLETTER ABONELERİ TABLOSU (Misafir ziyaretçiler için)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    unsubscribe_token UUID DEFAULT gen_random_uuid(),
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    source VARCHAR(50) DEFAULT 'footer' -- footer, popup, etc.
);

-- =====================================================
-- 2. RLS POLİCY'LERİ
-- =====================================================

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Herkes abone olabilir (insert)
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- Sadece admin tüm aboneleri görebilir
DROP POLICY IF EXISTS "Admin can view all subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admin can view all subscribers" ON public.newsletter_subscribers
    FOR SELECT USING ((SELECT public.is_admin((SELECT auth.uid()))));

-- Admin güncelleyebilir
DROP POLICY IF EXISTS "Admin can update subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admin can update subscribers" ON public.newsletter_subscribers
    FOR UPDATE USING ((SELECT public.is_admin((SELECT auth.uid()))));

-- =====================================================
-- 3. ABONE OLMA FONKSİYONU (Public RPC)
-- =====================================================

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'footer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_existing_id UUID;
BEGIN
    -- E-posta formatını kontrol et
    IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Geçersiz e-posta adresi');
    END IF;
    
    -- Zaten abone mi kontrol et
    SELECT id INTO v_existing_id 
    FROM public.newsletter_subscribers 
    WHERE email = LOWER(TRIM(p_email));
    
    IF v_existing_id IS NOT NULL THEN
        -- Varsa ve pasifse tekrar aktifleştir
        UPDATE public.newsletter_subscribers 
        SET is_active = true, unsubscribed_at = NULL, subscribed_at = NOW()
        WHERE id = v_existing_id AND is_active = false;
        
        IF FOUND THEN
            RETURN jsonb_build_object('success', true, 'message', 'Aboneliğiniz yeniden aktifleştirildi');
        END IF;
        
        RETURN jsonb_build_object('success', false, 'error', 'Bu e-posta zaten kayıtlı');
    END IF;
    
    -- Yeni abone ekle
    INSERT INTO public.newsletter_subscribers (email, name, source)
    VALUES (LOWER(TRIM(p_email)), TRIM(p_name), p_source);
    
    RETURN jsonb_build_object('success', true, 'message', 'Başarıyla abone oldunuz');
END;
$$;

-- =====================================================
-- 4. ABONELİKTEN ÇIKMA FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.newsletter_subscribers
    SET is_active = false, unsubscribed_at = NOW()
    WHERE unsubscribe_token = p_token AND is_active = true;
    
    RETURN FOUND;
END;
$$;

-- =====================================================
-- 5. TÜM ABONELERİ GETİR (Admin için + Profile aboneleri dahil)
-- =====================================================

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
SET search_path = ''
AS $$
BEGIN
    -- Hem newsletter_subscribers hem de profiles tablosundan birleştir
    RETURN QUERY
    -- Newsletter aboneleri (misafirler)
    SELECT 
        ns.id,
        ns.email::TEXT,
        ns.name::TEXT as full_name,
        ns.source::TEXT,
        false as is_member
    FROM public.newsletter_subscribers ns
    WHERE ns.is_active = true
    
    UNION ALL
    
    -- Üye aboneler (profiles tablosundan)
    SELECT 
        p.id,
        au.email::TEXT,
        p.full_name::TEXT,
        'member'::TEXT as source,
        true as is_member
    FROM public.profiles p
    JOIN auth.users au ON p.id = au.id
    WHERE p.email_notifications = true
    AND au.email_confirmed_at IS NOT NULL;
END;
$$;

-- Grant yetkiler
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_subscribers() TO authenticated;

-- =====================================================
-- 6. DOĞRULAMA
-- =====================================================

SELECT 'newsletter_subscribers' as table_name, COUNT(*) as count FROM public.newsletter_subscribers;
