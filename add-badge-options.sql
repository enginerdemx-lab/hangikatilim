-- Add badge_color and badge_animation columns to home_quicklinks_items table

ALTER TABLE home_quicklinks_items
ADD COLUMN IF NOT EXISTS badge_color TEXT DEFAULT 'slate',
ADD COLUMN IF NOT EXISTS badge_animation TEXT DEFAULT 'none';

-- Update any existing records to have default values
UPDATE home_quicklinks_items
SET badge_color = 'slate', badge_animation = 'none'
WHERE badge_color IS NULL OR badge_animation IS NULL;
