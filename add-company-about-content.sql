-- Add about_content field to companies table
-- For rich HTML content with images (similar to blog posts)

ALTER TABLE companies ADD COLUMN IF NOT EXISTS about_content TEXT;

COMMENT ON COLUMN companies.about_content IS 'Rich HTML content for company about page';
