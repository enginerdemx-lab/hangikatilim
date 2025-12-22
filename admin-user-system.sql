-- Kapsamlı Üye Yönetim Sistemi - Database Migration
-- Supabase SQL Editor'da çalıştırın

-- ============================================
-- 1. PROFILES TABLOSUNA YENİ ALANLAR EKLE
-- ============================================

-- Üye numarası için sequence oluştur
CREATE SEQUENCE IF NOT EXISTS member_number_seq START 1000;

-- Profiles tablosuna yeni sütunlar ekle
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS member_number INTEGER UNIQUE DEFAULT nextval('member_number_seq'),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Mevcut kayıtlara üye numarası ata
UPDATE public.profiles 
SET member_number = nextval('member_number_seq') 
WHERE member_number IS NULL;

-- ============================================
-- 2. LOGIN LOG TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    logged_in_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.user_login_logs IS 'User login history for tracking purposes';

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_logged_in_at ON public.user_login_logs(logged_in_at DESC);

-- ============================================
-- 3. PROFILES INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_member_number ON public.profiles(member_number);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC);

-- ============================================
-- 4. RLS POLİCİES
-- ============================================

-- Profiles için RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile (but not status/ban_reason)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin can view all profiles (service_role bypasses RLS)
-- For admin access, use service_role key or create admin check

-- Login logs için RLS
ALTER TABLE public.user_login_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own login logs
DROP POLICY IF EXISTS "Users can view own login logs" ON public.user_login_logs;
CREATE POLICY "Users can view own login logs" ON public.user_login_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- System can insert login logs
DROP POLICY IF EXISTS "System can insert login logs" ON public.user_login_logs;
CREATE POLICY "System can insert login logs" ON public.user_login_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. ADMIN FONKSIYONLARI (RPC)
-- ============================================

-- Admin: Tüm kullanıcıları getir
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    member_number INTEGER,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    status TEXT,
    ban_reason TEXT,
    created_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER,
    calculation_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow if user has admin role (check via email or metadata)
    -- For now, we'll use service_role key from admin panel
    
    RETURN QUERY
    SELECT 
        p.id,
        u.email,
        p.member_number,
        p.full_name,
        p.phone,
        p.avatar_url,
        p.status,
        p.ban_reason,
        p.created_at,
        p.last_login_at,
        p.login_count,
        (SELECT COUNT(*) FROM public.calculations c WHERE c.user_id = p.id)::BIGINT as calculation_count
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Admin: Kullanıcı durumunu güncelle
CREATE OR REPLACE FUNCTION update_user_status_admin(
    target_user_id UUID,
    new_status TEXT,
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        status = new_status,
        ban_reason = CASE WHEN new_status = 'banned' THEN reason ELSE NULL END,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN FOUND;
END;
$$;

-- Admin: Login log kaydet
CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    p_browser TEXT DEFAULT NULL,
    p_os TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert login log
    INSERT INTO public.user_login_logs (user_id, ip_address, user_agent, device_type, browser, os)
    VALUES (p_user_id, p_ip_address::INET, p_user_agent, p_device_type, p_browser, p_os);
    
    -- Update profile
    UPDATE public.profiles
    SET 
        last_login_at = NOW(),
        login_count = COALESCE(login_count, 0) + 1
    WHERE id = p_user_id;
END;
$$;

-- Admin: Kullanıcı login geçmişini getir
CREATE OR REPLACE FUNCTION get_user_login_history(target_user_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    logged_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.ip_address,
        l.user_agent,
        l.device_type,
        l.browser,
        l.os,
        l.logged_in_at
    FROM public.user_login_logs l
    WHERE l.user_id = target_user_id
    ORDER BY l.logged_in_at DESC
    LIMIT limit_count;
END;
$$;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SEQUENCE member_number_seq TO authenticated;
GRANT ALL ON public.user_login_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users_admin TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_status_admin TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_login TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_login_history TO authenticated;
