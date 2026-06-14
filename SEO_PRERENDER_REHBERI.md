# Katılım Uzmanı — AdSense / CSR Düzeltmesi (Prerender) Rehberi

**Branch:** `seo-prerender`  ·  **Yöntem:** Build-time prerender (statik HTML üretimi) + sayfa bazlı benzersiz SEO
**Tasarım, içerik, hesaplama araçları ve canlı veriler korunmuştur.** Hiçbir bileşen, stil veya iş mantığı silinmemiş/yeniden yazılmamıştır.

---

## 1. Sorun ve Çözüm (özet)

**Sorun:** Site bir React SPA (Vite). Sunucudan gelen ham HTML'de `<div id="root">` boştu; tüm içerik tarayıcıda JavaScript ile üretiliyordu. AdSense botu (ve JS çalıştırmayan arama botları) **bomboş bir sayfa** görüyordu → "Düşük değerli içerik" reddi. Ayrıca tüm sayfalar **aynı `<title>` ve aynı meta description**'ı paylaşıyordu.

**Çözüm:** Mevcut yapı korunarak, `vite build` sonrasında **headless Chrome** ile her sayfa gerçek bir ziyaretçi gibi render edilir ve **çıktısı statik HTML olarak diske yazılır**. Böylece:

- Sunucudan gelen ham HTML artık **JS çalışmadan da gerçek metin** içerir (bot bunu görür).
- Her sayfanın **benzersiz `<title>` ve meta description**'ı olur.
- Kullanıcının tarayıcısında SPA yine açılır; **canlı veriler (döviz/altın/tarih, listeler) yeniden çekilir** — yani statik anlık görüntü "donmuş" kalmaz.

> Neden Next.js değil? Hosting (Natro / LiteSpeed) paylaşımlı ve **Node çalıştırmıyor**; Next.js SSR mümkün değil, statik export ise tüm uygulamanın yeniden yazımı = yüksek risk. Prerender, mevcut koda neredeyse hiç dokunmadan aynı hedefe ulaşır.

---

## 2. Ham HTML Kanıtı (JavaScript kapalıyken)

Aşağıdaki ölçümler, sunucudan gelen ham HTML'in `<div id="root">` gövdesinden **hiç JS çalıştırılmadan** çıkarılmıştır (botun gördüğü hâl).

**ÖNCE (mevcut SPA kabuğu):** `<body>` görünür metin = **0 karakter** → sorunun ta kendisi.

**SONRA (prerender edilmiş sayfalar):**

| Sayfa | URL | Ham HTML gövde metni | Benzersiz `<title>` |
|---|---|---:|---|
| Ana Sayfa | `/` | **6.202 karakter** | Katılım Uzmanı \| Tasarruf Finansmanı ve Faizsiz Ödeme Planı Hesaplama |
| Katılım Firmaları | `/katilim-firmalari` | 1.258 krk | Katılım Firmaları \| Tasarruf Finansmanı Şirketleri Karşılaştırma … |
| Blog | `/blog` | 1.073 krk | Blog \| Tasarruf Finansmanı Rehberleri ve Faizsiz Finans … |
| Sektör Haberleri | `/sektor-haberleri` | 969 krk | Sektör Haberleri \| Tasarruf Finansmanı ve Katılım Gündemi … |
| Hakkımızda | `/hakkimizda` | 802 krk | Hakkımızda \| Katılım Uzmanı |
| İletişim | `/iletisim` | 988 krk | İletişim \| Katılım Uzmanı'na Ulaşın |
| Kampanyalar | `/kampanyalar` | 1.290 krk | Kampanyalar \| Güncel Tasarruf Finansmanı Fırsatları … |
| S.S.S | `/sss` | 1.116 krk | Sıkça Sorulan Sorular \| Tasarruf Finansmanı Rehberi … |

→ **8/8 sayfada benzersiz title ve benzersiz meta description.**

**Ana sayfa ham metninden örnek (JS kapalı):**
> "…Hesaplama Aracı — Tasarruf finansmanı hesaplama aracı ile peşinat, vade, teslimat tarihi ve aylık ödeme tutarlarını anında öğrenin. Ne almak istiyorsunuz? Tümü / Gayrimenkul / İş Yeri / Araç / Çekilişli Sistem / Çekilişsiz Sistem…"

