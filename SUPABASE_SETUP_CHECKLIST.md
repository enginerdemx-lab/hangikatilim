# Supabase Kurulum Adımları - Checklist

Bu dosyayı takip ederek Supabase kurulumunu tamamlayın. Her adımı tamamladıkça işaretleyin.

## ✅ Adım 1: Supabase Projesi Oluşturma

- [ ] 1.1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
- [ ] 1.2. Hesabınızla giriş yapın (yoksa ücretsiz hesap oluşturun)
- [ ] 1.3. **"New Project"** butonuna tıklayın
- [ ] 1.4. Aşağıdaki bilgileri girin:
  - **Name**: hangi-katilim (veya istediğiniz isim)
  - **Database Password**: Güçlü bir şifre belirleyin (KAYDEDIN!)
  - **Region**: Europe (Frankfurt) veya size en yakın bölge
  - **Pricing Plan**: Free tier
- [ ] 1.5. **"Create new project"** butonuna tıklayın
- [ ] 1.6. Projenin hazır olmasını bekleyin (~2 dakika)

---

## ✅ Adım 2: SQL Schema'yı Çalıştırma

- [ ] 2.1. Sol menüden **"SQL Editor"** sekmesine tıklayın
- [ ] 2.2. **"New query"** butonuna tıklayın
- [ ] 2.3. `supabase-schema.sql` dosyasını açın
- [ ] 2.4. Tüm içeriği kopyalayın (Ctrl+A, Ctrl+C)
- [ ] 2.5. SQL Editor'e yapıştırın (Ctrl+V)
- [ ] 2.6. **"RUN"** butonuna tıklayın (veya Ctrl+Enter)
- [ ] 2.7. Başarı mesajını kontrol edin: "Success. No rows returned"
- [ ] 2.8. Sol menüden **"Table Editor"** sekmesine gidin
- [ ] 2.9. Şu tabloların oluşturulduğunu doğrulayın:
  - [ ] site_settings
  - [ ] nav_items
  - [ ] ticker_items
  - [ ] home_hero
  - [ ] calculator_settings
  - [ ] companies
  - [ ] campaigns
  - [ ] news_posts
  - [ ] blog_posts
  - [ ] contact_settings
  - [ ] contact_messages

---

## ✅ Adım 3: Storage Bucket Oluşturma

- [ ] 3.1. Sol menüden **"Storage"** sekmesine tıklayın
- [ ] 3.2. **"Create a new bucket"** butonuna tıklayın
- [ ] 3.3. Bucket bilgilerini girin:
  - **Name**: media
  - **Public bucket**: ✅ İŞARETLEYİN (önemli!)
- [ ] 3.4. **"Create bucket"** butonuna tıklayın
- [ ] 3.5. Bucket'ın oluşturulduğunu doğrulayın

> **Not**: Klasörler (logos/, campaign-images/, vb.) otomatik olarak ilk dosya yüklendiğinde oluşturulacak.

---

## ✅ Adım 4: API Keys Alma

- [ ] 4.1. Sol menüden **"Settings"** (⚙️) sekmesine tıklayın
- [ ] 4.2. **"API"** alt sekmesine tıklayın
- [ ] 4.3. Aşağıdaki bilgileri kopyalayın:

### Project URL
```
https://xxxxxxxxxxxxxxxxx.supabase.co
```
- [ ] 4.4. **Project URL**'i kopyalayın (yanındaki copy ikonuna tıklayın)

### Anon (public) Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- [ ] 4.5. **anon public** key'i kopyalayın

---

## ✅ Adım 5: Environment Variables Ayarlama

- [ ] 5.1. Proje kök dizininde `.env` dosyası oluşturun
- [ ] 5.2. Aşağıdaki içeriği yapıştırın:

```env
VITE_SUPABASE_URL=BURAYA_PROJECT_URL_YAPIŞTIRIN
VITE_SUPABASE_ANON_KEY=BURAYA_ANON_KEY_YAPIŞTIRIN
```

- [ ] 5.3. `BURAYA_PROJECT_URL_YAPIŞTIRIN` yerine Adım 4.4'te kopyaladığınız URL'i yapıştırın
- [ ] 5.4. `BURAYA_ANON_KEY_YAPIŞTIRIN` yerine Adım 4.5'te kopyaladığınız key'i yapıştırın
- [ ] 5.5. Dosyayı kaydedin (Ctrl+S)

### Örnek `.env` dosyası:
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg0NzY4MDAsImV4cCI6MjAwNDAzMjgwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ✅ Adım 6: Admin Kullanıcı Oluşturma

- [ ] 6.1. Supabase Dashboard'da sol menüden **"Authentication"** sekmesine tıklayın
- [ ] 6.2. **"Users"** alt sekmesine tıklayın
- [ ] 6.3. **"Add user"** butonuna tıklayın
- [ ] 6.4. **"Create new user"** seçeneğini seçin
- [ ] 6.5. Admin bilgilerini girin:
  - **Email**: admin@hangikatilim.com (veya istediğiniz e-posta)
  - **Password**: Güçlü bir şifre belirleyin (KAYDEDIN!)
  - **Auto Confirm User**: ✅ İŞARETLEYİN
- [ ] 6.6. **"Create user"** butonuna tıklayın
- [ ] 6.7. Kullanıcının oluşturulduğunu doğrulayın

> **ÖNEMLİ**: Bu sistem TEK ADMIN için tasarlanmıştır. Sadece bir kullanıcı oluşturun.

---

## ✅ Adım 7: Kurulumu Test Etme

- [ ] 7.1. Terminal'de dev server'ı başlatın:
```bash
npm run dev
```

- [ ] 7.2. Tarayıcınızda `http://localhost:5173/admin/login` adresine gidin
- [ ] 7.3. Adım 6'da oluşturduğunuz e-posta ve şifre ile giriş yapın
- [ ] 7.4. Başarılı giriş sonrası admin dashboard'a yönlendirildiğinizi doğrulayın
- [ ] 7.5. Sol menüden **"Kampanyalar"** sekmesine tıklayın
- [ ] 7.6. Sayfanın hatasız yüklendiğini doğrulayın

---

## 🎉 Kurulum Tamamlandı!

Tüm adımları tamamladıysanız, Supabase kurulumunuz başarıyla tamamlanmıştır.

### Sonraki Adımlar:
1. ✅ İlk firmayı ekleyin (Firmalar modülü)
2. ✅ İlk kampanyayı oluşturun (Kampanyalar modülü)
3. ✅ Kampanya görsellerini yükleyin
4. ✅ Public sayfalarınızı test edin

### Sorun mu yaşıyorsunuz?

**"Missing Supabase environment variables" hatası**
- `.env` dosyasının proje kök dizininde olduğundan emin olun
- Variable isimlerinin `VITE_` ile başladığını kontrol edin
- Dev server'ı yeniden başlatın (Ctrl+C, sonra `npm run dev`)

**Giriş yapamıyorum**
- E-posta ve şifrenin doğru olduğundan emin olun
- Supabase Dashboard > Authentication > Users'da kullanıcının "Confirmed" olduğunu kontrol edin
- Browser console'da (F12) hata mesajlarını kontrol edin

**Tablolar görünmüyor**
- SQL schema'nın tamamen çalıştırıldığından emin olun
- Supabase Dashboard > Table Editor'de tabloları kontrol edin
- Hata varsa SQL Editor'de tekrar çalıştırın

---

**Hazırlayan**: Antigravity AI Assistant  
**Tarih**: 12 Aralık 2024
