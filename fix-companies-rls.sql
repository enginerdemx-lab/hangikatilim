-- =============================================
-- FIX: Add UPDATE, INSERT, DELETE policies for companies table
-- This allows authenticated (admin) users to manage companies
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT all companies (admin panel needs to see all)
CREATE POLICY "Authenticated users can view all companies"
ON companies
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to UPDATE companies
CREATE POLICY "Authenticated users can update companies"
ON companies
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to INSERT companies
CREATE POLICY "Authenticated users can insert companies"
ON companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to DELETE companies
CREATE POLICY "Authenticated users can delete companies"
ON companies
FOR DELETE
TO authenticated
USING (true);

-- Keep existing public policy for unauthenticated users (visitors)
-- "Public can view active companies" already exists
