-- Add legal document content fields and app store badge URLs
ALTER TABLE site_settings 
ADD COLUMN kvkk_content TEXT,
ADD COLUMN privacy_content TEXT,
ADD COLUMN terms_content TEXT,
ADD COLUMN cookie_content TEXT,
ADD COLUMN app_store_badge_url TEXT,
ADD COLUMN google_play_badge_url TEXT;
