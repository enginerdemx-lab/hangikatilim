-- Blog Posts tablosunu güncelle
-- Eksik kolonları ekle

-- 1. slug kolonu ekle (unique olmalı)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. excerpt kolonu ekle
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- 3. is_active kolonu ekle
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. author ve content kolonlarını NOT NULL yap
ALTER TABLE blog_posts 
ALTER COLUMN author SET NOT NULL,
ALTER COLUMN content SET NOT NULL;

-- 5. published_at kolonunu NOT NULL yap ve default ekle
ALTER TABLE blog_posts 
ALTER COLUMN published_at SET NOT NULL,
ALTER COLUMN published_at SET DEFAULT NOW();

-- 6. Eski status kolonunu kaldır (opsiyonel)
-- ALTER TABLE blog_posts DROP COLUMN IF EXISTS status;

-- 7. RLS policy'leri güncelle
DROP POLICY IF EXISTS "Public can view published blogs" ON blog_posts;
DROP POLICY IF EXISTS "Admin can manage blogs" ON blog_posts;

CREATE POLICY "Public can view active blogs"
  ON blog_posts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage blogs"
  ON blog_posts FOR ALL
  USING (is_admin());

-- 8. Index ekle
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_active ON blog_posts(is_active);

-- Kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY ordinal_position;
