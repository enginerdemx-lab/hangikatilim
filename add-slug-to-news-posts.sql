-- Add slug field to news_posts table for SEO-friendly URLs
-- Run this in Supabase SQL Editor

-- Add slug column to news_posts
ALTER TABLE news_posts 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_news_posts_slug ON news_posts(slug);

-- Update existing records with auto-generated slugs from title
-- This is a one-time migration for existing data
UPDATE news_posts 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(title, '[ğĞ]', 'g', 'g'),
                    '[üÜ]', 'u', 'g'
                ),
                '[şŞ]', 's', 'g'
            ),
            '[ıİ]', 'i', 'g'
        ),
        '[öÖ]', 'o', 'g'
    )
)
WHERE slug IS NULL;

-- Further clean up: remove special chars and replace spaces with hyphens
UPDATE news_posts 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(title, '[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]', '', 'g'),
            '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
    )
)
WHERE slug IS NULL OR slug = '';

-- Make slug not null after migration (optional, comment out if you want to allow null slugs)
-- ALTER TABLE news_posts ALTER COLUMN slug SET NOT NULL;

-- Verify the changes
SELECT id, title, slug FROM news_posts LIMIT 10;
