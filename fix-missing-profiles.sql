-- FIX: Create missing profile records for existing users
-- Run this in Supabase SQL Editor

-- 1. Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT,
ADD COLUMN IF NOT EXISTS monthly_income TEXT,
ADD COLUMN IF NOT EXISTS has_rent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rent_amount INTEGER,
ADD COLUMN IF NOT EXISTS preferred_finance_company TEXT;

-- 2. Create missing profile records for existing users
INSERT INTO public.profiles (id, full_name)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 3. Create missing notification_preferences for existing users
INSERT INTO public.notification_preferences (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np WHERE np.user_id = u.id
);

-- 4. Create missing user_agreements for existing users
INSERT INTO public.user_agreements (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_agreements ua WHERE ua.user_id = u.id
);

-- 5. Verify profiles exist (run this to check)
SELECT 
    u.id,
    u.email,
    p.id as profile_id,
    p.full_name,
    p.gender,
    CASE WHEN p.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;
