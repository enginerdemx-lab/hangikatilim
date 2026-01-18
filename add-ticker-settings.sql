-- Add ticker settings to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS ticker_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gold_ons_price NUMERIC DEFAULT 2060;

COMMENT ON COLUMN site_settings.ticker_active IS 'Toggle for the top market ticker';
COMMENT ON COLUMN site_settings.gold_ons_price IS 'Manual ONS price for Gold/TRY calculation';
