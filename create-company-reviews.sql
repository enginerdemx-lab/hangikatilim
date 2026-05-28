-- =============================================
-- FIRMA DEĞERLENDİRME & YORUM SİSTEMİ
-- =============================================

-- 1) Reviews tablosu
CREATE TABLE IF NOT EXISTS company_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT NOT NULL CHECK (char_length(comment) >= 10),
  pros TEXT,  -- Artılar
  cons TEXT,  -- Eksiler
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,  -- Admin reddetme sebebi vs.
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Her kullanıcı her firmaya sadece 1 yorum yapabilsin
  UNIQUE(company_id, user_id)
);

-- Index'ler
CREATE INDEX idx_reviews_company ON company_reviews(company_id);
CREATE INDEX idx_reviews_user ON company_reviews(user_id);
CREATE INDEX idx_reviews_status ON company_reviews(status);
CREATE INDEX idx_reviews_rating ON company_reviews(rating);

-- 2) RLS Policies
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

-- Herkes onaylanmış yorumları görebilir
CREATE POLICY "Anyone can read approved reviews"
  ON company_reviews FOR SELECT
  USING (status = 'approved');

-- Kullanıcılar kendi yorumlarını görebilir (pending dahil)
CREATE POLICY "Users can read own reviews"
  ON company_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Giriş yapanlar yorum ekleyebilir
CREATE POLICY "Authenticated users can insert reviews"
  ON company_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi pending yorumlarını güncelleyebilir
CREATE POLICY "Users can update own pending reviews"
  ON company_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi yorumlarını silebilir
CREATE POLICY "Users can delete own reviews"
  ON company_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3) Firma ortalama puan hesaplama RPC
CREATE OR REPLACE FUNCTION get_company_rating_stats(p_company_id UUID)
RETURNS TABLE(avg_rating NUMERIC, total_reviews BIGINT, rating_1 BIGINT, rating_2 BIGINT, rating_3 BIGINT, rating_4 BIGINT, rating_5 BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as avg_rating,
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE rating = 1) as rating_1,
    COUNT(*) FILTER (WHERE rating = 2) as rating_2,
    COUNT(*) FILTER (WHERE rating = 3) as rating_3,
    COUNT(*) FILTER (WHERE rating = 4) as rating_4,
    COUNT(*) FILTER (WHERE rating = 5) as rating_5
  FROM company_reviews
  WHERE company_id = p_company_id AND status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION get_company_rating_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_company_rating_stats(UUID) TO authenticated;

-- 4) Kullanıcının bir firmaya yorum yapıp yapmadığını kontrol
CREATE OR REPLACE FUNCTION has_user_reviewed(p_company_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM company_reviews
    WHERE company_id = p_company_id AND user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION has_user_reviewed(UUID, UUID) TO authenticated;

-- 5) Admin full access policy (service_role zaten bypass eder ama
--    admin panelden yapılan işlemler anon key ile gider,
--    bu yüzden admin_users tablosundaki kullanıcılara da izin veriyoruz)
CREATE POLICY "Admin can do everything on reviews"
  ON company_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- 6) Updated_at otomatik güncelleme trigger
CREATE OR REPLACE FUNCTION update_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_updated_at
  BEFORE UPDATE ON company_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_updated_at();
