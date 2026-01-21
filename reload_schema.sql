-- Run this command in Supabase SQL Editor to reload the schema cache.
-- This is necessary when you add new columns (like about_content) to tables
-- so that the API can recognize them immediately.

NOTIFY pgrst, 'reload schema';
