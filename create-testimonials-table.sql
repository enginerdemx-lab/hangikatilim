-- ============================================
-- Testimonials (Kullanıcı Yorumları) Table
-- ============================================

-- 1. Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name VARCHAR(100) NOT NULL,
    user_city VARCHAR(100) DEFAULT '',
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Everyone can read approved testimonials
CREATE POLICY "Anyone can read approved testimonials"
    ON public.testimonials
    FOR SELECT
    USING (status = 'approved');

-- Authenticated users can insert their own testimonials
CREATE POLICY "Authenticated users can submit testimonials"
    ON public.testimonials
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Admin full access (using service role or admin check)
CREATE POLICY "Admin full access to testimonials"
    ON public.testimonials
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role IS NOT NULL
        )
    );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at DESC);

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_testimonials_updated_at
    BEFORE UPDATE ON public.testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_testimonials_updated_at();


-- ============================================
-- Add toggle columns to site_settings
-- ============================================

ALTER TABLE public.site_settings
    ADD COLUMN IF NOT EXISTS testimonials_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.site_settings
    ADD COLUMN IF NOT EXISTS social_proof_enabled BOOLEAN DEFAULT true;
