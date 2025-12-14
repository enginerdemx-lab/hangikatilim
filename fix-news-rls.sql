-- Fix news_posts RLS policies
-- Allow public read access to published news
CREATE POLICY "Allow public read published news"
ON news_posts
FOR SELECT
USING (status = 'published');

-- Allow authenticated users (admins) full access
CREATE POLICY "Allow admin full access"
ON news_posts
FOR ALL
USING (auth.role() = 'authenticated');
