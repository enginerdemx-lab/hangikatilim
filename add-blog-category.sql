-- Blog yazılarına kategori kolonu
-- Supabase > SQL Editor'da bir kez çalıştırın.

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS category TEXT;

-- (Opsiyonel) Mevcut yazıları varsayılan bir kategoriye atamak isterseniz:
-- UPDATE blog_posts SET category = 'Katılım Finansı' WHERE category IS NULL;
