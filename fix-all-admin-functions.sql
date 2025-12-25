-- TÜM EKSİK FONKSİYONLARI DÜZELT
-- Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. TÜM SORUNLU FONKSİYONLARI SİL
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_login_history(UUID);
DROP FUNCTION IF EXISTS public.get_user_login_history(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_login_count(UUID);
DROP FUNCTION IF EXISTS public.get_user_login_count(UUID, UUID);

-- =====================================================
-- 2. GET_USER_LOGIN_HISTORY FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_login_history(
    target_user_id UUID,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    login_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Login history tablosu yoksa boş dön
    -- Şimdilik boş tablo döndür
    RETURN;
END;
$$;

-- =====================================================
-- 3. REMOVE_USER_AVATAR_ADMIN FONKSİYONU
-- =====================================================

DROP FUNCTION IF EXISTS public.remove_user_avatar_admin(UUID);

CREATE OR REPLACE FUNCTION public.remove_user_avatar_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    UPDATE profiles
    SET avatar_url = NULL, updated_at = NOW()
    WHERE id = target_user_id;
END;
$$;

-- =====================================================
-- 4. GRANT YETKİLER
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_user_login_history(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_avatar_admin(UUID) TO authenticated;

-- =====================================================
-- 5. DOĞRULAMA
-- =====================================================

SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_user_admin', 'get_user_login_history', 'remove_user_avatar_admin');
