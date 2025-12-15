-- Add toggle fields and App Gallery columns to site_settings
-- Run this migration in Supabase SQL Editor

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS show_app_store_badge BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_google_play_badge BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_app_gallery_badge BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS app_gallery_url TEXT,
ADD COLUMN IF NOT EXISTS app_gallery_badge_url TEXT;
