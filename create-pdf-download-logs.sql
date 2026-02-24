-- PDF Download Logs Table
-- Tracks which member downloaded which calculation PDF, with IP address
CREATE TABLE IF NOT EXISTS pdf_download_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  calculation_type text NOT NULL,        -- 'ev', 'arac', 'isyeri', 'tumu'
  target_amount numeric,                 -- Hedef tutar
  down_payment numeric,                  -- Peşinat
  months integer,                        -- Vade (ay)
  system_type text,                      -- 'LOTTERY' veya 'NON_LOTTERY'
  ip_address text,                       -- Kullanıcının IP adresi
  user_agent text,                       -- Tarayıcı bilgisi
  created_at timestamptz DEFAULT now()
);

-- Index for fast user-based queries
CREATE INDEX IF NOT EXISTS idx_pdf_download_logs_user_id ON pdf_download_logs(user_id);

-- Index for admin queries by date
CREATE INDEX IF NOT EXISTS idx_pdf_download_logs_created_at ON pdf_download_logs(created_at DESC);

-- Enable RLS
ALTER TABLE pdf_download_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "Users can insert own pdf download logs" ON pdf_download_logs;
DROP POLICY IF EXISTS "Users can read own pdf download logs" ON pdf_download_logs;
DROP POLICY IF EXISTS "Authenticated users can read all pdf download logs" ON pdf_download_logs;

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert own pdf download logs"
  ON pdf_download_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own logs
CREATE POLICY "Users can read own pdf download logs"
  ON pdf_download_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Allow service_role / admin full access (via Supabase dashboard)
-- Admins use the service_role key or read via join with profiles
-- For admin panel reads, we need a broader SELECT policy
-- Since admin uses the same anon key, we allow all authenticated users to SELECT
-- (admin role check happens at the application level)
CREATE POLICY "Authenticated users can read all pdf download logs"
  ON pdf_download_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');
