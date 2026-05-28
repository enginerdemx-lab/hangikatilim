-- ===============================================
-- HANGI KATILIM - SUPABASE TABLOLARI
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- ===============================================

-- ===== FAQ ITEMS TABLOSU =====
DROP TABLE IF EXISTS faq_items;
CREATE TABLE faq_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read faq" ON faq_items
    FOR SELECT USING (true);

CREATE POLICY "Allow all for admin faq" ON faq_items
    FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


-- ===== INFO CARDS TABLOSU =====
DROP TABLE IF EXISTS info_cards;
CREATE TABLE info_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT,
    section TEXT DEFAULT 'main',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE info_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read info_cards" ON info_cards
    FOR SELECT USING (true);

CREATE POLICY "Allow all for admin info_cards" ON info_cards
    FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


-- ===== LICENSED COMPANIES TABLOSU (ŞİRKET LOGOLARI) =====
-- ÖNEMLİ: company_name ve logo_url kolonlarını kullanıyoruz!
DROP TABLE IF EXISTS licensed_companies;
CREATE TABLE licensed_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE licensed_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read licensed_companies" ON licensed_companies
    FOR SELECT USING (true);

CREATE POLICY "Allow all for admin licensed_companies" ON licensed_companies
    FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


-- ===== HOW IT WORKS STEPS TABLOSU =====
DROP TABLE IF EXISTS how_it_works_steps;
CREATE TABLE how_it_works_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE how_it_works_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read how_it_works" ON how_it_works_steps
    FOR SELECT USING (true);

CREATE POLICY "Allow all for admin how_it_works" ON how_it_works_steps
    FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


-- ===============================================
-- TEST VERİLERİ (OPSİYONEL)
-- ===============================================

-- FAQ test verileri
INSERT INTO faq_items (question, answer, order_index) VALUES
('Tasarruf finansmanı nedir?', 'Tasarruf finansmanı, bireylerin belirli bir süre düzenli ödemeler yaparak ev veya araç sahibi olmalarını sağlayan faizsiz bir sistemdir.', 0),
('Ne zaman teslim alırım?', 'Kura/çekiliş sistemiyle erken teslim alabilir veya vade sonunda garantili teslim alabilirsiniz.', 1);

-- Info Cards test verileri
INSERT INTO info_cards (title, description, icon_name, order_index) VALUES
('Faizsiz Sistem', 'Klasik kredilerden farklı olarak faiz ödemezsiniz.', 'Shield', 0),
('Erken Teslimat', 'Kura ile vadenizden önce teslim alabilirsiniz.', 'Truck', 1),
('BDDK Lisansı', 'Tüm işlemler BDDK tarafından denetlenmektedir.', 'Award', 2);

-- Licensed Companies test verileri
INSERT INTO licensed_companies (company_name, logo_url, order_index) VALUES
('Bereket Emeklilik', 'https://hangikatilim.com/images/companies/bereket.png', 0),
('Albayrak Katılım', 'https://hangikatilim.com/images/companies/albayrak.png', 1);

SELECT 'Tablolar başarıyla oluşturuldu!' AS sonuc;



