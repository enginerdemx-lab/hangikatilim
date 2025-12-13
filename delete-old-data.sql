-- Eski kampanyaları sil (ilişkili olduğu için önce bunları silmeliyiz)
DELETE FROM campaigns;

-- Eski firmaları sil
DELETE FROM companies;

-- Kontrol et
SELECT COUNT(*) as firma_sayisi FROM companies;
SELECT COUNT(*) as kampanya_sayisi FROM campaigns;
