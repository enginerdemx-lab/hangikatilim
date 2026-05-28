-- =============================================
-- Sponsors Table for Calculator Sponsor Area
-- =============================================

-- Create sponsors table
CREATE TABLE sponsors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    title TEXT NOT NULL,
    description TEXT,
    cta_text TEXT DEFAULT 'Detayları Gör',
    cta_url TEXT NOT NULL,
    color TEXT DEFAULT 'from-blue-500 to-blue-600',
    is_active BOOLEAN DEFAULT true,
    order_no INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can view active sponsors)
CREATE POLICY "Sponsors are viewable by everyone" ON sponsors 
    FOR SELECT USING (true);

-- Admin full access policy (authenticated admins can manage)
CREATE POLICY "Authenticated users can manage sponsors" ON sponsors 
    FOR ALL USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Insert sample data
INSERT INTO sponsors (name, logo_url, title, description, cta_text, cta_url, color, is_active, order_no) VALUES
    ('Katılım Finans', NULL, 'Faizsiz Finansman Fırsatı', 'Özel kampanyalarla hayallerinize ulaşın.', 'Detayları Gör', '/kampanyalar', 'from-blue-500 to-blue-600', true, 1),
    ('Tasarruf Danışmanlık', NULL, 'Uzman Danışmanlık Hizmeti', 'Tasarruf planınızı profesyonellerle oluşturun.', 'Randevu Al', '/iletisim', 'from-green-500 to-green-600', true, 2),
    ('Karşılaştırma Merkezi', NULL, 'Tüm Firmaları Karşılaştırın', 'En uygun seçeneği keşfedin.', 'Karşılaştır', '/katilim-firmalari', 'from-purple-500 to-purple-600', true, 3);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sponsors_updated_at 
    BEFORE UPDATE ON sponsors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


