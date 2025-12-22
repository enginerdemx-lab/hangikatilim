-- Row Level Security (RLS) Policies for User Profile System
-- Run this AFTER create-user-profile-system.sql

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for manual creation if needed)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- CALCULATIONS POLICIES
-- ============================================

-- Users can view their own calculations
DROP POLICY IF EXISTS "Users can view own calculations" ON public.calculations;
CREATE POLICY "Users can view own calculations"
    ON public.calculations FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own calculations
DROP POLICY IF EXISTS "Users can insert own calculations" ON public.calculations;
CREATE POLICY "Users can insert own calculations"
    ON public.calculations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own calculations
DROP POLICY IF EXISTS "Users can delete own calculations" ON public.calculations;
CREATE POLICY "Users can delete own calculations"
    ON public.calculations FOR DELETE
    USING (auth.uid() = user_id);

-- Users can update their own calculations (optional, if needed)
DROP POLICY IF EXISTS "Users can update own calculations" ON public.calculations;
CREATE POLICY "Users can update own calculations"
    ON public.calculations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================

-- Users can view their own notification preferences
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notification preferences
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can insert their own notification preferences
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- USER AGREEMENTS POLICIES
-- ============================================

-- Users can view their own agreements
DROP POLICY IF EXISTS "Users can view own agreements" ON public.user_agreements;
CREATE POLICY "Users can view own agreements"
    ON public.user_agreements FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own agreements
DROP POLICY IF EXISTS "Users can update own agreements" ON public.user_agreements;
CREATE POLICY "Users can update own agreements"
    ON public.user_agreements FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can insert their own agreements
DROP POLICY IF EXISTS "Users can insert own agreements" ON public.user_agreements;
CREATE POLICY "Users can insert own agreements"
    ON public.user_agreements FOR INSERT
    WITH CHECK (auth.uid() = user_id);
