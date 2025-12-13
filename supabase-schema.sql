-- =====================================================
-- SUPABASE SCHEMA FOR ADMIN PANEL
-- =====================================================
-- This schema creates all tables, RLS policies, and storage buckets
-- for a single-admin content management system
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Returns true if user is authenticated (since we only have one admin)
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TABLE 1: SITE SETTINGS
-- =====================================================
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT NOT NULL DEFAULT 'Hangi Katılım',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  gradient_start TEXT DEFAULT '#3B82F6',
  gradient_end TEXT DEFAULT '#8B5CF6',
  default_seo_title TEXT,
  default_seo_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can update site settings"
  ON site_settings FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin can insert site settings"
  ON site_settings FOR INSERT
  WITH CHECK (is_admin());

-- Insert default site settings
INSERT INTO site_settings (site_name) VALUES ('Hangi Katılım');

-- =====================================================
-- TABLE 2: NAVIGATION ITEMS
-- =====================================================
CREATE TABLE nav_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  link TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for nav_items
ALTER TABLE nav_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active nav items"
  ON nav_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage nav items"
  ON nav_items FOR ALL
  USING (is_admin());

-- =====================================================
-- TABLE 3: TICKER ITEMS (Sektör Gündemi)
-- =====================================================
CREATE TABLE ticker_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for ticker_items
ALTER TABLE ticker_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active ticker items"
  ON ticker_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage ticker items"
  ON ticker_items FOR ALL
  USING (is_admin());

-- =====================================================
-- TABLE 4: HOME HERO
-- =====================================================
CREATE TABLE home_hero (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  background_image_url TEXT,
  background_gradient_start TEXT,
  background_gradient_end TEXT,
  cta1_label TEXT,
  cta1_link TEXT,
  cta2_label TEXT,
  cta2_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for home_hero
ALTER TABLE home_hero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view home hero"
  ON home_hero FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage home hero"
  ON home_hero FOR ALL
  USING (is_admin());

-- Insert default hero
INSERT INTO home_hero (title, subtitle) 
VALUES ('Hangi Katılım Bankası?', 'Size en uygun katılım bankası kampanyalarını karşılaştırın');

-- =====================================================
-- TABLE 5: CALCULATOR SETTINGS
-- =====================================================
CREATE TABLE calculator_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  default_amount INTEGER DEFAULT 50000,
  min_amount INTEGER DEFAULT 10000,
  max_amount INTEGER DEFAULT 1000000,
  min_vade INTEGER DEFAULT 3,
  max_vade INTEGER DEFAULT 36,
  description TEXT,
  help_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for calculator_settings
ALTER TABLE calculator_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view calculator settings"
  ON calculator_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage calculator settings"
  ON calculator_settings FOR ALL
  USING (is_admin());

-- Insert default calculator settings
INSERT INTO calculator_settings (default_amount, min_amount, max_amount, min_vade, max_vade)
VALUES (50000, 10000, 1000000, 3, 36);

-- =====================================================
-- TABLE 6: COMPANIES
-- =====================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  founded_year INTEGER,
  branch_count INTEGER,
  website_url TEXT,
  is_licensed BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active companies"
  ON companies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage companies"
  ON companies FOR ALL
  USING (is_admin());

-- =====================================================
-- TABLE 7: CAMPAIGNS (ÇOK ÖNEMLİ)
-- =====================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  badge_type TEXT CHECK (badge_type IN ('faizsiz_firsat', 'ozel_kampanya', 'sponsorlu')),
  vade_months INTEGER NOT NULL,
  amount_tl INTEGER NOT NULL,
  bullet_points TEXT[], -- Array of strings
  application_link TEXT,
  terms_link TEXT,
  image_url TEXT, -- KAMPANYA ÖZEL GÖRSELİ (firma logosundan ayrı)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active campaigns"
  ON campaigns FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage campaigns"
  ON campaigns FOR ALL
  USING (is_admin());

-- Index for performance
CREATE INDEX idx_campaigns_company ON campaigns(company_id);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);

-- =====================================================
-- TABLE 8: NEWS POSTS
-- =====================================================
CREATE TABLE news_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('sirket', 'mevzuat', 'sektor')),
  cover_image_url TEXT,
  summary TEXT,
  content TEXT,
  is_featured BOOLEAN DEFAULT false, -- Manşet mi?
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- RLS Policies for news_posts
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published news"
  ON news_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin can manage news"
  ON news_posts FOR ALL
  USING (is_admin());

-- Index for performance
CREATE INDEX idx_news_status ON news_posts(status);
CREATE INDEX idx_news_featured ON news_posts(is_featured);

-- =====================================================
-- TABLE 9: BLOG POSTS
-- =====================================================
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cover_image_url TEXT,
  author TEXT,
  content TEXT,
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- RLS Policies for blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published blogs"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin can manage blogs"
  ON blog_posts FOR ALL
  USING (is_admin());

-- Index for performance
CREATE INDEX idx_blog_status ON blog_posts(status);

-- =====================================================
-- TABLE 10: CONTACT SETTINGS
-- =====================================================
CREATE TABLE contact_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  phone TEXT,
  address TEXT,
  working_hours TEXT,
  map_embed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for contact_settings
ALTER TABLE contact_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view contact settings"
  ON contact_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage contact settings"
  ON contact_settings FOR ALL
  USING (is_admin());

-- Insert default contact settings
INSERT INTO contact_settings (email, phone) VALUES ('info@hangikatilim.com', '+90 XXX XXX XX XX');

-- =====================================================
-- TABLE 11: CONTACT MESSAGES
-- =====================================================
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('new', 'read', 'archived')) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view and manage messages"
  ON contact_messages FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can update messages"
  ON contact_messages FOR UPDATE
  USING (is_admin());

-- Index for performance
CREATE INDEX idx_messages_status ON contact_messages(status);

-- =====================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nav_items_updated_at BEFORE UPDATE ON nav_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ticker_items_updated_at BEFORE UPDATE ON ticker_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_home_hero_updated_at BEFORE UPDATE ON home_hero FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calculator_settings_updated_at BEFORE UPDATE ON calculator_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_posts_updated_at BEFORE UPDATE ON news_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_settings_updated_at BEFORE UPDATE ON contact_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS SETUP
-- =====================================================
-- Run these commands in Supabase Dashboard > Storage:
-- 
-- 1. Create bucket: "media" (public)
-- 2. Create folders:
--    - logos/
--    - campaign-images/
--    - blog-covers/
--    - news-covers/
--
-- Storage policies (apply in Storage > Policies):
--
-- Policy: "Public can view all media"
-- Bucket: media
-- Operation: SELECT
-- Policy: ALLOW ALL
--
-- Policy: "Admin can upload media"
-- Bucket: media
-- Operation: INSERT
-- Policy: (auth.uid() IS NOT NULL)
--
-- Policy: "Admin can delete media"
-- Bucket: media
-- Operation: DELETE
-- Policy: (auth.uid() IS NOT NULL)
--
-- =====================================================

-- =====================================================
-- SETUP INSTRUCTIONS
-- =====================================================
-- 1. Run this entire SQL script in Supabase SQL Editor
-- 2. Go to Authentication > Users and create your admin user
-- 3. Go to Storage and create "media" bucket with folders
-- 4. Copy your Supabase URL and anon key to .env file
-- 5. Start building the frontend!
-- =====================================================
