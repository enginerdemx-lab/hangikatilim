-- E-POSTA ABONELERİ DÜZELTMESİ
-- Supabase SQL Editor'da çalıştırın

-- 1. Profiles tablosu yapısını kontrol et
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND table_schema = 'public';

-- 2. Profiles toplam sayısı
SELECT 'profiles_total' as info, COUNT(*) as count FROM profiles;

-- 3. Newsletter subscribers durumu
SELECT 'newsletter_total' as info, COUNT(*) as count FROM newsletter_subscribers;
SELECT 'newsletter_active' as info, COUNT(*) as count FROM newsletter_subscribers WHERE is_active = true;

-- ============================================
-- DÜZELTİM: Tüm üyelerin e-posta bildirimlerini aç
-- ============================================

-- email_notifications kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_notifications') THEN
        ALTER TABLE profiles ADD COLUMN email_notifications BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Tüm kullanıcılar için email bildirimlerini aç
UPDATE profiles 
SET email_notifications = true;

-- Sonucu doğrula
SELECT 'profiles_notifications_on' as info, COUNT(*) as count 
FROM profiles 
WHERE email_notifications = true;

-- Kullanıcıları göster (auth.users ile join)
SELECT 
    p.id,
    u.email,
    p.full_name,
    p.email_notifications
FROM profiles p
JOIN auth.users u ON p.id = u.id
LIMIT 20;
