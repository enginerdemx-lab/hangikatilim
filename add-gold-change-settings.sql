-- Add market_gold_change_rate column to site_settings table
ALTER TABLE site_settings ADD COLUMN market_gold_change_rate NUMERIC DEFAULT NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
