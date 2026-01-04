-- Push Subscriptions Table Migration
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CREATE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    token TEXT UNIQUE NOT NULL,
    platform TEXT DEFAULT 'web',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_token ON public.push_subscriptions(token);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON public.push_subscriptions(is_enabled) WHERE is_enabled = true;

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

-- Admin can read all subscriptions
DROP POLICY IF EXISTS "Admin can read all subscriptions" ON public.push_subscriptions;
CREATE POLICY "Admin can read all subscriptions" ON public.push_subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid()
        )
    );

-- Admin can delete subscriptions
DROP POLICY IF EXISTS "Admin can delete subscriptions" ON public.push_subscriptions;
CREATE POLICY "Admin can delete subscriptions" ON public.push_subscriptions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE id = auth.uid()
        )
    );

-- Note: INSERT will be done via Edge Function with service role
-- This bypasses RLS for anonymous users

-- =====================================================
-- 4. VERIFY
-- =====================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'push_subscriptions';
