-- =============================================
-- Favori Sistemi - Supabase SQL
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştır
-- =============================================

-- 1. Favoriler tablosu
CREATE TABLE IF NOT EXISTS favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type text NOT NULL CHECK (item_type IN ('company', 'news', 'blog')),
    item_id uuid NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Aynı kullanıcı aynı öğeyi birden fazla favoriye ekleyemesin
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique
    ON favorites (user_id, item_type, item_id);

-- Performans için index
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item ON favorites (item_type, item_id);

-- 2. RLS (Row Level Security) Aktif Et
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi favorilerini görebilsin
CREATE POLICY "Users can view own favorites"
    ON favorites FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendileri favori ekleyebilsin
CREATE POLICY "Users can insert own favorites"
    ON favorites FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar sadece kendi favorilerini silebilsin
CREATE POLICY "Users can delete own favorites"
    ON favorites FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. Favori sayısını hızlı almak için RPC fonksiyonu
CREATE OR REPLACE FUNCTION get_favorite_count(p_item_type text, p_item_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count_val integer;
BEGIN
    SELECT COUNT(*)::integer INTO count_val
    FROM favorites
    WHERE item_type = p_item_type AND item_id = p_item_id;
    RETURN count_val;
END;
$$;

GRANT EXECUTE ON FUNCTION get_favorite_count(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_favorite_count(text, uuid) TO authenticated;
