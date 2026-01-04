-- ADIM 1: Profiles tablosuna eksik kolonlari ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_number INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0;

-- ADIM 2: Trigger'i sil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ADIM 3: Yeni trigger olustur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    next_member INT;
BEGIN
    SELECT COALESCE(MAX(member_number), 999) + 1 INTO next_member FROM public.profiles;
    
    INSERT INTO public.profiles (id, email, full_name, member_number, status, login_count, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanici'),
        next_member,
        'active',
        0,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ADIM 4: Eksik profilleri doldur
INSERT INTO public.profiles (id, email, full_name, member_number, status, created_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Kullanici'),
    ROW_NUMBER() OVER (ORDER BY u.created_at) + (SELECT COALESCE(MAX(member_number), 999) FROM public.profiles),
    'active',
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
