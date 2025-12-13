-- FIX RLS POLICY FOR LOGO LOADING
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON site_settings;
DROP POLICY IF EXISTS "allow_public_read" ON site_settings;

-- 2. Create simple public read policy
CREATE POLICY "site_settings_public_read"
  ON site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Admin policies (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_settings' 
    AND policyname = 'site_settings_admin_all'
  ) THEN
    EXECUTE 'CREATE POLICY site_settings_admin_all ON site_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
  END IF;
END $$;

-- 4. Test query
SELECT logo_url, dark_logo_url FROM site_settings;
