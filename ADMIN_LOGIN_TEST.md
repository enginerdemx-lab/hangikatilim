# Admin Login Test Rehberi

## ✅ Hazırlık Tamamlandı

Routing yapılandırması başarıyla tamamlandı. Artık admin paneline erişebilirsiniz!

## 🧪 Test Adımları

### 1. Admin Login Sayfasına Erişim

Tarayıcınızda şu adresi açın:
```
http://localhost:3000/admin/login
```

### 2. Beklenen Görünüm

Admin login sayfasında şunları görmelisiniz:
- ✨ Mavi-mor gradient arka plan
- 🔒 "Admin Girişi" başlığı
- 📧 E-posta input alanı
- 🔑 Şifre input alanı
- ▶️ "Giriş Yap" butonu
- © "Hangi Katılım. Tüm hakları saklıdır." footer metni

### 3. Giriş Yapma

Supabase'de oluşturduğunuz admin kullanıcı bilgileri ile giriş yapın:
- **E-posta**: Adım 6'da oluşturduğunuz e-posta
- **Şifre**: Adım 6'da belirlediğiniz şifre

### 4. Başarılı Giriş Sonrası

Giriş başarılı olursa:
- ✅ Otomatik olarak `/admin` (dashboard) sayfasına yönlendirileceksiniz
- ✅ Sol tarafta admin sidebar menüsünü göreceksiniz
- ✅ Dashboard'da istatistikler ve hızlı erişim linkleri olacak

## 🐛 Olası Hatalar ve Çözümleri

### Hata 1: "Missing Supabase environment variables"
**Çözüm**: 
- `.env` dosyasının proje kök dizininde olduğundan emin olun
- Dev server'ı yeniden başlatın (Ctrl+C, sonra `npm run dev`)

### Hata 2: "Invalid login credentials"
**Çözüm**:
- E-posta ve şifrenin doğru olduğundan emin olun
- Supabase Dashboard > Authentication > Users'da kullanıcının "Confirmed" olduğunu kontrol edin

### Hata 3: Sayfa yüklenmiyor / 404 hatası
**Çözüm**:
- Dev server'ın çalıştığından emin olun
- URL'nin doğru olduğunu kontrol edin: `http://localhost:3000/admin/login`
- Browser console'da (F12) hata mesajlarını kontrol edin

### Hata 4: Giriş sonrası dashboard yüklenmiyor
**Çözüm**:
- Browser console'da hata mesajlarını kontrol edin
- Supabase bağlantısının çalıştığını doğrulayın

## 📸 Test Sonucu

Test sonucunu bana bildirin:
- [ ] ✅ Login sayfası başarıyla yüklendi
- [ ] ✅ Giriş başarılı oldu
- [ ] ✅ Dashboard görüntülendi
- [ ] ❌ Hata aldım (hata mesajını paylaşın)

## 🎯 Sonraki Adımlar

Test başarılı olduktan sonra:
1. Kampanyalar modülünü test edelim
2. İlk firmayı ekleyelim
3. İlk kampanyayı oluşturalım
4. Kampanya görsellerini yükleyelim
