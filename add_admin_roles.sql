-- =====================================================
-- ROL BAZLI ERİŞİM KONTROLÜ - Supabase SQL Editor'da çalıştırın
-- =====================================================

-- 1. profiles tablosuna admin_role kolonu ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50) DEFAULT NULL;

-- 2. Mevcut admin kullanıcılarını superadmin yap
-- Kendi email adresinizi buraya yazın
UPDATE profiles SET admin_role = 'superadmin' WHERE email = 'engin@katilimuzmani.com';

-- 3. get_all_users_admin fonksiyonunu güncelle (admin_role alanını ekle)
-- Önce mevcut fonksiyonu sil (dönüş tipi değiştiği için gerekli)
DROP FUNCTION IF EXISTS get_all_users_admin();

CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id uuid,
    email text,
    email_confirmed_at timestamptz,
    member_number bigint,
    full_name text,
    phone text,
    avatar_url text,
    status text,
    ban_reason text,
    created_at timestamptz,
    last_login_at timestamptz,
    last_sign_in_ip text,
    login_count bigint,
    calculation_count bigint,
    admin_role text,
    education_level text,
    employment_status text,
    profession text,
    work_experience text,
    monthly_income text,
    has_rent boolean,
    rent_amount numeric,
    preferred_finance_company text,
    gender text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        au.email::text,
        au.email_confirmed_at,
        p.member_number,
        p.full_name::text,
        p.phone::text,
        p.avatar_url::text,
        p.status::text,
        p.ban_reason::text,
        p.created_at,
        p.last_login_at,
        p.last_sign_in_ip::text,
        COALESCE(p.login_count, 0)::bigint,
        COALESCE((SELECT COUNT(*) FROM calculations WHERE user_id = p.id), 0)::bigint,
        p.admin_role::text,
        p.education_level::text,
        p.employment_status::text,
        p.profession::text,
        p.work_experience::text,
        p.monthly_income::text,
        COALESCE(p.has_rent, false),
        p.rent_amount,
        p.preferred_finance_company::text,
        p.gender::text
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Roller:
-- 'superadmin' = Tüm admin paneline tam erişim
-- 'social_media' = Sadece Sosyal Medya Görseli Oluşturucu
-- 'news_editor' = Sadece Haberler
-- 'content_manager' = İçerik yönetimi alanları
-- NULL = Normal kullanıcı veya role atanmamış admin (tam erişim - geriye dönük uyumluluk)
