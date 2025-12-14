-- Tüm haberleri sil
DELETE FROM news_posts;

-- Auto-increment counter'ı sıfırla (PostgreSQL için)
-- news_posts tablosu için sequence adı genelde news_posts_id_seq olur
ALTER SEQUENCE news_posts_id_seq RESTART WITH 1;
