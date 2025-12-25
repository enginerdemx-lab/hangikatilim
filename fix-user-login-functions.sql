-- EKSİK FONKSİYONLAR - Üye Yönetimi için
-- Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. KULLANICI GİRİŞ GEÇMİŞİ FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_login_history(target_user_id UUID)
RETURNS TABLE(
    id UUID,
    login_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Giriş geçmişi tablosu yoksa boş dön
    -- Bu tablo ileride oluşturulabilir
    RETURN;
END;
$$;

-- =====================================================
-- 2. KULLANICI GİRİŞ SAYISI FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_login_count(
    target_user_id UUID,
    client_count OUT INTEGER,
    target_user_id2 UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Şimdilik sadece profiles tablosundaki login_count'u dön
    SELECT COALESCE(p.login_count, 0)
    INTO client_count
    FROM public.profiles p
    WHERE p.id = target_user_id;
    
    IF client_count IS NULL THEN
        client_count := 0;
    END IF;
    
    RETURN;
END;
$$;

-- Grant yetkiler
GRANT EXECUTE ON FUNCTION public.get_user_login_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_login_count(UUID, UUID) TO authenticated;

-- =====================================================
-- 3. DOĞRULAMA
-- =====================================================

SELECT 'Functions created successfully' as status;
