-- Add App Store links and legal text fields to site_settings
ALTER TABLE site_settings 
ADD COLUMN app_store_url TEXT,
ADD COLUMN google_play_url TEXT,
ADD COLUMN kvkk_text TEXT DEFAULT 'KVKK Aydınlatma Metni',
ADD COLUMN privacy_text TEXT DEFAULT 'Gizlilik Politikası',
ADD COLUMN terms_text TEXT DEFAULT 'Kullanım Koşulları',
ADD COLUMN cookie_text TEXT DEFAULT 'Çerez Politikası';
