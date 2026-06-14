-- =============================================
-- Social follow promo: admin-controllable timing
-- Adds frequency/timing columns to site_settings.
-- Run this in Supabase -> SQL Editor.
-- =============================================
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS social_follow_promo_initial_delay INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS social_follow_promo_interval      INTEGER DEFAULT 180,
  ADD COLUMN IF NOT EXISTS social_follow_promo_duration      INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS social_follow_promo_max_count     INTEGER DEFAULT 0;

-- Sensible defaults for the existing row (gentler than before: every 3 min)
UPDATE site_settings SET
  social_follow_promo_initial_delay = COALESCE(social_follow_promo_initial_delay, 15),
  social_follow_promo_interval      = COALESCE(social_follow_promo_interval, 180),
  social_follow_promo_duration      = COALESCE(social_follow_promo_duration, 7),
  social_follow_promo_max_count     = COALESCE(social_follow_promo_max_count, 0);
