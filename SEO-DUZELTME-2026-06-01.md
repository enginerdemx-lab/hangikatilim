# SEO / İndeksleme Düzeltmesi — 1 Haziran 2026

Çalışma emrindeki 3 sorunun **kod tarafı** tamamlandı. Hepsi tek bir rebuild'de toplanacak şekilde yapıldı. `tsc --noEmit`: **0 hata**.

---

## ⚠️ ÖNCE BUNU OKUYUN — REBUILD ŞART

Bu değişiklikler kaynak kodda. Google'ın gördüğü statik HTML'e yansıması için **kendi bilgisayarınızda** şu komutu çalıştırıp `dist/`'i Natro'ya yükleyin (sandbox'ta çalıştırılamaz: Supabase erişimi + Chromium gerekiyor, ayrıca buradaki `node_modules` Windows'a göre kurulu):

```bash
npm run build:seo      # vite build + prerender (canlı içerikle statik HTML)
```

Sonra `dist/` içeriğini `public_html` altına yükleyin (`.htaccess`, `app.html`, `api/`, klasörler dahil).

**Yükleme sonrası:** `public_html/sitemap-cache.xml` dosyasını **silin** (sitemap 1 saat cache'li; silmezseniz eski slash'sız URL'ler 1 saat daha görünür).

---

## Yapılanlar

### Sorun 1 — URL formu tutarsızlığı (slash) → tamamlandı
Her şey **slash'lı** forma (`/blog/x/`) standardize edildi. 301 yönlendirmeleri sunucudaki DirectorySlash'tan geliyordu (prerender klasörleri fiziksel dizin); artık sitemap ve canonical doğrudan 200 dönen slash'lı formu gösteriyor.

- `public/api/sitemap.php` — tüm `<loc>`'lara sonda `/` eklendi (statik + blog/haber detay). Ayrıca eksik olan **`/sss/`** sitemap'e eklendi.
- `src/hooks/usePageSeo.ts` — `canonical` artık **self-referencing slash'lı**; **`og:url` eklendi** (önceden hiç güncellenmiyordu, bu yüzden tüm sayfalarda `index.html`'deki ana sayfa değerinde kalıyordu — hub sayfalarının canonical'ı bu yüzden ana sayfayı gösteriyordu). Breadcrumb JSON-LD URL'leri de slash'lı.
- `BlogDetailPage / NewsDetailPage / CampaignDetailPage` — `pageUrl` slash'lı (canonical + og:url + JSON-LD hepsi bundan besleniyor).

### Sorun 2 — Kırık badge resimleri → rebuild bekliyor (kod değişikliği yok)
Footer'daki `renderAppBadge`, `enabled === false` olduğunda zaten `null` dönüyor (`PublicLayout.tsx`). App Store / Google Play admin'de "Pasif" yapıldığı için **rebuild sonrası statik HTML'den otomatik kalkacak**. Kod dokunulmadı.
- Not: Huawei **App Gallery** rozeti admin'de hâlâ "Aktif". Kullanmıyorsanız aynı sekmeden pasif yapın (bu bir DB/admin ayarı, koddan değiştirilmedi).

### Sorun 3 — Uzun başlıklar (>60) → tamamlandı
- Yeni yardımcı: `buildSeoTitle(base, suffix)` (`src/data/pageSeo.ts`). Kural: `başlık | tam ek` → sığmazsa `başlık | Katılım Uzmanı` → o da sığmazsa `başlık` → başlık tek başına >60 ise kelime sınırında kısaltılır. Hepsi **≤60 garanti**. Blog/haber/kampanya detaylarındaki `| Katılım Uzmanı Blog/Haberler/Kampanyalar` eki artık taşmıyor.
- Sabit sayfa başlıkları (`STATIC_PAGE_SEO`): 60'ı aşan **6 başlık** kısaltıldı (ana sayfa, kampanyalar, katılım-firmaları, sektör-haberleri, blog, sss). Hepsi artık ≤60.
- Admin sınırları:
  - Saf SEO başlığı alanları (Site Ayarları → SEO: "Varsayılan SEO Başlığı" + sayfa bazlı "Title Tag") → `maxLength=60` (sert) + canlı sayaç.
  - İçerik Yönetimi yazı **"Başlık"** alanları (Blog + Haber) → canlı `NN/60` sayaç + 60'ı geçince turuncu uyarı; **sert blok yok** (H1 başlığı uzun olabilsin, `<title>` zaten otomatik ≤60'a iniyor).

---

## Değişen dosyalar
```
public/api/sitemap.php
src/hooks/usePageSeo.ts
src/data/pageSeo.ts
src/pages/public/BlogDetailPage.tsx
src/pages/public/NewsDetailPage.tsx
src/pages/public/CampaignDetailPage.tsx
src/pages/admin/SiteSettings.tsx
src/pages/admin/Blog.tsx
src/pages/admin/News.tsx
```

## Yükleme sonrası doğrulama (canlıda)
```bash
# sitemap slash'lı mı + /sss var mı?
curl -s https://katilimuzmani.com/sitemap.xml | grep -o "<loc>[^<]*</loc>" | head

# canonical = sayfanın kendi slash'lı URL'si mi? (ana sayfayı göstermemeli)
curl -s https://katilimuzmani.com/katilim-firmalari/ | grep -o 'rel="canonical" href="[^"]*"'
curl -s https://katilimuzmani.com/katilim-firmalari/ | grep -o 'property="og:url" content="[^"]*"'

# slash'sız 301 mi dönüyor?
curl -sI https://katilimuzmani.com/blog | grep -i location
```
Sonra Search Console → URL Denetimi ile birkaç hub/detay sayfasında "Dizine eklenmeyi iste".

## Yapılmayan (opsiyonel)
- **İç linkleri slash'lı forma getirme** ("mümkünse" idi): yapılmadı. Kullanıcı gezinmesi client-side olduğu için 301 üretmez; yalnızca botun statik HTML'de takip ettiği `<a href>` zararsız bir 301'e düşer. Canonical + sitemap + 301 indekslemeyi zaten çözüyor. İstenirse ayrıca yapılabilir.
