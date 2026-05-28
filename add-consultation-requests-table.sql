-- Ücretsiz Danışmanlık Talepleri tablosu

CREATE TABLE IF NOT EXISTS consultation_requests (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name  text NOT NULL,
    last_name   text NOT NULL,
    phone       text NOT NULL,
    email       text NOT NULL,
    amount      bigint NOT NULL,
    system_type text NOT NULL CHECK (system_type IN ('CEKILISLI', 'CEKILISSIZ')),
    consent     boolean NOT NULL DEFAULT false,
    status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'completed', 'archived')),
    admin_note  text,
    user_agent  text,
    ip_address  text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Eğer tablo önceden oluşturulduysa eksik sütunları eklemek için ALTER TABLE komutları:
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS monthly_payment bigint;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON consultation_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status      ON consultation_requests (status);

-- RLS
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- Anonim kullanıcılar form gönderebilir
DROP POLICY IF EXISTS "Anyone can insert consultation requests" ON consultation_requests;
CREATE POLICY "Anyone can insert consultation requests"
ON consultation_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Sadece authenticated kullanıcılar (admin paneline giriş yapanlar) okuyabilir
DROP POLICY IF EXISTS "Authenticated users can view consultation requests" ON consultation_requests;
CREATE POLICY "Authenticated users can view consultation requests"
ON consultation_requests FOR SELECT
TO authenticated
USING (true);

-- Sadece authenticated kullanıcılar update/delete edebilir
DROP POLICY IF EXISTS "Authenticated users can update consultation requests" ON consultation_requests;
CREATE POLICY "Authenticated users can update consultation requests"
ON consultation_requests FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete consultation requests" ON consultation_requests;
CREATE POLICY "Authenticated users can delete consultation requests"
ON consultation_requests FOR DELETE
TO authenticated
USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_consultation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consultation_requests_updated_at ON consultation_requests;
CREATE TRIGGER trg_consultation_requests_updated_at
BEFORE UPDATE ON consultation_requests
FOR EACH ROW EXECUTE FUNCTION set_consultation_updated_at();
