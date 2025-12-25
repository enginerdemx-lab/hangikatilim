-- Add Birth Date Field to Profiles Table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN public.profiles.birth_date IS 'User birth date';
