-- Add customizable button text fields to campaigns table
ALTER TABLE campaigns 
ADD COLUMN application_button_text TEXT DEFAULT 'Hemen Başvur',
ADD COLUMN terms_button_text TEXT DEFAULT 'Koşulları İncele';
