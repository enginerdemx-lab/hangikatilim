# Supabase Storage Bucket Kurulumu

## ❌ Sorun: "Bucket not found" Hatası

Görsel yükleme çalışmıyor çünkü Supabase Storage bucket'ı henüz oluşturulmamış.

## ✅ Çözüm: Media Bucket Oluşturma

### Adım 1: Supabase Storage'a Gidin

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. Sol menüden **Storage** sekmesine tıklayın

### Adım 2: Yeni Bucket Oluşturun

1. **"Create a new bucket"** butonuna tıklayın (yeşil buton, sağ üst)
2. Bucket bilgilerini girin:
   - **Name**: `media` (tam olarak bu isim olmalı, küçük harfle)
   - **Public bucket**: ✅ **MUTLAKA İŞARETLEYİN** (çok önemli!)
   - **File size limit**: 50 MB (varsayılan)
   - **Allowed MIME types**: Boş bırakın (tüm dosya tipleri)

3. **"Create bucket"** butonuna tıklayın

### Adım 3: Bucket'ın Oluşturulduğunu Doğrulayın

Storage sayfasında "media" bucket'ını görmelisiniz:
- 📁 **media** (public)

### Adım 4: Storage Policies (Opsiyonel - Otomatik Oluşturulur)

Public bucket oluşturduğunuzda, gerekli policy'ler otomatik oluşturulur. Kontrol etmek için:

1. "media" bucket'ına tıklayın
2. Üst menüden **"Policies"** sekmesine tıklayın
3. Şu policy'leri görmelisiniz:
   - ✅ Public access (SELECT)
   - ✅ Authenticated users can upload (INSERT)
   - ✅ Authenticated users can delete (DELETE)

Eğer policy'ler yoksa, şu SQL'i çalıştırın (SQL Editor'de):

```sql
-- Allow public to view files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND auth.role() = 'authenticated');
```

## ✅ Test Etme

1. Admin panelde **Kampanyalar** sayfasına gidin
2. **"+ Yeni Kampanya"** butonuna tıklayın
3. Aşağı kaydırın ve **"Kampanya Görseli"** bölümünü bulun
4. **"Görsel Seç"** butonuna tıklayın
5. Bir görsel seçin
6. "Upload failed: Bucket not found" hatası artık gelmemeli
7. Görsel başarıyla yüklenmelidir

---

## Sonraki Adım: İlk Firma Ekleme

Storage bucket'ı oluşturduktan sonra, ilk firmayı ekleyelim. Bunun için iki seçenek var:

### Seçenek 1: Supabase Dashboard'dan Manuel Ekleme

1. Supabase Dashboard → **Table Editor** → **companies** tablosu
2. **"Insert row"** butonuna tıklayın
3. Şu bilgileri girin:
   - **name**: Albaraka Türk (veya istediğiniz firma)
   - **is_active**: true
   - **is_licensed**: true
4. **"Save"** butonuna tıklayın

### Seçenek 2: SQL ile Toplu Ekleme

SQL Editor'de şu kodu çalıştırın:

```sql
INSERT INTO companies (name, is_licensed, is_active) VALUES
('Albaraka Türk', true, true),
('Kuveyt Türk', true, true),
('Türkiye Finans', true, true),
('Vakıf Katılım', true, true),
('Ziraat Katılım', true, true);
```

Hangisini tercih edersiniz?
