-- =====================================================
-- SUPABASE QUICK SETUP
-- Sadece eksik kolonları ekle (Tablolar zaten varsa)
-- =====================================================

-- =====================================================
-- 1. SITE SETTINGS: Footer kolonları
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

UPDATE site_settings 
SET 
  footer_description = COALESCE(footer_description, 'Türkiye''nin en kapsamlı tasarruf finansmanı hesaplama ve karşılaştırma platformu.'),
  footer_email = COALESCE(footer_email, 'info@hangikatilim.com'),
  copyright_text = COALESCE(copyright_text, 'Hangi Katılım © 2025');

-- =====================================================
-- 2. BLOG POSTS: Ek kolonlar
-- =====================================================
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS excerpt TEXT;

ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Index
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_active ON blog_posts(is_active);

-- =====================================================
-- 3. COMPANIES: Ek kolonlar
-- =====================================================
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_companies_order ON companies(display_order);

-- =====================================================
-- 4. CAMPAIGNS: Ek kolonlar
-- =====================================================
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON campaigns(is_featured);

-- =====================================================
-- 5. NEWS POSTS: Ek kolonlar
-- =====================================================
ALTER TABLE news_posts 
ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE news_posts 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_news_slug ON news_posts(slug);

-- =====================================================
-- TAMAMLANDI!
-- =====================================================
