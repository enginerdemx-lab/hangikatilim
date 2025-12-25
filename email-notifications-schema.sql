-- E-POSTA BİLDİRİM SİSTEMİ - DÜZELTİLMİŞ
-- Supabase SQL Editor'da çalıştırın

-- =====================================================
-- 1. E-POSTA ŞABLONLARI TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. E-POSTA LOG TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. PROFILES TABLOSUNA ALAN EKLE
-- =====================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid();

-- =====================================================
-- 4. VARSAYILAN ŞABLONLAR
-- =====================================================

INSERT INTO public.email_templates (name, subject, body_html, body_text, variables) VALUES
(
    'welcome',
    'Katılım Uzmanı''na Hoş Geldiniz!',
    '<h1>Hoş Geldiniz!</h1><p>Merhaba {{full_name}},</p><p>Katılım Uzmanı ailesine hoş geldiniz. Hesabınız başarıyla oluşturuldu.</p><p>Saygılarımızla,<br>Katılım Uzmanı Ekibi</p>',
    'Merhaba {{full_name}}, Katılım Uzmanı ailesine hoş geldiniz.',
    '["full_name"]'::jsonb
),
(
    'new_campaign',
    'Yeni Kampanya: {{campaign_title}}',
    '<h1>Yeni Kampanya!</h1><p>Merhaba {{full_name}},</p><p>Yeni bir kampanya eklendi: <strong>{{campaign_title}}</strong></p><p>Detayları görmek için <a href="{{campaign_url}}">tıklayın</a>.</p><p><a href="{{unsubscribe_url}}">Abonelikten Çık</a></p>',
    'Merhaba {{full_name}}, Yeni kampanya: {{campaign_title}}',
    '["full_name", "campaign_title", "campaign_url", "unsubscribe_url"]'::jsonb
),
(
    'new_news',
    'Sektör Haberi: {{news_title}}',
    '<h1>Yeni Haber!</h1><p>Merhaba {{full_name}},</p><p>Yeni bir haber yayınlandı: <strong>{{news_title}}</strong></p><p>Okumak için <a href="{{news_url}}">tıklayın</a>.</p><p><a href="{{unsubscribe_url}}">Abonelikten Çık</a></p>',
    'Merhaba {{full_name}}, Yeni haber: {{news_title}}',
    '["full_name", "news_title", "news_url", "unsubscribe_url"]'::jsonb
),
(
    'bulk_notification',
    '{{subject}}',
    '<div>{{content}}</div><p><a href="{{unsubscribe_url}}">Abonelikten Çık</a></p>',
    '{{content}}',
    '["subject", "content", "unsubscribe_url"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. RLS POLİCY'LERİ (is_admin() kullanarak)
-- =====================================================

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admin full access for templates
DROP POLICY IF EXISTS "Admin can manage email templates" ON public.email_templates;
CREATE POLICY "Admin can manage email templates" ON public.email_templates
    FOR ALL USING ((SELECT public.is_admin((SELECT auth.uid()))));

-- Admin full access for logs
DROP POLICY IF EXISTS "Admin can view email logs" ON public.email_logs;
CREATE POLICY "Admin can view email logs" ON public.email_logs
    FOR ALL USING ((SELECT public.is_admin((SELECT auth.uid()))));

-- Users can view own logs
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
CREATE POLICY "Users can view own email logs" ON public.email_logs
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 6. E-POSTA GÖNDERME FONKSİYONU (RPC)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_notification_subscribers()
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    unsubscribe_token UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        au.email::TEXT,
        p.full_name,
        p.unsubscribe_token
    FROM public.profiles p
    JOIN auth.users au ON p.id = au.id
    WHERE p.email_notifications = true
    AND au.email_confirmed_at IS NOT NULL;
END;
$$;

-- Abonelikten çıkış fonksiyonu
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.profiles
    SET email_notifications = false
    WHERE unsubscribe_token = p_token;
    
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_notification_subscribers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(UUID) TO anon, authenticated;

-- =====================================================
-- 7. DOĞRULAMA
-- =====================================================

SELECT 'email_templates' as table_name, COUNT(*) as count FROM public.email_templates
UNION ALL
SELECT 'email_logs', COUNT(*) FROM public.email_logs;
