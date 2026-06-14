-- Clear unused mobile app store settings from site_settings.
-- Run in Supabase SQL Editor to remove stale App Store / Google Play / App Gallery URLs.

UPDATE public.site_settings
SET
  app_store_url = NULL,
  google_play_url = NULL,
  app_gallery_url = NULL,
  app_store_badge_url = NULL,
  google_play_badge_url = NULL,
  app_gallery_badge_url = NULL,
  show_app_store_badge = false,
  show_google_play_badge = false,
  show_app_gallery_badge = false;

NOTIFY pgrst, 'reload schema';
