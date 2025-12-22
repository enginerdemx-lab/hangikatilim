-- Storage Bucket Policies for User Files
-- IMPORTANT: First create 'user-files' bucket in Supabase Dashboard (Storage > New Bucket > Private)
-- Then run this SQL in Supabase SQL Editor

-- ============================================
-- STORAGE POLICIES FOR user-files BUCKET
-- ============================================

-- Policy: Users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.foldername(name))[2] = 'avatar.png'
);

-- Policy: Users can update their own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'user-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.foldername(name))[2] = 'avatar.png'
);

-- Policy: Users can upload PDFs to their calculations folder
DROP POLICY IF EXISTS "Users can upload own PDFs" ON storage.objects;
CREATE POLICY "Users can upload own PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.foldername(name))[2] = 'calculations'
);

-- Policy: Users can view/download their own files
DROP POLICY IF EXISTS "Users can download own files" ON storage.objects;
CREATE POLICY "Users can download own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'user-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- NOTES FOR MANUAL BUCKET CREATION
-- ============================================
-- Go to Supabase Dashboard > Storage > New Bucket
-- 
-- Bucket Name: user-files
-- Public: NO (keep it private)
-- 
-- File size limit: 5MB (for PDFs and avatars)
-- Allowed MIME types: 
--   - image/png
--   - image/jpeg
--   - application/pdf
-- 
-- Then run this SQL file to apply the policies above.
