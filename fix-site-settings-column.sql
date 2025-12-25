-- ==========================================
-- FIX SITE SETTINGS MISSING COLUMN
-- Eksik logo_dark_url kolonu ekleme
-- ==========================================

-- Add missing column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'site_settings' AND column_name = 'logo_dark_url'
    ) THEN
        ALTER TABLE site_settings ADD COLUMN logo_dark_url TEXT;
    END IF;
END $$;

-- Update with default value if null
UPDATE site_settings 
SET logo_dark_url = logo_url 
WHERE logo_dark_url IS NULL AND logo_url IS NOT NULL;
