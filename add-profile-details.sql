-- ================================================
-- PROFILE DETAILS - GENEL BİLGİLER
-- Kullanıcı profil detayları için yeni alanlar
-- ================================================

-- 1. Profiles tablosuna yeni sütunlar ekle
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT,
ADD COLUMN IF NOT EXISTS monthly_income TEXT,
ADD COLUMN IF NOT EXISTS has_rent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rent_amount INTEGER,
ADD COLUMN IF NOT EXISTS preferred_finance_company TEXT;

-- 2. Yorum ekle
COMMENT ON COLUMN public.profiles.education_level IS 'Eğitim durumu';
COMMENT ON COLUMN public.profiles.employment_status IS 'Çalışma durumu';
COMMENT ON COLUMN public.profiles.profession IS 'Meslek';
COMMENT ON COLUMN public.profiles.work_experience IS 'Toplam çalışma süresi';
COMMENT ON COLUMN public.profiles.monthly_income IS 'Aylık gelir aralığı';
COMMENT ON COLUMN public.profiles.has_rent IS 'Kira gideri var mı?';
COMMENT ON COLUMN public.profiles.rent_amount IS 'Kira tutarı (TL)';
COMMENT ON COLUMN public.profiles.preferred_finance_company IS 'Tercih edilen tasarruf finansman şirketi';

-- 3. get_all_users_admin fonksiyonunu güncelle (yeni alanlarla)
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
    calculation_count BIGINT,
    -- Yeni alanlar
    education_level TEXT,
    employment_status TEXT,
    profession TEXT,
    work_experience TEXT,
    monthly_income TEXT,
    has_rent BOOLEAN,
    rent_amount INTEGER,
    preferred_finance_company TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        u.email::TEXT,
        p.member_number,
        p.full_name::TEXT,
        p.phone::TEXT,
        p.avatar_url::TEXT,
        p.status::TEXT,
        p.ban_reason::TEXT,
        p.created_at,
        p.last_login_at,
        p.login_count,
        (SELECT COUNT(*) FROM public.calculations c WHERE c.user_id = p.id)::BIGINT as calculation_count,
        -- Yeni alanlar
        p.education_level::TEXT,
        p.employment_status::TEXT,
        p.profession::TEXT,
        p.work_experience::TEXT,
        p.monthly_income::TEXT,
        p.has_rent,
        p.rent_amount,
        p.preferred_finance_company::TEXT
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Permission
GRANT EXECUTE ON FUNCTION get_all_users_admin TO authenticated;
