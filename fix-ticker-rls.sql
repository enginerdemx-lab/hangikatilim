-- Fix RLS Policy for ticker_items to allow public access to active items
-- Run this in Supabase SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active ticker items" ON ticker_items;
DROP POLICY IF EXISTS "Anyone can view active ticker items" ON ticker_items;

-- Create a more permissive SELECT policy for public access
CREATE POLICY "Anyone can view active ticker items"
  ON ticker_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Ensure admin policy exists for all operations
DROP POLICY IF EXISTS "Admin can manage ticker items" ON ticker_items;
CREATE POLICY "Admin can manage ticker items"
  ON ticker_items FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Verify RLS is enabled
ALTER TABLE ticker_items ENABLE ROW LEVEL SECURITY;

-- Show current policies for confirmation
SELECT * FROM pg_policies WHERE tablename = 'ticker_items';
