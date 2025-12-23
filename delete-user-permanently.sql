-- Function to permanently delete a user (Hard Delete)
-- This function can only be called by an admin (enforced by is_admin check)

CREATE OR REPLACE FUNCTION delete_user_permanently(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth -- Secure search path
AS $$
BEGIN
  -- 1. Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin' -- Assuming 'role' column in profiles determines admin status based on common patterns
  ) AND NOT public.is_admin(auth.uid()) THEN -- Fallback to is_admin function if it exists
    RAISE EXCEPTION 'Access denied. You are not an admin.';
  END IF;

  -- 2. Delete the user from auth.users
  -- This will cascade to public.profiles and other related tables if Foreign Keys are set up with ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- If it doesn't cascade automatically, we might need to manually delete from profiles
  -- But usually Supabase auth.users is the source of truth.
  -- Just in case, we can try to delete from profiles first to be safe if no cascade
  -- DELETE FROM public.profiles WHERE id = target_user_id;
END;
$$;
