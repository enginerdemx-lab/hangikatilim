-- =====================================================
-- Danışmanlık Talepleri — Yeni Alanlar
-- Date: 2026-05-12
-- Eklenenler: monthly_payment, city, district
-- =====================================================

ALTER TABLE public.consultation_requests
  ADD COLUMN IF NOT EXISTS monthly_payment bigint,
  ADD COLUMN IF NOT EXISTS city  text,
  ADD COLUMN IF NOT EXISTS district text;

-- İndeks (raporlama için)
CREATE INDEX IF NOT EXISTS idx_consultation_requests_city ON public.consultation_requests (city);
