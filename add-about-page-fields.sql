-- Migration: Add About Page Fields to site_settings
-- Run this in Supabase SQL Editor

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS about_title TEXT DEFAULT 'Hakkımızda',
ADD COLUMN IF NOT EXISTS about_content TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS about_image_url TEXT,
ADD COLUMN IF NOT EXISTS about_mission TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS about_vision TEXT DEFAULT '';

-- Grant permissions
GRANT SELECT ON site_settings TO anon;
GRANT SELECT, UPDATE ON site_settings TO authenticated;
