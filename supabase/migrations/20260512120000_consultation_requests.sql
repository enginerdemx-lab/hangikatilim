-- =====================================================
-- ÜCRETSİZ DANIŞMANLIK TALEPLERİ — Tablo, İndeksler, RLS
-- Date: 2026-05-12
-- Purpose: Hesaplayıcı modalından gelen danışmanlık taleplerini saklamak
-- =====================================================

CREATE TABLE IF NOT EXISTS public.consultation_requests (
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

CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON public.consultation_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status     ON public.consultation_requests (status);

-- RLS
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

-- 1) Anon + authenticated kullanıcılar form gönderebilir (public form)
DROP POLICY IF EXISTS "Anyone can insert consultation requests" ON public.consultation_requests;
CREATE POLICY "Anyone can insert consultation requests"
ON public.consultation_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2) Sadece adminler okuyabilir
DROP POLICY IF EXISTS "Authenticated users can view consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Admins can view consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can view consultation requests"
ON public.consultation_requests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 3) Sadece adminler güncelleyebilir
DROP POLICY IF EXISTS "Authenticated users can update consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Admins can update consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can update consultation requests"
ON public.consultation_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 4) Sadece adminler silebilir
DROP POLICY IF EXISTS "Authenticated users can delete consultation requests" ON public.consultation_requests;
DROP POLICY IF EXISTS "Admins can delete consultation requests" ON public.consultation_requests;
CREATE POLICY "Admins can delete consultation requests"
ON public.consultation_requests
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_consultation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consultation_requests_updated_at ON public.consultation_requests;
CREATE TRIGGER trg_consultation_requests_updated_at
BEFORE UPDATE ON public.consultation_requests
FOR EACH ROW EXECUTE FUNCTION public.set_consultation_updated_at();
