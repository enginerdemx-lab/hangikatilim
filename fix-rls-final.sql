-- SON ÇÖZÜM: RLS Policy'leri tamamen yenile

-- 1. Mevcut tüm policy'leri sil
DROP POLICY IF EXISTS "Enable read access for all users" ON site_settings;
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Admin can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Admin can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Enable all for admins" ON site_settings;

-- 2. RLS'i kapat ve aç (reset)
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Basit policy ekle - HERKES OKUYABİLİR
CREATE POLICY "allow_public_read"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

-- 4. Admin UPDATE
CREATE POLICY "allow_admin_update"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 5. Admin INSERT  
CREATE POLICY "allow_admin_insert"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- 6. Test et
SELECT logo_url, dark_logo_url FROM site_settings;
