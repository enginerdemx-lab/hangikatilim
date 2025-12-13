-- Tasarruf Finansman Firmalarını Ekle
INSERT INTO companies (name, description, founded_year, website_url, is_licensed, is_active) VALUES
('EMİNEVİM', 'Eminevim Tasarruf Finansman A.Ş. - Sektörün öncüsü olarak güvenilir kurumsal.', 1991, 'https://www.eminevim.com.tr', true, true),
('FUZUL EV', 'Fuzul Tasarruf Finansman A.Ş. - 35 yıl süreli fonlacıyla Türkiye''nin güvenilir markası.', 1992, 'https://www.fuzulev.com.tr', true, true),
('BİREVİM', 'Birevim Tasarruf Finansman A.Ş. - Yenilikçi tasarruf yöntemleri ve güçlü sermaye yapısı.', 2016, 'https://www.birevim.com.tr', true, true),
('KATILIMEVİM', 'Katılımevim Tasarruf Finansman A.Ş. - Faizsiz finansmanın güçlü adresi, halkın çok şeffaf yanı.', 2018, 'https://www.katilimevim.com.tr', true, true),
('SİNPAŞ', 'Sinpaş Yapi Tasarruf Sandığı A.Ş. - Gayrimenkul sektörünün devi Sinpaş güvencesiyle.', 2017, 'https://www.sinpas.com.tr', true, true),
('İMECE', 'İmece Tasarruf Finansman A.Ş. - Anadolu''nun İmece kültürünü finansmana buluşturan güç.', 2019, 'https://www.imecefinans.com.tr', true, true),
('ALBAYRAK', 'Albayrak Tasarruf Finansman A.Ş. - Albayrak ailesi güvencesiyle tasarruf finansmanı çözümleri.', 2023, 'https://www.albayrakfinans.com.tr', true, true),
('EMLAK KATILIM', 'Emlak Katılım Tasarruf Finansman A.Ş. - Emlak Katılım Bankası güvencesi ve tecrübesiyle.', 2018, 'https://www.emlakkatilim.com.tr', true, true),
('İYİ FİNANS', 'İyi Finans Tasarruf Finansman A.Ş. - Yenilikçi vizyonuyla sektöre değer katan finansman kuruluşu.', 2023, 'https://www.iyifinans.com.tr', true, true);

-- Firmaların eklendiğini kontrol edin
SELECT id, name, founded_year, is_active FROM companies ORDER BY name;
