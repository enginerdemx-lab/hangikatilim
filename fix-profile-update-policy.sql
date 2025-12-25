-- PROFİL GÜNCELLEME İZNİ
-- Admin'in doğrudan profiles tablosunu güncellemesine izin ver
-- Supabase SQL Editor'da çalıştırın

-- Önce mevcut güncelleme policy'lerini kontrol et
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users and admins" ON public.profiles;

-- Kullanıcı kendi profilini güncelleyebilir VEYA admin herhangi birini güncelleyebilir
CREATE POLICY "Enable update for users and admins" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id  -- Kendi profili
        OR 
        EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())  -- Admin ise
    );

-- Admin tablosuna admin ekle
INSERT INTO public.admin_users (id, role)
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'engineerdemx@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Ayrıca engin@katilimuzmani.com'u da admin yap
INSERT INTO public.admin_users (id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'engin@katilimuzmani.com'
ON CONFLICT (id) DO NOTHING;

-- Doğrulama
SELECT 
    (SELECT COUNT(*) FROM admin_users) as admin_count,
    (SELECT string_agg(email, ', ') FROM auth.users u JOIN admin_users a ON u.id = a.id) as admin_emails;
