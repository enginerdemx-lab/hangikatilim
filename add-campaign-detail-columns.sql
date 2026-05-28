-- Kampanya detay sayfası için gerekli sütunlar
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS content TEXT;

-- slug için unique index (aynı slug kullanılmasın)
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_slug_unique ON campaigns(slug) WHERE slug IS NOT NULL;
