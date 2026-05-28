-- Create an RPC to fetch calculations for a specific user as an admin
-- This uses SECURITY DEFINER to bypass RLS restrictions

DROP FUNCTION IF EXISTS get_user_calculations_admin(UUID);

CREATE OR REPLACE FUNCTION get_user_calculations_admin(p_user_id UUID)
RETURNS SETOF public.calculations
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.calculations
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_calculations_admin TO authenticated;
