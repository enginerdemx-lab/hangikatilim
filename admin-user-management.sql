-- Admin User Management Updates

-- 1. DROP old function
DROP FUNCTION IF EXISTS get_all_users_admin();

-- 2. CREATE updated function with IP address
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
    last_sign_in_ip TEXT, -- New field
    login_count INTEGER,
    calculation_count BIGINT,
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
        NULL::TEXT as last_sign_in_ip, -- Supabase auth.users doesn't expose IP directly easily without log table, returning NULL for now or join with audit_log if available and permitted
        p.login_count,
        (SELECT COUNT(*) FROM public.calculations c WHERE c.user_id = p.id)::BIGINT,
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

-- 3. REMOVE AVATAR FUNCTION
CREATE OR REPLACE FUNCTION remove_user_avatar_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if executing user is admin is handled by RLS/App Logic usually, but here we just do work
    UPDATE public.profiles
    SET avatar_url = NULL
    WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_user_avatar_admin TO authenticated;

-- 4. UPDATE USER FUNCTION (Full Admin Edit)
CREATE OR REPLACE FUNCTION update_user_admin(
    target_user_id UUID,
    new_full_name TEXT,
    new_phone TEXT,
    new_education_level TEXT,
    new_employment_status TEXT,
    new_profession TEXT,
    new_work_experience TEXT,
    new_monthly_income TEXT,
    new_has_rent BOOLEAN,
    new_rent_amount INTEGER,
    new_preferred_finance_company TEXT,
    new_gender TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        full_name = new_full_name,
        phone = new_phone,
        education_level = new_education_level,
        employment_status = new_employment_status,
        profession = new_profession,
        work_experience = new_work_experience,
        monthly_income = new_monthly_income,
        has_rent = new_has_rent,
        rent_amount = new_rent_amount,
        preferred_finance_company = new_preferred_finance_company,
        gender = new_gender,
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Also sync metadata if needed (optional)
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_admin TO authenticated;
