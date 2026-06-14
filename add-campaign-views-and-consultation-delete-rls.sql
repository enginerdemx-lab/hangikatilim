-- ============================================================================
-- 1 Haziran 2026 — Kampanya görüntülenme sayacı + Danışmanlık silme yetkisi
--
-- Bu dosyayı Supabase Dashboard > SQL Editor'da BİR KEZ çalıştırın.
-- (Kod tarafı hazır; bu SQL olmadan kampanya görüntülenme sayısı artmaz ve
--  silme kısıtı veritabanı düzeyinde uygulanmaz.)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- A) KAMPANYA GÖRÜNTÜLENME SAYISI  (haber/blog ile aynı desen)
-- ----------------------------------------------------------------------------

-- Sütun
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Güvenli sayaç fonksiyonu (anonim ziyaretçiler de çağırabilsin diye SECURITY DEFINER;
-- RLS'i atlar, böylece görüntülenme herkesçe +1 yapılabilir ama başka bir şey değiştirilemez)
CREATE OR REPLACE FUNCTION increment_campaign_view_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE campaigns
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = row_id;
END;
$$;


-- ----------------------------------------------------------------------------
-- B) DANIŞMANLIK TALEPLERİ — SİLME YALNIZCA SUPERADMIN'E
--
-- Mevcut politika tüm "authenticated" kullanıcılara DELETE veriyordu; bu yüzden
-- "Satış Danışmanı" (admin_role = 'social_media') da silebiliyordu. Aşağıdaki
-- politika, silmeyi yalnızca admin_role = 'superadmin' olan kullanıcıya bırakır.
-- (Arayüzde silme butonu zaten gizlendi; bu, sunucu tarafı güvence içindir.)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can delete consultation requests" ON consultation_requests;
DROP POLICY IF EXISTS "Only superadmin can delete consultation requests"      ON consultation_requests;

CREATE POLICY "Only superadmin can delete consultation requests"
ON consultation_requests FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.admin_role = 'superadmin'
  )
);

-- Not: SELECT ve UPDATE politikaları aynı kalır — Satış Danışmanı talepleri
-- görebilir, durum değiştirebilir ve not yazabilir; yalnızca SİLEMEZ.
