-- Fix site_settings columns used by the admin Site Settings page.
-- Run in Supabase SQL Editor if saving settings returns HTTP 400 / schema cache errors.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS dark_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS footer_description TEXT,
  ADD COLUMN IF NOT EXISTS footer_email TEXT,
  ADD COLUMN IF NOT EXISTS footer_phone TEXT,
  ADD COLUMN IF NOT EXISTS footer_address TEXT,
  ADD COLUMN IF NOT EXISTS app_store_url TEXT,
  ADD COLUMN IF NOT EXISTS google_play_url TEXT,
  ADD COLUMN IF NOT EXISTS app_gallery_url TEXT,
  ADD COLUMN IF NOT EXISTS app_store_badge_url TEXT,
  ADD COLUMN IF NOT EXISTS google_play_badge_url TEXT,
  ADD COLUMN IF NOT EXISTS app_gallery_badge_url TEXT,
  ADD COLUMN IF NOT EXISTS show_app_store_badge BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_google_play_badge BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_app_gallery_badge BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS kvkk_text TEXT DEFAULT 'KVKK Aydinlatma Metni',
  ADD COLUMN IF NOT EXISTS privacy_text TEXT DEFAULT 'Gizlilik Politikasi',
  ADD COLUMN IF NOT EXISTS terms_text TEXT DEFAULT 'Kullanim Kosullari',
  ADD COLUMN IF NOT EXISTS cookie_text TEXT DEFAULT 'Cerez Politikasi',
  ADD COLUMN IF NOT EXISTS kvkk_content TEXT,
  ADD COLUMN IF NOT EXISTS privacy_content TEXT,
  ADD COLUMN IF NOT EXISTS terms_content TEXT,
  ADD COLUMN IF NOT EXISTS cookie_content TEXT,
  ADD COLUMN IF NOT EXISTS data_sharing_text TEXT DEFAULT 'Veri Paylasim Sozlesmesi',
  ADD COLUMN IF NOT EXISTS data_sharing_content TEXT,
  ADD COLUMN IF NOT EXISTS data_sharing_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS copyright_text TEXT,
  ADD COLUMN IF NOT EXISTS ticker_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS gold_ons_price NUMERIC DEFAULT 2060,
  ADD COLUMN IF NOT EXISTS market_gold_change_rate NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_follow_promo_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_follow_promo_initial_delay INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS social_follow_promo_interval INTEGER DEFAULT 180,
  ADD COLUMN IF NOT EXISTS social_follow_promo_duration INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS social_follow_promo_max_count INTEGER DEFAULT 0;

UPDATE public.site_settings
SET
  show_app_store_badge = COALESCE(show_app_store_badge, true),
  show_google_play_badge = COALESCE(show_google_play_badge, true),
  show_app_gallery_badge = COALESCE(show_app_gallery_badge, true),
  ticker_active = COALESCE(ticker_active, true),
  gold_ons_price = COALESCE(gold_ons_price, 2060),
  social_follow_promo_enabled = COALESCE(social_follow_promo_enabled, true),
  social_follow_promo_initial_delay = COALESCE(social_follow_promo_initial_delay, 15),
  social_follow_promo_interval = COALESCE(social_follow_promo_interval, 180),
  social_follow_promo_duration = COALESCE(social_follow_promo_duration, 7),
  social_follow_promo_max_count = COALESCE(social_follow_promo_max_count, 0);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, UPDATE ON public.site_settings TO authenticated;

NOTIFY pgrst, 'reload schema';
