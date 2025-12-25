-- ADMIN PROFİL GÜNCELLEME - BASİTLEŞTİRİLMİŞ
-- Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. MEVCUT FONKSİYONU SİL VE YENİDEN OLUŞTUR
-- =====================================================

DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_user_admin(
    target_user_id UUID,
    new_full_name TEXT DEFAULT NULL,
    new_phone TEXT DEFAULT NULL,
    new_education_level TEXT DEFAULT NULL,
    new_employment_status TEXT DEFAULT NULL,
    new_profession TEXT DEFAULT NULL,
    new_work_experience TEXT DEFAULT NULL,
    new_monthly_income TEXT DEFAULT NULL,
    new_has_rent BOOLEAN DEFAULT NULL,
    new_rent_amount NUMERIC DEFAULT NULL,
    new_preferred_finance_company TEXT DEFAULT NULL,
    new_gender TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Admin kontrolü
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    -- Profili güncelle - SADECE verilen değerler
    UPDATE profiles
    SET
        full_name = COALESCE(new_full_name, full_name),
        phone = COALESCE(new_phone, phone),
        education_level = COALESCE(new_education_level, education_level),
        employment_status = COALESCE(new_employment_status, employment_status),
        profession = COALESCE(new_profession, profession),
        work_experience = COALESCE(new_work_experience, work_experience),
        monthly_income = COALESCE(new_monthly_income, monthly_income),
        has_rent = COALESCE(new_has_rent, has_rent),
        rent_amount = COALESCE(new_rent_amount, rent_amount),
        preferred_finance_company = COALESCE(new_preferred_finance_company, preferred_finance_company),
        gender = COALESCE(new_gender, gender),
        updated_at = NOW()
    WHERE id = target_user_id;
END;
$$;

-- Grant yetki
GRANT EXECUTE ON FUNCTION public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 2. TEST - FONKSİYON VAR MI KONTROL ET
-- =====================================================

SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_user_admin';
