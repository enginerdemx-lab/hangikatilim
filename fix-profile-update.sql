-- PROFİL GÜNCELLEME SORUNLARINI DÜZELTME
-- Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. ADMIN TARAFINDAN KULLANICI GÜNCELLEME FONKSİYONU
-- =====================================================

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
SET search_path = ''
AS $$
BEGIN
    -- Admin kontrolü
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    -- Profili güncelle
    UPDATE public.profiles
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
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
END;
$$;

-- =====================================================
-- 2. KULLANICI KENDİ PROFİLİNİ GÜNCELLEME FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_own_profile(
    new_full_name TEXT DEFAULT NULL,
    new_phone TEXT DEFAULT NULL,
    new_birth_date DATE DEFAULT NULL,
    new_gender TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    UPDATE public.profiles
    SET
        full_name = COALESCE(new_full_name, full_name),
        phone = COALESCE(new_phone, phone),
        birth_date = COALESCE(new_birth_date, birth_date),
        gender = COALESCE(new_gender, gender),
        updated_at = NOW()
    WHERE id = current_user_id;
END;
$$;

-- =====================================================
-- 3. PROFİL RLS POLİTİKALARINI GÜNCELLE
-- =====================================================

-- Önce mevcut politikaları kaldır (varsa)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;

-- Kullanıcı kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin tüm profilleri güncelleyebilir
CREATE POLICY "Admin can update all profiles" ON public.profiles
    FOR UPDATE USING ((SELECT public.is_admin(auth.uid())));

-- =====================================================
-- 4. KAYIT SIRASINDA PROFİL OLUŞTURMA TRİGGER'I KONTROL
-- =====================================================

-- Yeni kullanıcı için profil oluşturan trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE 
            WHEN profiles.full_name IS NULL OR profiles.full_name = '' 
            THEN EXCLUDED.full_name 
            ELSE profiles.full_name 
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Trigger'ın var olduğundan emin ol
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. GRANT YETKİLER
-- =====================================================

GRANT EXECUTE ON FUNCTION public.update_user_admin(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT, DATE, TEXT) TO authenticated;

-- =====================================================
-- 6. DOĞRULAMA
-- =====================================================

SELECT 'Profile update functions created/updated successfully' as status;
