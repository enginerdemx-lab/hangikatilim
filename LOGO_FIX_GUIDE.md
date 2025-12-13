# LOGO SORUNU ÇÖZÜM ADDUMLARI

## ❌ SORUN
Logolar kaydedilmiyor, siteye yansımıyor.

## ✅ ÇÖZÜM ADIMLARI

### ADIM 1: Supabase SQL Çalıştır
1. Supabase Dashboard → SQL Editor
2. Aşağıdaki SQL'i çalıştır:

```sql
-- dark_logo_url kolonunu ekle
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS dark_logo_url TEXT;

-- Mevcut logoyu dark mode için de kullan
UPDATE site_settings
SET dark_logo_url = logo_url
WHERE dark_logo_url IS NULL;

-- Verileri kontrol et
SELECT id, logo_url, dark_logo_url FROM site_settings;
```

### ADIM 2: Admin Panelde Logo Yükle
1. Admin → Site Ayarları
2. Logo seç → Yükle
3. **Kaydedilmemiş değişiklikler** uyarısı görmeli
4. **Değişiklikleri Kaydet** → **Evet, Kaydet**

### ADIM 3: Kontrol Et
1. Supabase → Table Editor → site_settings
2. `logo_url` ve `dark_logo_url` doldu mu kontrol et
3. Siteyi yenile (Ctrl+Shift+R)

## 🔍 HATA AYIKLAMA

### Hata: "Kaydet" çalışmıyor
- Console'da hata var mı?
- RLS policy bloke ediyor mu?

### Hata: Logo admin'de değişiyor ama sitede çıkmıyor
- Browser cache temizle
- `dist/` güncel mi kontrol et
