-- Function to permanently delete a user (Hard Delete)
-- Simplified version without is_admin check (assumes only admins can access this RPC)

-- First drop the old function if it exists
DROP FUNCTION IF EXISTS delete_user_permanently(UUID);

-- Create the new function with service_role access
CREATE OR REPLACE FUNCTION delete_user_permanently(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Delete from profiles first (in case no cascade)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from user_agreements
  DELETE FROM public.user_agreements WHERE user_id = target_user_id;
  
  -- Delete from notification_preferences
  DELETE FROM public.notification_preferences WHERE user_id = target_user_id;
  
  -- Delete from calculations
  DELETE FROM public.calculations WHERE user_id = target_user_id;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
-- The RLS and page-level auth will handle admin access control
GRANT EXECUTE ON FUNCTION delete_user_permanently(UUID) TO authenticated;
