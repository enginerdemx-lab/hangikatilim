-- FIX: user-files storage bucket RLS policies
-- The current policy is blocking uploads. This script fixes it.

-- Drop existing policies if they cause conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage own files" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create proper policy for user-files bucket
-- Users can INSERT their own files (folder name = user_id)
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT TO authenticated  
  WITH CHECK (
    bucket_id = 'user-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can SELECT their own files
CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can UPDATE their own files
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can DELETE their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
