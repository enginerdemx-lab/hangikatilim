-- Create tables for managing homepage content via admin panel
-- This migration creates 4 tables: how_it_works_steps, info_cards, licensed_companies, faq_items

-- 1. How It Works Steps (replaces HowItWorks component)
CREATE TABLE IF NOT EXISTS how_it_works_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_number INTEGER NOT NULL,
  icon_name TEXT, -- lucide icon name like 'Calculator', 'Search', 'CheckCircle'
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Info Cards (for sections like "Tasarruf Finansmanı Nedir?")
CREATE TABLE IF NOT EXISTS info_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section TEXT NOT NULL, -- 'savings_finance', 'how_it_works', etc
  icon_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Licensed Companies (BDDK companies)
CREATE TABLE IF NOT EXISTS licensed_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FAQ Items
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_how_it_works_active ON how_it_works_steps(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_info_cards_section ON info_cards(section, is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_licensed_companies_active ON licensed_companies(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_faq_items_active ON faq_items(is_active, order_index);

-- Insert default data for How It Works
INSERT INTO how_it_works_steps (step_number, icon_name, title, description, order_index) VALUES
(1, 'Calculator', 'Planını Oluştur', 'Rehberimizden sana en uygun tasarruf planını oluşturun, firmaları karşılaştırın.', 1),
(2, 'Search', 'Tasarrufa Başla', 'Platformuzdan tasarruf firması seçin ve size özel planı başlatın.', 2),
(3, 'Home', 'Teslimatı Al', 'Ister hemen ister vadede, tüm evler sizin yanızda olsun güvenle teslim alın.', 3);

-- Insert default data for Info Cards (Savings Finance section)
INSERT INTO info_cards (section, icon_name, title, description, order_index) VALUES
('savings_finance', 'Home', 'Gayrimenkul Tasarrufu', 'Belirli süre düzenli katkı payı yatırarak ev ya da işyerine sahip olabilirsiniz.', 1),
('savings_finance', 'FileText', 'Faizsiz Sistem', 'Ödediğiniz katkılar peşinat gibi işler. Kalan kısmı çekilişle veya vade sonunda teslim alırsınız.', 2),
('savings_finance', 'Shield', 'Yasal Teminat', 'İşlem güvenle BDDK lisansına sahip kurumlarla yapılır.', 3);

-- Insert default BDDK licensed companies
INSERT INTO licensed_companies (name, order_index) VALUES
('EMİNEVİM TASARRUF', 1),
('FUZUL TASARRUF FİNANSMAN A.Ş.', 2),
('EKE-AK KATI-EM', 3),
('KATI-İLKYUVAM', 4),
('SİMPAS YAPI', 5),
('İNSAAT TASARRUF', 6),
('HAFIZ TASARRUF FİNANSMAN A.Ş.', 7),
('ALFİNSA TASARRUF', 8),
('İK FİNANS TASARRUF', 9),
('NİRTAY TASARRUF', 10);

-- Insert default FAQ items
INSERT INTO faq_items (question, answer, category, order_index) VALUES
('Evim sistemi nedir ve güvenilir midir?', 'Evim sistemi "Tasarruf Finansmanı" adıyla bildiği ve BDDK lisansı ile çalışan kurumların taşınmaz satış sistemidir. Ödediğiniz tutarlar peşinat ve taksit niteliği taşır.', 'general', 1),
('Teslimata tarihi nasıl belirlenir?', 'Sistemlere göre değişir. Çekilişli sistemlerde kura başarısı önemlidir. Organize Evim sizi korumak için projede belirtilen teslimat süresinde garantili teslim alırsınız.', 'general', 2),
('Taksitleri ödememede zorlanırsam ne olur?', 'Hemen sözleşmeniz iptal edilmez. Ödeme güçlüğünde şirketlerle yeniden planlama yapma hakkınız vardır.', 'payment', 3),
('Sistemden ertelediğim zaman ücret alırlar mıyım?', 'Her şirketin kendine özgü kural ve şartları bulunur. Başvuru öncesi mutlaka sözleşmeyi inceleyin.', 'payment', 4),
('Organizasyon ücreti nedir?', 'Şirketlerin sistemlerini kurup yönetirken talep ettiği ücrettir. Genellikle katkı paylarının %10-15 arasındadır.', 'fees', 5);

COMMENT ON TABLE how_it_works_steps IS 'Stores "How It Works" steps displayed on homepage';
COMMENT ON TABLE info_cards IS 'Generic info cards for various homepage sections';
COMMENT ON TABLE licensed_companies IS 'BDDK licensed savings finance companies';
COMMENT ON TABLE faq_items IS 'Frequently Asked Questions';
