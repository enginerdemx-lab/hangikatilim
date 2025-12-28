-- =============================================
-- Add sponsor_area_enabled field to site_settings
-- =============================================

-- Add the column (defaults to true = enabled)
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS sponsor_area_enabled BOOLEAN DEFAULT true;

-- Update existing row to enable by default
UPDATE site_settings SET sponsor_area_enabled = true WHERE sponsor_area_enabled IS NULL;
