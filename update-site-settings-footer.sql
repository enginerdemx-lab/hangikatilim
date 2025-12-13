-- Site Settings tablosuna footer kolonları ekle
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS footer_description TEXT,
ADD COLUMN IF NOT EXISTS footer_email TEXT,
ADD COLUMN IF NOT EXISTS footer_phone TEXT,
ADD COLUMN IF NOT EXISTS footer_address TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS copyright_text TEXT;

-- Varsayılan değerler ekle
UPDATE site_settings 
SET 
  footer_description = 'Türkiye''nin ilk kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu. Hayalinizdeki faizsiz ulaşın.',
  footer_email = 'info@hangikatilim.com',
  copyright_text = 'Hangi Katılım Platformu © 2025'
WHERE footer_description IS NULL;

-- Kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
  AND column_name LIKE '%footer%' OR column_name LIKE '%_url'
ORDER BY ordinal_position;
