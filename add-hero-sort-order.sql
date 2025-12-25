-- Add sort_order column to home_hero table for banner ordering
-- Run this in Supabase SQL Editor

ALTER TABLE public.home_hero 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Set initial sort order based on created_at for existing slides
WITH ordered_slides AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
    FROM public.home_hero
)
UPDATE public.home_hero h
SET sort_order = os.new_order
FROM ordered_slides os
WHERE h.id = os.id;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_home_hero_sort_order ON public.home_hero(sort_order);
