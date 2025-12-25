-- Fix Security Advisor Warnings: Function Search Path Mutable
-- Run this in Supabase SQL Editor
-- This script DROPS and RECREATES functions to fix search_path issue

-- =====================================================
-- DROP EXISTING FUNCTIONS FIRST (with CASCADE for triggers)
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_login_history(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_status_admin(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.remove_user_avatar_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_users_admin() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.log_user_login() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =====================================================
-- RECREATE FUNCTIONS WITH search_path = ''
-- =====================================================

-- 1. get_user_login_history
CREATE OR REPLACE FUNCTION public.get_user_login_history(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    login_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ll.id,
        ll.user_id,
        ll.login_at,
        ll.ip_address,
        ll.user_agent
    FROM public.login_logs ll
    WHERE ll.user_id = p_user_id
    ORDER BY ll.login_at DESC
    LIMIT 50;
END;
$$;

-- 2. handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    next_member_number INT;
BEGIN
    SELECT COALESCE(MAX(member_number), 999) + 1 INTO next_member_number FROM public.profiles;
    
    INSERT INTO public.profiles (id, email, member_number, status, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        next_member_number,
        'active',
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- 3. update_user_status_admin
CREATE OR REPLACE FUNCTION public.update_user_status_admin(
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
        ban_reason = CASE WHEN p_status = 'banned' THEN p_ban_reason ELSE NULL END,
        banned_at = CASE WHEN p_status = 'banned' THEN NOW() ELSE NULL END
    WHERE id = p_user_id;
END;
$$;

-- 4. remove_user_avatar_admin
CREATE OR REPLACE FUNCTION public.remove_user_avatar_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET avatar_url = NULL
    WHERE id = p_user_id;
END;
$$;

-- 5. get_all_users_admin
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
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
    rent_amount NUMERIC,
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
        COALESCE(au.email, p.email)::TEXT as email,
        p.full_name,
        p.phone,
        p.avatar_url,
        p.member_number,
        COALESCE(p.status, 'active')::TEXT as status,
        p.ban_reason,
        p.banned_at,
        COALESCE(p.login_count, 0) as login_count,
        p.last_login_at,
        p.last_sign_in_ip,
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
    LEFT JOIN auth.users au ON p.id = au.id
    ORDER BY p.created_at DESC;
END;
$$;

-- 6. update_user_admin
CREATE OR REPLACE FUNCTION public.update_user_admin(
    p_user_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_education_level TEXT DEFAULT NULL,
    p_employment_status TEXT DEFAULT NULL,
    p_profession TEXT DEFAULT NULL,
    p_monthly_income TEXT DEFAULT NULL,
    p_has_rent BOOLEAN DEFAULT NULL,
    p_rent_amount NUMERIC DEFAULT NULL,
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

-- 7. log_user_login (trigger function)
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        login_count = COALESCE(login_count, 0) + 1,
        last_login_at = NOW(),
        last_sign_in_ip = NEW.last_sign_in_ip
    WHERE id = NEW.id;
    
    INSERT INTO public.login_logs (user_id, ip_address, user_agent)
    VALUES (NEW.id, NEW.last_sign_in_ip, NULL);
    
    RETURN NEW;
END;
$$;

-- 8. is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = user_id AND is_active = true
    );
END;
$$;

-- 9. update_updated_at_column (trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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
-- RECREATE TRIGGERS (they may have been dropped)
-- =====================================================

-- Recreate handle_new_user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Recreate log_user_login trigger
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.log_user_login();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_user_login_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_status_admin(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_avatar_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT, DATE) TO authenticated;
