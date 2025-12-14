-- Add mobile_image_url column to campaigns table
-- This allows uploading separate mobile-optimized (vertical) images for campaigns
-- Mobile devices will show mobile_image_url, desktop will show image_url

ALTER TABLE campaigns 
ADD COLUMN mobile_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN campaigns.mobile_image_url IS 'Mobile-optimized campaign image (vertical/portrait format for phones)';
