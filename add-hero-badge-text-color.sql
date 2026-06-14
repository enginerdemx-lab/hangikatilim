-- Hero rozet ("Katılım Uzmanı ile Geleceği Planla") yazı rengi kolonu
-- Supabase > SQL Editor'da bir kez çalıştırın.

ALTER TABLE home_hero
  ADD COLUMN IF NOT EXISTS badge_text_color TEXT;

-- Mevcut kayıtlar için varsayılan: beyaz (eski görünüm korunur)
UPDATE home_hero
  SET badge_text_color = '#FFFFFF'
  WHERE badge_text_color IS NULL;
