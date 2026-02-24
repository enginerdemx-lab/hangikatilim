-- Adım 1: Sektör Haberleri tablosuna görüntülenme sayısı ekle
ALTER TABLE news_posts 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Adım 2: Blog tablosuna görüntülenme sayısı ekle
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- RPC Fonksiyonları (Güvenli bir şekilde sayacı artırmak için)

-- Sektör Haberleri için
CREATE OR REPLACE FUNCTION increment_news_view_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Güvenli, row level security atlar
AS $$
BEGIN
  UPDATE news_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = row_id;
END;
$$;

-- Blog Yazıları için
CREATE OR REPLACE FUNCTION increment_blog_view_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Güvenli, row level security atlar
AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = row_id;
END;
$$;
