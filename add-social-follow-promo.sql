-- =============================================
-- Add social_follow_promo_enabled field to site_settings
-- Controls the animated "Bizi takip edin" social media promo
-- (sticky side button + periodic slide-in toast) on the public site.
-- =============================================

-- Add the column (defaults to true = enabled)
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS social_follow_promo_enabled BOOLEAN DEFAULT true;

-- Enable by default for the existing settings row
UPDATE site_settings SET social_follow_promo_enabled = true WHERE social_follow_promo_enabled IS NULL;
