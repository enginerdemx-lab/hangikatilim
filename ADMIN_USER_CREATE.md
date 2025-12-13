# Admin Kullanıcı Oluşturma

## Supabase'de Admin Kullanıcı Oluştur

1. **Supabase Dashboard'a Git**:
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **Authentication > Users**:
   - "Add user" butonuna tıklayın
   - **Email**: admin e-posta adresinizi girin
   - **Password**: Güçlü bir şifre belirleyin (min 6 karakter)
   - "Create user" tıklayın

3. **Email Doğrulama** (Opsiyonel):
   - Auto Confirm User: ✅ İşaretleyin (email doğrulama olmadan giriş için)

## Test Et

1. Güncellenen dosyaları Natro'ya yükleyin:
   - `dist/` içeriğini → `public_html/`

2. Giriş test edin:
   - `https://hangikatilim.com/admin/login`
   - Email ve şifre ile giriş yapın
   - Başarılı olursa dashboard açılır

## Güvenlik Önerileri

- ✅ Güçlü şifre kullanın
- ✅ Email'i gizli tutun
- ✅ Supabase RLS policies aktif
- ⚠️ Public e-posta kullanmayın
