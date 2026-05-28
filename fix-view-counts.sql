-- =============================================
-- Görüntülenme Sayacı Düzeltmesi
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştır
-- =============================================

-- 1. view_count sütunlarının var olduğundan emin ol
ALTER TABLE news_posts
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- 2. RPC Fonksiyonlarını yeniden oluştur (SECURITY DEFINER ile RLS'i atlar)
CREATE OR REPLACE FUNCTION increment_news_view_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE news_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = row_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_blog_view_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = row_id;
END;
$$;

-- 3. KRITIK: Anonim kullanıcılara fonksiyon çalıştırma izni ver
-- Bu olmadan frontend (anon key ile) bu fonksiyonları çağıramaz!
GRANT EXECUTE ON FUNCTION increment_news_view_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION increment_news_view_count(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION increment_blog_view_count(uuid) TO anon;
GRANT EXECUTE ON FUNCTION increment_blog_view_count(uuid) TO authenticated;

-- 4. Ayrıca blog_posts ve news_posts için UPDATE RLS policy ekle
-- (doğrudan güncelleme fallback'i için)
DO $$
BEGIN
  -- news_posts için update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'news_posts'
    AND policyname = 'Allow anon view count update'
  ) THEN
    CREATE POLICY "Allow anon view count update" ON news_posts
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  -- blog_posts için update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_posts'
    AND policyname = 'Allow anon view count update'
  ) THEN
    CREATE POLICY "Allow anon view count update" ON blog_posts
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
