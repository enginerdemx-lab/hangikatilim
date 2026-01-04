-- =============================================
-- UI Effects Table for Visual Effects Management
-- =============================================

-- Create ui_effects table
CREATE TABLE IF NOT EXISTS ui_effects (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ui_effects ENABLE ROW LEVEL SECURITY;

-- Public read access (so frontend can fetch config)
DROP POLICY IF EXISTS "Public read for ui_effects" ON ui_effects;
CREATE POLICY "Public read for ui_effects" ON ui_effects
    FOR SELECT USING (true);

-- Authenticated users can update (for admin panel)
DROP POLICY IF EXISTS "Auth update for ui_effects" ON ui_effects;
CREATE POLICY "Auth update for ui_effects" ON ui_effects
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can insert (for initial setup)
DROP POLICY IF EXISTS "Auth insert for ui_effects" ON ui_effects;
CREATE POLICY "Auth insert for ui_effects" ON ui_effects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default snow_effect config
INSERT INTO ui_effects (key, value) VALUES (
    'snow_effect',
    '{
        "enabled": false,
        "intensity": 120,
        "speed": 1.2,
        "sizeMin": 0.8,
        "sizeMax": 2.6,
        "wind": 0.2,
        "opacity": 0.85,
        "winterMode": false,
        "excludedPages": []
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ui_effects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS ui_effects_updated_at ON ui_effects;
CREATE TRIGGER ui_effects_updated_at
    BEFORE UPDATE ON ui_effects
    FOR EACH ROW
    EXECUTE FUNCTION update_ui_effects_updated_at();

-- Enable realtime for ui_effects table
ALTER PUBLICATION supabase_realtime ADD TABLE ui_effects;
