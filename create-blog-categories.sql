-- ============================================
-- Blog Kategorileri (admin panelden yönetilebilir)
-- Supabase > SQL Editor'da bir kez çalıştırın.
-- ============================================

-- 1. Tablo
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (public blog sayfası kategori listesini gösterir)
DROP POLICY IF EXISTS "Public can read blog categories" ON public.blog_categories;
CREATE POLICY "Public can read blog categories"
    ON public.blog_categories FOR SELECT
    USING (true);

-- Sadece admin ekler/günceller/siler (blog_posts ile aynı is_admin() kontrolü)
DROP POLICY IF EXISTS "Admin can manage blog categories" ON public.blog_categories;
CREATE POLICY "Admin can manage blog categories"
    ON public.blog_categories FOR ALL
    USING (is_admin());

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_blog_categories_sort ON public.blog_categories(sort_order);

-- 4. updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_blog_categories_updated_at ON public.blog_categories;
CREATE TRIGGER set_blog_categories_updated_at
    BEFORE UPDATE ON public.blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_categories_updated_at();

-- 5. Mevcut sabit kategorileri aktar (varsa dokunma)
INSERT INTO public.blog_categories (name, sort_order) VALUES
    ('Katılım Finansı', 1),
    ('Yatırım', 2),
    ('Tasarruf', 3),
    ('Güncel Haberler', 4)
ON CONFLICT (name) DO NOTHING;

-- Kontrol
SELECT id, name, sort_order FROM public.blog_categories ORDER BY sort_order;
