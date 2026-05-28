-- ============================================
-- Payment Plan Templates (Kademeli Ödeme Planı Şablonları)
-- Firmaların yayınladığı çoklu dönem (tier) tabanlı, balon ödemeli
-- esnek ödeme planlarının yönetildiği tablo.
-- ============================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.payment_plan_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT DEFAULT '',
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,

    -- Hedef tutar referansı (örnek değer; kullanıcı kendi hedef tutarına ölçekleyebilir)
    target_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    down_payment_percent NUMERIC(5, 2) NOT NULL DEFAULT 40, -- %40 vb.

    -- Tier yapısı (sabit 4 dönem; ileride esnemek istenirse dizi olarak duruyor)
    tier_durations INTEGER[] NOT NULL DEFAULT ARRAY[6, 7, 6, 5],

    -- multiplier modu için
    tier_first_installment NUMERIC(14, 2),
    tier_multiplier NUMERIC(8, 4), -- örn. 2.6200

    -- manual mod için (her dönemin sabit taksiti)
    tier_amounts NUMERIC(14, 2)[],

    -- Son taksit balon mu? (kalan bakiye tek seferde)
    has_balloon BOOLEAN NOT NULL DEFAULT TRUE,

    -- Yayında mı?
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.payment_plan_templates ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Herkes (anonim dahil) yayındaki şablonları okuyabilir
CREATE POLICY "Anyone can read active templates"
    ON public.payment_plan_templates
    FOR SELECT
    USING (is_active = TRUE);

-- Admin (profiles.admin_role IS NOT NULL) tam yetki
CREATE POLICY "Admin full access to payment plan templates"
    ON public.payment_plan_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role IS NOT NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.admin_role IS NOT NULL
        )
    );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_payment_plan_templates_active ON public.payment_plan_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_plan_templates_company ON public.payment_plan_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_templates_sort ON public.payment_plan_templates(sort_order);

-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_payment_plan_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_plan_templates_updated_at ON public.payment_plan_templates;
CREATE TRIGGER trg_payment_plan_templates_updated_at
    BEFORE UPDATE ON public.payment_plan_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.set_payment_plan_templates_updated_at();
