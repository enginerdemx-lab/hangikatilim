-- FINAL FIX V2: Removed last_sign_in_ip completely
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: DROP ALL ADMIN FUNCTIONS
-- =====================================================

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname IN (
            'update_user_admin',
            'get_all_users_admin',
            'update_user_status_admin',
            'remove_user_avatar_admin', 
            'is_admin',
            'handle_new_user',
            'log_user_login',
            'get_user_login_history',
            'update_updated_at_column'
        )
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: CREATE FUNCTIONS
-- =====================================================

-- 1. get_all_users_admin - FIXED (no last_sign_in_ip)
CREATE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    member_number INT,
    status TEXT,
    ban_reason TEXT,
    banned_at TIMESTAMPTZ,
    login_count INT,
    last_login_at TIMESTAMPTZ,
    last_sign_in_ip TEXT,
    created_at TIMESTAMPTZ,
    email_confirmed_at TIMESTAMPTZ,
    education_level TEXT,
    employment_status TEXT,
    profession TEXT,
    monthly_income TEXT,
    has_rent BOOLEAN,
    rent_amount INT,
    preferred_finance_company TEXT,
    gender TEXT,
    birth_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        au.email::TEXT,
        p.full_name,
        p.phone,
        p.avatar_url,
        p.member_number,
        COALESCE(p.status, 'active')::TEXT,
        p.ban_reason,
        NULL::TIMESTAMPTZ as banned_at,
        COALESCE(p.login_count, 0),
        p.last_login_at,
        NULL::TEXT as last_sign_in_ip,
        p.created_at,
        au.email_confirmed_at,
        p.education_level,
        p.employment_status,
        p.profession,
        p.monthly_income,
        p.has_rent,
        p.rent_amount,
        p.preferred_finance_company,
        p.gender,
        p.birth_date
    FROM public.profiles p
    JOIN auth.users au ON p.id = au.id
    ORDER BY p.created_at DESC;
END;
$$;

-- 2. update_user_status_admin
CREATE FUNCTION public.update_user_status_admin(
    p_user_id UUID,
    p_status TEXT,
    p_ban_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        status = p_status,
        ban_reason = CASE WHEN p_status = 'banned' THEN p_ban_reason ELSE NULL END
    WHERE id = p_user_id;
END;
$$;

-- 3. update_user_admin
CREATE FUNCTION public.update_user_admin(
    p_user_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_education_level TEXT DEFAULT NULL,
    p_employment_status TEXT DEFAULT NULL,
    p_profession TEXT DEFAULT NULL,
    p_monthly_income TEXT DEFAULT NULL,
    p_has_rent BOOLEAN DEFAULT NULL,
    p_rent_amount INT DEFAULT NULL,
    p_preferred_finance_company TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_birth_date DATE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        full_name = COALESCE(p_full_name, full_name),
        phone = COALESCE(p_phone, phone),
        education_level = COALESCE(p_education_level, education_level),
        employment_status = COALESCE(p_employment_status, employment_status),
        profession = COALESCE(p_profession, profession),
        monthly_income = COALESCE(p_monthly_income, monthly_income),
        has_rent = COALESCE(p_has_rent, has_rent),
        rent_amount = COALESCE(p_rent_amount, rent_amount),
        preferred_finance_company = COALESCE(p_preferred_finance_company, preferred_finance_company),
        gender = COALESCE(p_gender, gender),
        birth_date = COALESCE(p_birth_date, birth_date)
    WHERE id = p_user_id;
END;
$$;

-- 4. remove_user_avatar_admin
CREATE FUNCTION public.remove_user_avatar_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles SET avatar_url = NULL WHERE id = p_user_id;
END;
$$;

-- 5. is_admin
CREATE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE id = check_user_id AND is_active = true);
END;
$$;

-- 6. handle_new_user
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COALESCE(MAX(member_number), 999) + 1 INTO next_num FROM public.profiles;
    INSERT INTO public.profiles (id, member_number, status, created_at)
    VALUES (NEW.id, next_num, 'active', NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 7. log_user_login
CREATE FUNCTION public.log_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET login_count = COALESCE(login_count, 0) + 1,
        last_login_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

-- 8. update_updated_at_column
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 3: RECREATE TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.log_user_login();

-- =====================================================
-- STEP 4: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_status_admin(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT, TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_avatar_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- =====================================================
-- STEP 5: TEST
-- =====================================================

SELECT COUNT(*) as user_count FROM public.profiles;
SELECT id, email, full_name, member_number, status FROM public.get_all_users_admin() LIMIT 5;
