-- TAM KAPSAMLI YETKİ DÜZELTMESİ
-- Bu SQL'i çalıştırarak tüm yetki sorunlarını çözün

-- 1. admin_role kolonu olduğundan emin ol
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_role VARCHAR(50) DEFAULT NULL;

-- 2. RLS Politikalarını Düzenle (Kişinin kendi rolünü görebilmesi için)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (çakışma olmasın)
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Yeni okuma politikası: Herkes kendi profilini görebilir (admin_role dahil)
CREATE POLICY "Users can see own profile" ON public.profiles
FOR SELECT
USING ( auth.uid() = id );

-- 3. Rol Güncelleme Fonksiyonu (SECURITY DEFINER ile RLS'i aşar)
CREATE OR REPLACE FUNCTION update_admin_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET admin_role = new_role
    WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_admin_role TO authenticated;

-- 4. Kullanıcı Listesi Fonksiyonu (Garantili admin_role dönüşü)
DROP FUNCTION IF EXISTS get_all_users_admin();

CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMPTZ,
    member_number INTEGER,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    status TEXT,
    ban_reason TEXT,
    created_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_sign_in_ip TEXT,
    login_count INTEGER,
    calculation_count BIGINT,
    admin_role TEXT,
    education_level TEXT,
    employment_status TEXT,
    profession TEXT,
    work_experience TEXT,
    monthly_income TEXT,
    has_rent BOOLEAN,
    rent_amount INTEGER,
    preferred_finance_company TEXT,
    gender TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        u.email::TEXT,
        u.email_confirmed_at,
        p.member_number,
        p.full_name::TEXT,
        p.phone::TEXT,
        p.avatar_url::TEXT,
        p.status::TEXT,
        p.ban_reason::TEXT,
        p.created_at,
        p.last_login_at,
        NULL::TEXT as last_sign_in_ip,
        p.login_count,
        (SELECT COUNT(*) FROM public.calculations c WHERE c.user_id = p.id)::BIGINT,
        p.admin_role::TEXT,
        p.education_level::TEXT,
        p.employment_status::TEXT,
        p.profession::TEXT,
        p.work_experience::TEXT,
        p.monthly_income::TEXT,
        p.has_rent,
        p.rent_amount,
        p.preferred_finance_company::TEXT,
        p.gender::TEXT
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users_admin TO authenticated;
