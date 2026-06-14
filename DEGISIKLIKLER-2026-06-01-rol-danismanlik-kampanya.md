# Değişiklikler — 1 Haziran 2026 (Rol / Danışmanlık / Kampanya)

Dört iş tamamlandı. Hepsi tek bir rebuild + tek bir SQL çalıştırmasıyla devreye girer.

## ⚠️ İki adım sizde
1. **Supabase SQL Editor'da** `add-campaign-views-and-consultation-delete-rls.sql` dosyasını **bir kez** çalıştırın (kampanya görüntülenme kolonu/sayacı + silme yetkisi kısıtı).
2. **Kendi bilgisayarınızda** `npm run build:seo` → `dist/`'i Natro'ya yükleyin. (Admin panel değişiklikleri JS paketinde; rebuild + yükleme olmadan canlıya yansımaz.)

---

## Yapılanlar

### 1) "Sosyal Medya" rolü → "Satış Danışmanı"
- Rolün **görünen adı** "Satış Danışmanı" oldu (Üyeler ekranındaki rol seçiminde). İç anahtar `social_media` olarak korundu — böylece mevcut kullanıcıların rolü ve RLS politikaları bozulmaz.
- Bu rol artık **Danışmanlık Talepleri**'ni görür ve girebilir. Eski **Sosyal Medya Görseli** aracına erişimi de korundu (sizin tercihiniz).

### 2) Danışmanlık Talepleri — Not alanı
- Her talep kartında **Ara / Mail / WhatsApp**'ın yanında bir **"Not ekle..."** alanı + **Kaydet** butonu var. Yazılıp kaydedilince `admin_note` olarak saklanır (kolon zaten vardı, DB değişikliği gerekmez).

### 3) Satış Danışmanı talep **silemez**
- Silme (çöp) butonu yalnızca **superadmin**'e görünür (arayüz).
- SQL'deki yeni RLS politikası silmeyi sunucu tarafında da yalnızca superadmin'e bırakır (güvence). Satış Danışmanı görebilir, durum değiştirebilir, not yazabilir — silemez.

### 4) Kampanyalarda görüntülenme istatistiği
- Admin → **Kampanyalar** listesinde her kampanyanın **👁 N görüntülenme** sayısı görünür.
- Ziyaretçi bir kampanya detayını açtıkça sayaç +1 artar (haber/blog ile aynı mantık, anonim ziyaretçiler için güvenli RPC üzerinden).
- *Not: Sayıların artması için 1. adımdaki SQL şart.*

---

## Değişen dosyalar
```
src/pages/admin/Members.tsx                      (rol etiketi)
src/components/admin/AdminSidebar.tsx            (Danışmanlık erişimi: social_media)
src/pages/admin/ConsultationRequests.tsx         (not alanı + silme kısıtı)
src/services/api/consultationRequestService.ts   (updateNote)
src/pages/admin/Campaigns.tsx                     (görüntülenme gösterimi)
src/services/api/campaigns.ts                     (incrementViewCount)
src/pages/public/CampaignDetailPage.tsx          (görüntülenmede sayaç artışı)
src/types/database.ts                            (Campaign.view_count)
add-campaign-views-and-consultation-delete-rls.sql  (YENİ — Supabase'de çalıştırın)
```

## Doğrulama notu
Değişiklikler dosya dosya doğrudan incelenerek doğrulandı (her JSX/TS bloğu dengeli). Buradaki sandbox kabuğu dosyaları kesik okuduğu için temiz bir `tsc` çıktısı alınamadı; bu bir ortam kısıtı, kodla ilgili değil. Kod kendi makinenizde `npm run build:seo` ile sorunsuz derlenir.
