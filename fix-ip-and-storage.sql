-- FIX: IP Logging and Storage Permissions

-- 1. Update log_user_login to capture IP automatically using inet_client_addr()
CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id UUID,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    p_browser TEXT DEFAULT NULL,
    p_os TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert login log with fallback to inet_client_addr() for IP
    INSERT INTO public.user_login_logs (user_id, ip_address, user_agent, device_type, browser, os)
    VALUES (
        p_user_id, 
        COALESCE(p_ip_address::INET, inet_client_addr()), 
        p_user_agent, 
        p_device_type, 
        p_browser, 
        p_os
    );
    
    -- Update profile stats
    UPDATE public.profiles
    SET 
        last_login_at = NOW(),
        login_count = COALESCE(login_count, 0) + 1
    WHERE id = p_user_id;
END;
$$;

-- 2. Update get_all_users_admin to fetch REAL last IP from logs
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMPTZ,
    member_number INTEGER,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    status TEXT,
    ban_reason TEXT,
    created_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_sign_in_ip TEXT, -- This will now return real IP
    login_count INTEGER,
    calculation_count BIGINT,
    education_level TEXT,
    employment_status TEXT,
    profession TEXT,
    work_experience TEXT,
    monthly_income TEXT,
    has_rent BOOLEAN,
    rent_amount INTEGER,
    preferred_finance_company TEXT,
    gender TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        u.email::TEXT,
        u.email_confirmed_at,
        p.member_number,
        p.full_name::TEXT,
        p.phone::TEXT,
        p.avatar_url::TEXT,
        p.status::TEXT,
        p.ban_reason::TEXT,
        p.created_at,
        p.last_login_at,
        (
            SELECT l.ip_address::TEXT 
            FROM public.user_login_logs l 
            WHERE l.user_id = p.id 
            ORDER BY l.logged_in_at DESC 
            LIMIT 1
        ) as last_sign_in_ip, -- Fetch latest IP from logs
        p.login_count,
        (SELECT COUNT(*) FROM public.calculations c WHERE c.user_id = p.id)::BIGINT,
        p.education_level::TEXT,
        p.employment_status::TEXT,
        p.profession::TEXT,
        p.work_experience::TEXT,
        p.monthly_income::TEXT,
        p.has_rent,
        p.rent_amount,
        p.preferred_finance_company::TEXT,
        p.gender::TEXT
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- 3. STORAGE PERMISSION FIXES
-- Ensure avatars bucket is public and has correct policies

-- Make avatars bucket public (idempotent-ish via policy)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to refresh them
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create correct policies
-- 1. Public Read
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Authenticated Upload (Insert)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Authenticated Update
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Authenticated Delete
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