> ⚠️ **Önemli not:** Bu kanıt, **Supabase erişimi olmayan izole bir ortamda** üretildi; bu yüzden veritabanından gelen **dinamik listeler boş** geldi ("Gündem yüklenemedi", "İçerik yüklenemedi" gibi) ve karakter sayıları düşük göründü. **Canlı sunucuda `npm run build:seo` çalıştırdığınızda** (Supabase erişilebilir olduğu için) bu sayılar çok daha yüksek olur, tüm firma/blog/haber **detay sayfaları da otomatik statik üretilir** ve listeler dolu gelir.

---

## 3. Doğrulama Sonuçları (gerçek tarayıcıda test edildi)

| Kontrol | Sonuç |
|---|---|
| Hydration uyuşmazlığı (console) | **0** (createRoot kullanıldığı için imkânsız) |
| React hata/uyarı | **0** |
| İçerik titremesi (flicker) | **Yok** — içerik ilk boyamadan itibaren kesintisiz görünür (asla boşalmaz) |
| Canlı veri "donuyor mu?" | **Hayır** — sayfa açılışında veriler için **16+ yeni istek** atılıyor (yeniden çekiliyor) |
| İnteraktiflik | **Çalışıyor** — menü tıklaması ile client-side SPA geçişi sorunsuz |
| `vite build` | **Başarılı** |

**"Flicker yok" nasıl sağlanıyor:** Prerender edilmiş HTML'de içerik `#root` içinde gelir. Tarayıcıda `index.tsx`, bu statik anlık görüntüyü tıklamaları geçiren görünmez bir katmana taşır, React'i **temiz `#root` içine** açar ve uygulama hazır olunca katmanı yumuşakça kaldırır. `hydrateRoot` yerine `createRoot` kullanıldığı için **hiç hydration hatası olmaz** ve tüm değerler taze çekilir.

---

## 4. Değiştirilen / Eklenen Dosyalar

**Eklenen:**
- `src/data/pageSeo.ts` — Her public rota için statik, benzersiz `title` + `description` haritası (senkron uygulanır; admin paneldeki `page_seo` tablosu yine üzerine yazabilir).
- `scripts/prerender.mjs` — Prerender hattı (statik sunucu + headless Chrome ile her rotayı render edip diske yazar; liste sayfalarındaki linklerden detay sayfalarını da keşfeder).

