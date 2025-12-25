-- EMAIL LOGS RLS POLİCY DÜZELTMESİ
-- Supabase SQL Editor'da çalıştırın

-- Email logs tablosu için policy'ler
DROP POLICY IF EXISTS "Admin can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admin can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Anyone can insert email logs" ON public.email_logs;

-- Admin email loglarını görebilir
CREATE POLICY "Admin can view email logs" ON public.email_logs
    FOR SELECT USING (is_admin(auth.uid()));

-- Authenticated users email log ekleyebilir
CREATE POLICY "Authenticated can insert email logs" ON public.email_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin artık eklensin
INSERT INTO public.admin_users (id, role)
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'engineerdemx@gmail.com'
ON CONFLICT (id) DO NOTHING;

SELECT COUNT(*) as admin_count FROM admin_users;
