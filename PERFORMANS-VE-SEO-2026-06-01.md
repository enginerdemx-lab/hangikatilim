# Performans + SEO Düzeltmeleri — 1 Haziran 2026

## ⚠️ EN ÖNEMLİ — bu sefer `npm install` ŞART
Tailwind artık tarayıcı CDN'i yerine **build adımında** derleniyor. Bunun için 3 yeni geliştirme bağımlılığı ekledim (tailwindcss, postcss, autoprefixer). Bu yüzden bu sefer build almadan önce **mutlaka** `npm install` çalıştırın:

```bash
npm install        # YENİ bağımlılıklar (tailwindcss/postcss/autoprefixer) — atlanırsa build hata verir
npm run dev        # (opsiyonel) yerelde görünümü test et — stiller yerinde mi?
npm run build:seo  # vite build + prerender
# dist/ içeriğini public_html'e yükle
```

---

## 1) Hız — Tailwind Play CDN kaldırıldı (en büyük kazanç)
Site yavaşlığının ana sebebi `cdn.tailwindcss.com` idi: üretim için tasarlanmamış, ~büyük JS indirip CSS'i **tarayıcıda** derliyordu (render'ı bloke ediyordu). Artık:
- `tailwind.config.js` + `postcss.config.js` + `src/index.css` eklendi; `index.tsx` içinde `import './src/index.css'`.
- `index.html`'den CDN script'i ve inline config kaldırıldı. Tema (primary/gold/slate renkleri, Inter) birebir korundu.
- `index.html`'e `preconnect`/`dns-prefetch` eklendi (font + reklam/analytics bağlantıları hızlansın).

**Doğrulama (yaptım):** Gerçek `tailwind.config.js` hatasız derlendi; marka rengin `#0855f8` (rgb 8 85 248) çıktı CSS'te **32 kez** üretildi. Yani yapılandırma doğru. Görsel sonucu yine de kendi makinende `npm run dev`/`build` ile bir kez gör.

### 🔙 GERİ ALMA (stiller bozuk görünürse)
En kolayı git ile:
```bash
git checkout -- index.html index.tsx package.json
rm tailwind.config.js postcss.config.js src/index.css
```
Bu, eski CDN'li haline döndürür. (Önce `git status` ile kontrol et.)

> Not: Tailwind build'i, sınıfları kaynak dosyaları tarayarak üretir. Bir sayfada stil eksik görünürse, o dosya `tailwind.config.js`'teki `content` listesine giriyor mu diye bak (şu an kök + `src/` + `components/` kapsanıyor).

## 2) Başlıklar (H1/H2) düzeltildi
- Ana sayfada artık **tek H1** var: **"Tasarruf Finansmanı Hesaplama Aracı"** (ana anahtar kelime; tasarımı bozmamak için ekran-okuyucuya özel, sayfanın ilk başlığı).
- Hero (kayan banner) başlığı hem masaüstü `<h1>` hem mobil `<h2>` olarak **aynı metni iki kez** basıyordu → ikisi de `<p>`'ye çevrildi. Böylece "H1 = H2" karışıklığı bitti.
- Footer başlıkları (H3) içerikten **sonra** geldiği için sıralama doğru; dokunulmadı.
- Sonuç: H1 → H2 (Hesaplama Aracı, …Nedir?, Sektör Haberleri, BDDK Lisanslı Şirketler, SSS) → H3 düzeni.

## 3) llms.txt eklendi
`public/llms.txt` oluşturuldu → derleme sonrası `https://katilimuzmani.com/llms.txt` adresinde yayınlanır.

## 4) Yapısal veri (rich results) — kodda zaten var
"Az" görünmesinin sebebi kod eksiği değil: FAQ (hem ana sayfa hem /sss), Organization, WebSite, Breadcrumb ve makale (BlogPosting/NewsArticle) şemaları zaten var. Ama bunlar **JS ile** ekleniyor; ham HTML'de görünmeleri için **prerender'lı rebuild** gerekiyor. Rebuild + deploy sonrası rich-results testini tekrar çalıştır — dolu gelecektir.

## 5) Disavow + Search Console
- Disavow aracı **Alan (Domain) mülkünü desteklemiyor** (ekrandaki uyarı bu). Çözüm: Search Console'da **"URL ön eki" → `https://katilimuzmani.com/`** mülkü ekle (GA zaten kurulu olduğu için "Google Analytics" doğrulama yöntemiyle anında doğrulanır), sonra [Disavow aracında](https://search.google.com/search-console/disavow-links) **o URL-ön-eki mülkünü** seçip `disavow-katilimuzmani.txt`'yi yükle.
- Ben bu dosyayı Google'a **yükleyemem** (Search Console'a erişimim yok); sadece dosyayı hazırladım. Yükleme senin yapacağın manuel adım.
- Hatırlatma: Manuel işlem (penalty) yok ve linkler nofollow; disavow **zorunlu değil**, yanlış kullanılırsa zarar verebilir. Emin değilsen atlayabilirsin.

---

## Değişen / eklenen dosyalar
```
src/pages/public/HomePage.tsx     (tek H1 + hero H1/H2 → p)
index.html                        (Tailwind CDN kaldırıldı, preconnect eklendi)
index.tsx                         (src/index.css import)
package.json                      (tailwindcss, postcss, autoprefixer devDeps)
tailwind.config.js                (YENİ)
postcss.config.js                 (YENİ)
src/index.css                     (YENİ)
public/llms.txt                   (YENİ)
```

## Özet sıra
1. `npm install` (şart — yeni Tailwind bağımlılıkları)
2. `npm run dev` ile stilleri bir kez göz kontrol et (bozuksa yukarıdaki geri-alma)
3. `npm run build:seo` → `dist/`'i yükle → `sitemap-cache.xml`'i sil
4. Search Console'da URL-ön-eki mülkü ekle → (istersen) disavow yükle
5. Rebuild sonrası PageSpeed + rich-results testlerini tekrar çalıştır
