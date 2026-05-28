-- =====================================================
-- SECURITY HARDENING: RLS ADMIN POLICIES
-- Date: 2026-03-07
-- Purpose: Replace overly broad authenticated policies with admin-only policies
-- =====================================================

-- POPUPS
DO $$
BEGIN
  IF to_regclass('public.popups') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated users can manage popups" ON public.popups;
    CREATE POLICY "Admins can manage popups"
      ON public.popups
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.popup_email_subscribers') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated users can view subscribers" ON public.popup_email_subscribers;
    CREATE POLICY "Admins can view popup subscribers"
      ON public.popup_email_subscribers
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- SPONSORS
DO $$
BEGIN
  IF to_regclass('public.sponsors') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated users can manage sponsors" ON public.sponsors;
    CREATE POLICY "Admins can manage sponsors"
      ON public.sponsors
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- PDF DOWNLOAD LOGS
DO $$
BEGIN
  IF to_regclass('public.pdf_download_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated users can read all pdf download logs" ON public.pdf_download_logs;
    DROP POLICY IF EXISTS "Admins can read all pdf download logs" ON public.pdf_download_logs;
    CREATE POLICY "Admins can read all pdf download logs"
      ON public.pdf_download_logs
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- HOMEPAGE CONTENT TABLES
DO $$
BEGIN
  IF to_regclass('public.faq_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow all for authenticated faq" ON public.faq_items;
    CREATE POLICY "Allow all for admin faq"
      ON public.faq_items
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.info_cards') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow all for authenticated info_cards" ON public.info_cards;
    CREATE POLICY "Allow all for admin info_cards"
      ON public.info_cards
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.licensed_companies') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow all for authenticated licensed_companies" ON public.licensed_companies;
    CREATE POLICY "Allow all for admin licensed_companies"
      ON public.licensed_companies
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.how_it_works_steps') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Allow all for authenticated how_it_works" ON public.how_it_works_steps;
    CREATE POLICY "Allow all for admin how_it_works"
      ON public.how_it_works_steps
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- QUICK LINKS
DO $$
BEGIN
  IF to_regclass('public.home_quicklinks_settings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can manage quicklinks settings" ON public.home_quicklinks_settings;
    CREATE POLICY "Admin can manage quicklinks settings"
      ON public.home_quicklinks_settings
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.home_quicklinks_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can manage quicklinks items" ON public.home_quicklinks_items;
    CREATE POLICY "Admin can manage quicklinks items"
      ON public.home_quicklinks_items
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- UI EFFECTS
DO $$
BEGIN
  IF to_regclass('public.ui_effects') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Auth update for ui_effects" ON public.ui_effects;
    DROP POLICY IF EXISTS "Auth insert for ui_effects" ON public.ui_effects;
    CREATE POLICY "Admin update for ui_effects"
      ON public.ui_effects
      FOR UPDATE
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));

    CREATE POLICY "Admin insert for ui_effects"
      ON public.ui_effects
      FOR INSERT
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- CAMPAIGN BANNERS
DO $$
BEGIN
  IF to_regclass('public.campaign_banners') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can manage campaign banners" ON public.campaign_banners;
    CREATE POLICY "Admins can manage campaign banners"
      ON public.campaign_banners
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;
