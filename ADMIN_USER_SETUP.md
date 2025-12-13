# Admin Kullanıcı Oluşturma Rehberi

## ❌ Sorun: "Invalid login credentials" Hatası

Bu hata, Supabase'de admin kullanıcının doğru oluşturulmadığı veya şifrenin yanlış olduğu anlamına gelir.

## ✅ Çözüm: Supabase'de Admin Kullanıcı Oluşturma

### Adım 1: Supabase Dashboard'a Gidin

1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin (hangi-katilim veya oluşturduğunuz isim)

### Adım 2: Mevcut Kullanıcıları Kontrol Edin

1. Sol menüden **Authentication** sekmesine tıklayın
2. **Users** alt sekmesine tıklayın
3. Listede kullanıcı var mı kontrol edin

### Adım 3: Yeni Admin Kullanıcı Oluşturun

1. **Add user** butonuna tıklayın (sağ üst köşe)
2. **Create new user** seçeneğini seçin
3. Aşağıdaki bilgileri girin:

```
Email: admin@hangikatilim.com
Password: Admin123!@# (veya güçlü bir şifre)
```

4. **ÖNEMLİ**: **Auto Confirm User** kutucuğunu ✅ **İŞARETLEYİN**
   - Bu kutucuk işaretli olmazsa, kullanıcı e-posta doğrulaması bekler
   - E-posta doğrulaması olmadan giriş yapamazsınız

5. **Create user** butonuna tıklayın

### Adım 4: Kullanıcının Durumunu Kontrol Edin

Kullanıcı listesinde yeni oluşturduğunuz kullanıcıyı görmelisiniz:
- **Email**: admin@hangikatilim.com
- **Status**: ✅ **Confirmed** (yeşil) olmalı
- Eğer **Waiting for verification** yazıyorsa, kullanıcıyı silip tekrar oluşturun ve **Auto Confirm User** kutucuğunu işaretlemeyi unutmayın

### Adım 5: Giriş Yapın

1. Tarayıcınızda `http://localhost:3000/admin/login` adresine gidin
2. Oluşturduğunuz bilgileri girin:
   - **E-posta**: admin@hangikatilim.com
   - **Şifre**: Admin123!@# (veya belirlediğiniz şifre)
3. **Giriş Yap** butonuna tıklayın

## 🎯 Beklenen Sonuç

Başarılı giriş sonrası:
- ✅ Otomatik olarak `/admin` (dashboard) sayfasına yönlendirileceksiniz
- ✅ Sol tarafta admin sidebar menüsünü göreceksiniz
- ✅ Dashboard'da "Hoş geldiniz!" mesajı ve istatistikler olacak

## 🐛 Hala Sorun mu Yaşıyorsunuz?

### Sorun 1: "Invalid login credentials" hatası devam ediyor
**Çözüm**:
- Şifreyi doğru girdiğinizden emin olun (büyük/küçük harf duyarlı)
- Supabase'de kullanıcının **Confirmed** durumunda olduğunu kontrol edin
- Farklı bir e-posta ve şifre ile yeni kullanıcı oluşturun

### Sorun 2: "User not found" hatası
**Çözüm**:
- Supabase'de kullanıcının oluşturulduğunu doğrulayın
- `.env` dosyasındaki Supabase URL ve Key'in doğru olduğunu kontrol edin

### Sorun 3: Console'da "Failed to fetch" hatası
**Çözüm**:
- İnternet bağlantınızı kontrol edin
- Supabase projesinin aktif olduğunu doğrulayın
- `.env` dosyasındaki URL'in doğru olduğunu kontrol edin

## 📝 Önerilen Admin Bilgileri

Güvenli bir şifre kullanın:
```
E-posta: admin@hangikatilim.com
Şifre: [En az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermeli]
```

**ÖNEMLİ**: Bu bilgileri güvenli bir yerde saklayın!

---

**Sonraki Adım**: Başarılı giriş yaptıktan sonra bana haber verin, kampanya ekleme işlemini gösterelim!
