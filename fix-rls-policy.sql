-- LOGO OKUMA SORUNU ÇÖZÜMÜ
-- RLS Policy'i kontrol et ve düzelt

-- 1. Mevcut policy'leri göster
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'site_settings';

-- 2. Eğer public SELECT policy yoksa, ekle:
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;

CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  USING (true);

-- 3. Admin UPDATE policy
DROP POLICY IF EXISTS "Admin can update site settings" ON site_settings;

CREATE POLICY "Admin can update site settings"
  ON site_settings FOR UPDATE
  USING (is_admin());

-- 4. Admin INSERT policy
DROP POLICY IF EXISTS "Admin can insert site settings" ON site_settings;

CREATE POLICY "Admin can insert site settings"
  ON site_settings FOR INSERT
  WITH CHECK (is_admin());

-- 5. Kontrol et
SELECT * FROM site_settings;
