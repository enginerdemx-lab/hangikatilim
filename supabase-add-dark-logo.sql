-- Add dark mode logo column to site_settings
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS dark_logo_url TEXT;

-- Update existing records to use same logo for dark mode as light mode initially
UPDATE site_settings
SET dark_logo_url = logo_url
WHERE dark_logo_url IS NULL AND logo_url IS NOT NULL;
