-- E-POSTA SİSTEMİ DÜZELTMELERİ
-- Eksik RPC fonksiyonları ve e-posta logları için
-- Supabase SQL Editor'da çalıştırın

-- =========================================
-- 1. get_notification_subscribers fonksiyonu
-- =========================================
DROP FUNCTION IF EXISTS public.get_notification_subscribers() CASCADE;

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
    -- Newsletter subscribers
    SELECT 
        ns.id,
        ns.email::TEXT,
        COALESCE(ns.name, '')::TEXT as full_name,
        ns.unsubscribe_token::TEXT
    FROM newsletter_subscribers ns
    WHERE ns.is_active = true
    
    UNION
    
    -- Kayıtlı üyeler (e-posta bildirimleri açık olanlar)
    SELECT 
        p.id,
        p.email::TEXT,
        COALESCE(p.full_name, '')::TEXT,
        NULL::TEXT as unsubscribe_token
    FROM profiles p
    WHERE p.email_notifications = true
    AND p.email IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_notification_subscribers() TO authenticated;

-- =========================================
-- 2. get_all_subscribers fonksiyonu (backup)
-- =========================================
DROP FUNCTION IF EXISTS public.get_all_subscribers() CASCADE;

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
    
    UNION
    
    -- Kayıtlı üyeler
    SELECT 
        p.id,
        p.email::TEXT,
        COALESCE(p.full_name, '')::TEXT,
        'member'::TEXT as source,
        true as is_member
    FROM profiles p
    WHERE p.email_notifications = true
    AND p.email IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_subscribers() TO authenticated;

-- =========================================
-- 3. email_logs tablosu kontrolü
-- =========================================
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    template_id UUID,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Authenticated can insert email logs" ON public.email_logs;

CREATE POLICY "Admin can view email logs" ON public.email_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
    );

CREATE POLICY "Authenticated can insert email logs" ON public.email_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================
-- 4. Doğrulama
-- =========================================
SELECT 
    'get_notification_subscribers' as func_name,
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_notification_subscribers') as exists
UNION ALL
SELECT 
    'get_all_subscribers',
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_all_subscribers');
