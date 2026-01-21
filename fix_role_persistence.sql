-- ROL SORUNU DÜZELTME
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- 1. Kolon var mı kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'admin_role';

-- 2. RPC fonksiyonunu güncelle (admin_role dahil)
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

-- 3. Test - admin_role geri dönüyor mu?
SELECT id, email, admin_role FROM get_all_users_admin() WHERE admin_role IS NOT NULL LIMIT 5;
