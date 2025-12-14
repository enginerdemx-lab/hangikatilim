-- Add order_index field to campaigns table for custom ordering
ALTER TABLE campaigns ADD COLUMN order_index INTEGER DEFAULT 0;

-- Set initial order based on created_at (older campaigns first)
WITH ranked_campaigns AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 as row_num
  FROM campaigns
)
UPDATE campaigns 
SET order_index = ranked_campaigns.row_num
FROM ranked_campaigns
WHERE campaigns.id = ranked_campaigns.id;

-- Create index for better performance
CREATE INDEX idx_campaigns_order ON campaigns(order_index);