**Değiştirilen:**
- `index.tsx` — Prerender "hand-off" (titreşimsiz, hydration'sız geçiş).
- `src/hooks/usePageSeo.ts` — Statik SEO'yu **senkron** uygular (bot/prerender için garantili benzersiz başlık); rota değişiminde başlığı sıfırlamayı bırakır.
- `src/layouts/PublicLayout.tsx` — Tüm sayfalara aynı başlığı yazan **global override kaldırıldı** (artık her sayfa kendi başlığını korur); favicon ve footer ayarları aynen kaldı.
- `src/pages/AboutPage.tsx` ve `src/pages/public/FAQPage.tsx` — `usePageSeo()` eklendi.
- `package.json` — `prerender` ve `build:seo` script'leri + `puppeteer` (devDependency).
- `public/.htaccess` — Prerender edilmeyen rotalar (login, profil, admin, henüz üretilmemiş detaylar) artık **boş kabuk `app.html`**'e düşer; prerender edilen sayfalar fiziksel dosya olarak doğrudan servis edilir.

**Dokunulmayanlar:** Hiçbir tasarım/stil, bileşen markup'ı, hesaplama aracı, döviz/altın/ticker mantığı veya Supabase sorgusu değiştirilmedi.

---

## 5. Canlıya Yükleme Adımları (sizin yapacağınız)

> Bu adımlar **kendi bilgisayarınızda** çalışır (Supabase ve internet erişimi orada var). Hosting/DNS erişimi gerektiren bir şey yok.

1. **Bağımlılıkları kurun** (ilk seferde puppeteer + Chromium iner, ~birkaç dk):
   ```bash
   npm install
   ```
2. **Build + Prerender'ı birlikte çalıştırın:**
   ```bash
   npm run build:seo
   ```
   Bu komut `vite build`'i çalıştırır, ardından `dist/` içindeki sayfaları gerçek içerikle statik HTML'e dönüştürür. Çıktıda her sayfanın karakter sayısını ve bulunan detay sayfalarını görürsünüz.
3. **Önizleme (opsiyonel) — yüklemeden önce ham HTML'i doğrulayın:**
   ```bash
   npx serve dist        # veya: npm run preview
   # başka bir terminalde, JS olmadan ham HTML'i görün:
   curl -s http://localhost:3000/blog | grep -o '<title>.*</title>'
   ```
   `dist/index.html`, `dist/blog/index.html` vb. dosyaları bir metin editöründe açıp `<div id="root">` içinde **gerçek Türkçe metin** olduğunu görebilirsiniz.
4. **Natro'ya yükleyin:** `dist/` klasörünün **içeriğini** (tek tek dosya ve klasörleri — `index.html`, `app.html`, `assets/`, `blog/`, `katilim-firmalari/`, `.htaccess`, `api/`, vb.) `public_html` altına, eski dosyaların üzerine yazacak şekilde gönderin.
   - `.htaccess`'in yüklendiğinden ve aktif olduğundan emin olun.
   - `app.html`'in yüklendiğinden emin olun (SPA fallback bunu kullanır).
5. **Tarayıcı önbelleğini** atlamak için yükleme sonrası siteyi gizli sekmede açıp kontrol edin.

---

## 6. Yükleme Sonrası Doğrulama (canlıda)

```bash
# Ham HTML'de içerik var mı? (JS çalışmadan, botun gördüğü hâl)
curl -s https://katilimuzmani.com/ | grep -c "Hesaplama"
curl -s https://katilimuzmani.com/blog | grep -o "<title>.*</title>"
curl -s https://katilimuzmani.com/katilim-firmalari | grep -o 'name="description" content="[^"]*"'
```
Her birinde **dolu içerik / benzersiz başlık** görmelisiniz.

Sonra:
- **Google Search Console → URL Denetimi:** Ana sayfa, `/katilim-firmalari`, `/blog`, `/sektor-haberleri`, `/hakkimizda`, `/iletisim` için "Canlı URL'yi test et" → "Test edilen sayfayı görüntüle" → HTML'de metnin geldiğini doğrulayın → "Dizine eklenmeyi iste".
- **AdSense'e yeniden başvurun.**

---

## 7. Önemli Notlar

- **İçerik güncelliği:** Prerender, **build anının** anlık görüntüsüdür. Admin panelden yeni blog/haber/firma eklediğinizde, bunların statik HTML'de görünmesi için **`npm run build:seo` + yeniden yükleme** gerekir. (Kullanıcılar canlı veriyi yine de anında görür; bu yalnızca botların gördüğü statik kopya içindir.) İsterseniz bunu yayınlama akışınıza bir adım olarak ekleyebilirsiniz.
- **Detay sayfaları:** Prerender, liste sayfalarındaki linkleri tarayarak `/blog/<slug>`, `/sektor-haberleri/<slug>`, `/katilim-firmalari/<slug>` gibi detay sayfalarını da otomatik üretir (Supabase erişilebilir olduğunda).
- **Git:** Değişiklikler `seo-prerender` branch'inde. Production'a göndermeden önce inceleyin. Önerilen:
  ```bash
  git checkout seo-prerender
  git add index.tsx package.json public/.htaccess scripts/prerender.mjs \
          src/data/pageSeo.ts src/hooks/usePageSeo.ts src/layouts/PublicLayout.tsx \
          src/pages/AboutPage.tsx src/pages/public/FAQPage.tsx
  git commit -m "SEO: build-time prerender + sayfa bazlı benzersiz meta"
  ```
- **Geri alma:** Sorun olursa `git checkout main` ile eski hâle dönülür; dağıtım tarafında eski `dist` yedeğinizi geri yüklemek yeterlidir.
