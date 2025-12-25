-- ADMIN SİSTEMİ VE ABONE LİSTESİ DÜZELTMESİ v4
-- Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. ADMIN_USERS TABLOSU OLUŞTUR
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT USING (auth.uid() = id);

-- =====================================================
-- 2. MEVCUT ADMİNİ EKLE
-- =====================================================

DO $$
DECLARE
    admin_email TEXT := 'engineerdemx@gmail.com';
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    IF admin_id IS NOT NULL THEN
        INSERT INTO public.admin_users (id, role)
        VALUES (admin_id, 'super_admin')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 3. IS_ADMIN FONKSİYONUNU SİL VE YENİDEN OLUŞTUR
-- CASCADE ile bağımlı policy'leri de sil
-- =====================================================

DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE FUNCTION public.is_admin(user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    check_id UUID := COALESCE(user_id, auth.uid());
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users WHERE id = check_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;

-- =====================================================
-- 4. SİLİNEN POLİCY'LERİ YENİDEN OLUŞTUR
-- =====================================================

-- Email templates policies
DROP POLICY IF EXISTS "Admin can manage email templates" ON public.email_templates;
CREATE POLICY "Admin can manage email templates" ON public.email_templates
    FOR ALL USING (is_admin(auth.uid()));

-- Email logs policies
DROP POLICY IF EXISTS "Admin can view email logs" ON public.email_logs;
CREATE POLICY "Admin can view email logs" ON public.email_logs
    FOR SELECT USING (is_admin(auth.uid()));

-- Newsletter subscribers policies
DROP POLICY IF EXISTS "Admin can view all subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admin can view all subscribers" ON public.newsletter_subscribers
    FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admin can update subscribers" ON public.newsletter_subscribers
    FOR UPDATE USING (is_admin(auth.uid()));

-- Profiles admin policy
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
CREATE POLICY "Admin can update all profiles" ON public.profiles
    FOR UPDATE USING (is_admin(auth.uid()));

-- =====================================================
-- 5. UPDATE_USER_ADMIN FONKSİYONU
-- =====================================================

DROP FUNCTION IF EXISTS public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT) CASCADE;

CREATE FUNCTION public.update_user_admin(
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
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
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

GRANT EXECUTE ON FUNCTION public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT) TO authenticated;

-- =====================================================
-- 6. GET_ALL_SUBSCRIBERS FONKSİYONU
-- =====================================================

DROP FUNCTION IF EXISTS public.get_all_subscribers() CASCADE;

CREATE FUNCTION public.get_all_subscribers()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    source TEXT,
    is_member BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ns.id,
        ns.email,
        ns.name as full_name,
        ns.source,
        false as is_member
    FROM newsletter_subscribers ns
    WHERE ns.is_active = true
    
    UNION ALL
    
    SELECT 
        p.id,
        p.email,
        p.full_name,
        'member'::TEXT as source,
        true as is_member
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.email_notifications = true 
    AND u.email_confirmed_at IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_subscribers() TO authenticated;

-- =====================================================
-- 7. DOĞRULAMA
-- =====================================================

SELECT COUNT(*) as admin_count FROM admin_users;
