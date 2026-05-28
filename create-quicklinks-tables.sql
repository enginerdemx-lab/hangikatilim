-- =====================================================
-- QUICK LINKS FEATURE - Database Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Table 1: Quick Links Settings (Single Row)
CREATE TABLE IF NOT EXISTS home_quicklinks_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_title TEXT DEFAULT 'En Avantajlı Finansal Fırsatlar',
    section_subtitle TEXT DEFAULT 'Kıyasla, Yakala!',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO home_quicklinks_settings (section_title, section_subtitle, is_enabled)
VALUES ('En Avantajlı Finansal Fırsatlar', 'Kıyasla, Yakala!', true)
ON CONFLICT DO NOTHING;

-- Table 2: Quick Links Items
CREATE TABLE IF NOT EXISTS home_quicklinks_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Home',
    link_url TEXT NOT NULL DEFAULT '/',
    is_external BOOLEAN DEFAULT false,
    badge_text TEXT,
    is_active BOOLEAN DEFAULT true,
    order_no INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for home_quicklinks_settings
ALTER TABLE home_quicklinks_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view quicklinks settings" ON home_quicklinks_settings;
CREATE POLICY "Public can view quicklinks settings"
    ON home_quicklinks_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin can manage quicklinks settings" ON home_quicklinks_settings;
CREATE POLICY "Admin can manage quicklinks settings"
    ON home_quicklinks_settings FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for home_quicklinks_items
ALTER TABLE home_quicklinks_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active quicklinks items" ON home_quicklinks_items;
CREATE POLICY "Public can view active quicklinks items"
    ON home_quicklinks_items FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admin can manage quicklinks items" ON home_quicklinks_items;
CREATE POLICY "Admin can manage quicklinks items"
    ON home_quicklinks_items FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_home_quicklinks_settings_updated_at 
    BEFORE UPDATE ON home_quicklinks_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_quicklinks_items_updated_at 
    BEFORE UPDATE ON home_quicklinks_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO home_quicklinks_items (title, icon, link_url, is_external, order_no, is_active) VALUES
('Ev Kredisi', 'Home', '/kampanyalar?type=ev', false, 1, true),
('Araç Kredisi', 'Car', '/kampanyalar?type=arac', false, 2, true),
('Hesaplama', 'Calculator', '/#calculator', false, 3, true),
('Kampanyalar', 'Gift', '/kampanyalar', false, 4, true),
('Firmalar', 'Building2', '/katilim-firmalari', false, 5, true);

-- Verify
SELECT 'Settings:' as info, * FROM home_quicklinks_settings;
SELECT 'Items:' as info, * FROM home_quicklinks_items ORDER BY order_no;


