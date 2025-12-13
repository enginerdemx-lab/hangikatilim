# Supabase Admin Panel - Kurulum Rehberi

Bu rehber, Vite + React + TypeScript + Tailwind + Supabase admin panel projenizi kurmak için gereken tüm adımları içerir.

## 📋 Gereksinimler

- Node.js 18+ ve npm
- Supabase hesabı (ücretsiz tier yeterli)
- Vite + React + TypeScript + Tailwind projesi (mevcut)

## 🚀 Kurulum Adımları

### 1. Supabase Projesi Oluşturma

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. "New Project" butonuna tıklayın
3. Proje adı, database şifresi ve region seçin
4. Projenin hazır olmasını bekleyin (1-2 dakika)

### 2. SQL Schema'yı Çalıştırma

1. Supabase Dashboard'da **SQL Editor** sekmesine gidin
2. `supabase-schema.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve **RUN** butonuna tıklayın
4. Tüm tabloların başarıyla oluşturulduğunu doğrulayın

### 3. Storage Bucket Kurulumu

1. Supabase Dashboard'da **Storage** sekmesine gidin
2. **Create a new bucket** butonuna tıklayın
3. Bucket adı: `media`
4. **Public bucket** seçeneğini işaretleyin
5. **Create bucket** butonuna tıklayın

#### Klasör Yapısı Oluşturma

Storage bucket'ınızda şu klasörleri oluşturun:
- `logos/` - Firma logoları
- `campaign-images/` - Kampanya görselleri
- `blog-covers/` - Blog kapak görselleri
- `news-covers/` - Haber kapak görselleri

> **Not**: Klasörler otomatik olarak ilk dosya yüklendiğinde oluşturulacaktır.

### 4. Admin Kullanıcı Oluşturma

1. Supabase Dashboard'da **Authentication** > **Users** sekmesine gidin
2. **Add user** > **Create new user** butonuna tıklayın
3. Admin e-posta ve şifrenizi girin
4. **Create user** butonuna tıklayın

> **ÖNEMLİ**: Bu sistem TEK ADMIN için tasarlanmıştır. Sadece bir kullanıcı oluşturun.

### 5. Environment Variables Ayarlama

1. Supabase Dashboard'da **Settings** > **API** sekmesine gidin
2. **Project URL** ve **anon public** key'i kopyalayın
3. Proje kök dizininde `.env` dosyası oluşturun:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 6. NPM Paketlerini Yükleme

```bash
npm install @supabase/supabase-js
```

### 7. Projeyi Çalıştırma

```bash
npm run dev
```

## 🎯 İlk Giriş

1. Tarayıcınızda `http://localhost:5173/admin/login` adresine gidin
2. Supabase'de oluşturduğunuz admin e-posta ve şifre ile giriş yapın
3. Başarılı giriş sonrası admin dashboard'a yönlendirileceksiniz

## 📁 Proje Yapısı

```
src/
├── services/
│   ├── supabaseClient.ts       # Supabase bağlantısı
│   ├── authService.ts          # Admin authentication
│   ├── storageService.ts       # Dosya yükleme/silme
│   └── api/
│       ├── campaigns.ts        # Kampanya CRUD
│       └── companies.ts        # Firma CRUD
├── types/
│   └── database.ts             # TypeScript tipleri
├── pages/admin/
│   ├── AdminLogin.tsx          # Admin giriş sayfası
│   ├── AdminDashboard.tsx      # Ana dashboard
│   └── Campaigns.tsx           # Kampanya yönetimi
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx     # Admin layout wrapper
│   │   ├── AdminSidebar.tsx    # Sol menü
│   │   ├── ImageUpload.tsx     # Görsel yükleme
│   │   └── Toast.tsx           # Bildirimler
│   └── CampaignCard.tsx        # Kampanya kartı (public)
└── hooks/
    ├── useAuth.ts              # Authentication hook
    └── useToast.ts             # Toast notification hook
```

## ✨ Özellikler

### ✅ Tamamlanan Modüller

- **Kampanyalar**: Tam CRUD, görsel yükleme, firma bağlantısı
- **Campaign Card**: İki görsel (logo + kampanya görseli) yan yana
- **Admin Auth**: Giriş/çıkış, protected routes
- **Dashboard**: İstatistikler ve hızlı erişim linkleri

### 🔨 Geliştirilecek Modüller

Aşağıdaki modüller için benzer yapıda admin sayfaları oluşturulabilir:

1. **Site Ayarları** - Genel site konfigürasyonu
2. **Navigasyon** - Menü yönetimi (drag & drop)
3. **Sektör Gündemi** - Ticker mesajları
4. **Ana Sayfa Hero** - Hero section içeriği
5. **Hesaplama Ayarları** - Hesaplama aracı parametreleri
6. **Firmalar** - Firma yönetimi (logo upload)
7. **Sektör Haberleri** - Haber yönetimi
8. **Blog** - Blog yazıları
9. **İletişim** - İletişim bilgileri ve mesajlar
10. **Medya Kütüphanesi** - Tüm yüklenen görseller

## 🎨 Kampanya Kartı Kullanımı

Public sayfalarınızda kampanya kartlarını göstermek için:

```tsx
import { CampaignCard } from '../components/CampaignCard';
import { campaignsApi } from '../services/api/campaigns';

function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    campaignsApi.getActiveCampaigns().then(setCampaigns);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
```

## 🔒 Güvenlik Notları

- **RLS Policies**: Tüm tablolarda Row Level Security aktif
- **Public Access**: Sadece aktif/yayınlanmış içerikler görünür
- **Admin Access**: Tüm CRUD işlemleri sadece authenticated kullanıcılar için
- **Storage**: Görsel yükleme/silme sadece admin için

## 🐛 Sorun Giderme

### "Missing Supabase environment variables" hatası
- `.env` dosyasının proje kök dizininde olduğundan emin olun
- Environment variable isimlerinin `VITE_` ile başladığından emin olun
- Dev server'ı yeniden başlatın

### Giriş yapamıyorum
- Supabase Authentication'da kullanıcının oluşturulduğunu kontrol edin
- E-posta ve şifrenin doğru olduğundan emin olun
- Browser console'da hata mesajlarını kontrol edin

### Görsel yüklenmiyor
- Storage bucket'ın public olduğundan emin olun
- Dosya boyutunun 5MB'dan küçük olduğunu kontrol edin
- Network sekmesinde upload request'ini inceleyin

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'da hata mesajlarını kontrol edin
2. Supabase Dashboard > Logs sekmesinde backend hatalarını inceleyin
3. SQL schema'nın tamamen çalıştırıldığından emin olun

## 🎉 Sonraki Adımlar

1. Diğer admin modüllerini geliştirin (yukarıdaki liste)
2. Public sayfalarınızı Supabase'e bağlayın
3. Responsive tasarımı test edin
4. Production'a deploy edin

---

**Hazırlayan**: Antigravity AI Assistant
**Tarih**: 2024
**Versiyon**: 1.0
