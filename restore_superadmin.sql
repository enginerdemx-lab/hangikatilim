-- ACİL DURUM: SUPERADMIN YETKİSİNİ GERİ VERME
-- Eğer kendi yetkinizi aldıysanız ve admin panele giremiyorsanız bu kodu çalıştırın.

-- enginerdemx@gmail.com kullanıcısını superadmin yap
UPDATE public.profiles
SET admin_role = 'superadmin'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'enginerdemx@gmail.com';

-- VEYA e-posta adresinizi buraya yazarak kendiniz çalıştırabilirsiniz:
-- UPDATE public.profiles
-- SET admin_role = 'superadmin'
-- FROM auth.users
-- WHERE profiles.id = auth.users.id
-- AND auth.users.email = 'SİZİN_EPOSTANIZ@ADRESİNİZ.COM';
