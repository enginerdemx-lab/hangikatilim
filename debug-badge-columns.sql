-- STEP 1: Check if badge columns exist in site_settings
-- Run this in Supabase SQL Editor

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
AND column_name LIKE '%badge%';

-- STEP 2: See current badge URL values
SELECT 
    id,
    app_store_badge_url,
    google_play_badge_url,
    app_gallery_badge_url,
    show_app_store_badge,
    show_google_play_badge,
    show_app_gallery_badge
FROM site_settings
LIMIT 1;
