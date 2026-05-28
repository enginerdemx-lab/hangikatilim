-- Veri Paylaşım Sözleşmesi (Data Sharing Agreement) için yeni alanlar
-- Tasarruf Finansman Şirketleri ile veri paylaşım onayı

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS data_sharing_text  text DEFAULT 'Veri Paylaşım Sözleşmesi',
  ADD COLUMN IF NOT EXISTS data_sharing_content text,
  ADD COLUMN IF NOT EXISTS data_sharing_url   text;

COMMENT ON COLUMN site_settings.data_sharing_text    IS 'Form içinde gösterilen link metni';
COMMENT ON COLUMN site_settings.data_sharing_content IS 'Modal içinde gösterilen resmi sözleşme metni (HTML destekli)';
COMMENT ON COLUMN site_settings.data_sharing_url     IS 'Opsiyonel: doldurulursa kullanıcı bu URL''ye yönlendirilir, boş bırakılırsa modal açılır';
