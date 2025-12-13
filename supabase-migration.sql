-- =====================================================
-- SUPABASE MIGRATION SCRIPT
-- Eksik olan tablo güncellemeleri ve iyileştirmeler
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- =====================================================

-- =====================================================
-- 1. SITE SETTINGS: Footer kolonları ekle
-- =====================================================
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS footer_description TEXT,
ADD COLUMN IF NOT EXISTS footer_email TEXT,
ADD COLUMN IF NOT EXISTS footer_phone TEXT,
ADD COLUMN IF NOT EXISTS footer_address TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS copyright_text TEXT;

-- Footer varsayılan değerleri
UPDATE site_settings 
SET 
  footer_description = 'Türkiye''nin en kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu. Hayallerinize faizsiz ulaşın.',
  footer_email = 'info@hangikatilim.com',
  copyright_text = 'Hangi Katılım Platformu © 2025'
WHERE footer_description IS NULL;

-- =====================================================
-- 2. BLOG POSTS: Eksik kolonları ekle
-- =====================================================

-- slug kolonu (unique)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- excerpt kolonu
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- is_active kolonu
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- author ve content NOT NULL
ALTER TABLE blog_posts 
ALTER COLUMN author SET NOT NULL,
ALTER COLUMN content SET NOT NULL;

-- published_at NOT NULL ve default
ALTER TABLE blog_posts 
ALTER COLUMN published_at SET NOT NULL,
ALTER COLUMN published_at SET DEFAULT NOW();

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_active ON blog_posts(is_active);

-- =====================================================
-- 3. COMPANIES_TABLOSU: Eksik kolon kontrolleri
-- =====================================================

-- is_active kolonu varsa kontrol et, yoksa ekle
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- display_order kolonu
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Companies için index
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_order ON companies(display_order);

-- =====================================================
-- 4. CAMPAIGNS TABLOSU: Ek kolonlar
-- =====================================================

-- is_featured kolonu (öne çıkan kampanyalar için)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- views counter (görüntülenme sayısı)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON campaigns(is_featured);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);

-- =====================================================
-- 5. NEWS POSTS: Ek özellikler
-- =====================================================

-- slug kolonu
ALTER TABLE news_posts 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- view_count
ALTER TABLE news_posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_news_slug ON news_posts(slug);
CREATE INDEX IF NOT EXISTS idx_news_active ON news_posts(is_active);

-- =====================================================
-- TAMAMLANDI!
-- =====================================================
-- Tüm migration işlemleri tamamlandı.
-- Kontrol için tabloları görüntüleyin:
--
-- SELECT * FROM site_settings;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'blog_posts';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies';
-- =====================================================
