-- QUICK FIX: Drop all function versions and recreate
-- Run this FIRST to clear ambiguous functions

-- Drop all versions of update_user_admin
DROP FUNCTION IF EXISTS public.update_user_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT, DATE) CASCADE;

-- Now recreate the single correct version
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

-- Grant permission
GRANT EXECUTE ON FUNCTION public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT, DATE) TO authenticated;
