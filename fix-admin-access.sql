-- ==========================================
-- ADMIN TABLOSU ONARMA VE YETKİ VERME
-- ==========================================

-- 1. admin_users tablosu yoksa oluştur
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 'role' kolonu yoksa ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'role') THEN
        ALTER TABLE public.admin_users ADD COLUMN role TEXT DEFAULT 'admin';
    END IF;
END $$;

-- 3. 'is_active' kolonu yoksa ekle (HATA BURADAYDI)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
        ALTER TABLE public.admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. RLS Politikaları (Güvenlik)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;

CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT
    USING (auth.uid() = id); 
    -- Basitçe herkes kendi admin kaydını görebilsin şimdilik.

-- 5. Kullanıcıyı Admin Yap
DO $$
DECLARE
    -- E-POSTA ADRESİNİZİ BURAYA YAZIN
    target_email TEXT := 'engin@katilimuzmani.com'; 
    target_user_id UUID;
BEGIN
    -- Kullanıcı ID'sini bul
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- Admin tablosuna ekle (veya güncelle)
        INSERT INTO public.admin_users (id, role, is_active)
        VALUES (target_user_id, 'super_admin', true)
        ON CONFLICT (id) DO UPDATE
        SET is_active = true, role = 'super_admin';
        
        RAISE NOTICE 'Kullanıcı (%s) başarıyla admin yapıldı!', target_email;
    ELSE
        RAISE NOTICE 'HATA: %s e-posta adresiyle kayıtlı kullanıcı bulunamadı!', target_email;
    END IF;
END $$;

-- Sonucu gör
SELECT * FROM public.admin_users;
