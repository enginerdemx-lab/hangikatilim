-- =====================================================
-- FIX: Calculator Settings RLS + Max Amount Update
-- =====================================================

-- 1. TÜM mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Admin can manage calculator settings" ON calculator_settings;
DROP POLICY IF EXISTS "Public can view calculator settings" ON calculator_settings;
DROP POLICY IF EXISTS "Admin can update calculator settings" ON calculator_settings;
DROP POLICY IF EXISTS "Admin can insert calculator settings" ON calculator_settings;
DROP POLICY IF EXISTS "Admin can delete calculator settings" ON calculator_settings;

-- 2. Doğru policy'leri oluştur
CREATE POLICY "Public can view calculator settings"
  ON calculator_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can update calculator settings"
  ON calculator_settings FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin can insert calculator settings"
  ON calculator_settings FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin can delete calculator settings"
  ON calculator_settings FOR DELETE
  USING (is_admin());

-- 3. Max amount'u 8.000.000'a güncelle
UPDATE calculator_settings SET max_amount = 8000000;

-- Kontrol
SELECT id, default_amount, min_amount, max_amount, min_vade, max_vade FROM calculator_settings;
