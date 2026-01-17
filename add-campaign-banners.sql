-- Campaign Banners Table
-- Kampanya sayfası alt banner slider için

CREATE TABLE IF NOT EXISTS campaign_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campaign_banners ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public can view active campaign banners"
ON campaign_banners FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage campaign banners"
ON campaign_banners FOR ALL
USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON campaign_banners TO anon;
GRANT ALL ON campaign_banners TO authenticated;

-- Create index for sorting
CREATE INDEX idx_campaign_banners_sort ON campaign_banners(sort_order);
CREATE INDEX idx_campaign_banners_active ON campaign_banners(is_active);
