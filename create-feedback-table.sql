-- =====================================================
-- CALCULATION FEEDBACK TABLE
-- Hesaplayıcı sonuçları için geri bildirim sistemi
-- =====================================================

-- Create feedback table
CREATE TABLE IF NOT EXISTS calculation_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_positive BOOLEAN NOT NULL,
    comment TEXT,
    calculation_params JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calculation_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert feedback
CREATE POLICY "Anyone can submit feedback"
ON calculation_feedback FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Only admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON calculation_feedback FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_feedback_created_at ON calculation_feedback(created_at DESC);
CREATE INDEX idx_feedback_is_positive ON calculation_feedback(is_positive);

-- Grant permissions
GRANT INSERT ON calculation_feedback TO anon, authenticated;
GRANT SELECT ON calculation_feedback TO authenticated;

-- Create function to get feedback stats
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'positive', COUNT(*) FILTER (WHERE is_positive = true),
        'negative', COUNT(*) FILTER (WHERE is_positive = false),
        'positive_rate', ROUND(
            (COUNT(*) FILTER (WHERE is_positive = true)::DECIMAL / 
            NULLIF(COUNT(*), 0) * 100), 1
        )
    ) INTO result
    FROM calculation_feedback;
    
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_feedback_stats() TO authenticated;
