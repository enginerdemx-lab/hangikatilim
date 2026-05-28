-- Popup Management System
-- Create popups table for managing site popups

CREATE TABLE IF NOT EXISTS popups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  
  -- Type: 'corner' (bottom-right), 'modal' (center), 'fullscreen'
  type TEXT NOT NULL DEFAULT 'corner',
  
  -- Template: 'custom', 'email', 'membership', 'announcement', 'discount'
  template TEXT NOT NULL DEFAULT 'custom',
  
  -- Content
  title TEXT,
  subtitle TEXT,
  body_text TEXT,
  image_url TEXT,
  
  -- Button 1
  button1_text TEXT,
  button1_url TEXT,
  button1_style JSONB DEFAULT '{"bg": "#3b82f6", "text": "#ffffff"}',
  
  -- Button 2 (optional)
  button2_text TEXT,
  button2_url TEXT,
  button2_style JSONB DEFAULT '{"bg": "#e5e7eb", "text": "#374151"}',
  
  -- Styling
  styles JSONB DEFAULT '{
    "bgColor": "#ffffff",
    "titleFont": "Inter",
    "titleSize": "24px",
    "titleColor": "#111827",
    "bodyFont": "Inter",
    "bodySize": "14px",
    "bodyColor": "#6b7280",
    "borderRadius": "16px"
  }',
  
  -- Trigger Type: 'immediate', 'delay', 'scroll', 'exit_intent'
  trigger_type TEXT DEFAULT 'delay',
  trigger_delay_seconds INTEGER DEFAULT 3,
  trigger_scroll_percent INTEGER DEFAULT 50,
  
  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  show_once_per_session BOOLEAN DEFAULT true,
  show_on_pages TEXT[] DEFAULT ARRAY['*'],
  
  -- Countdown Timer
  show_countdown BOOLEAN DEFAULT false,
  countdown_end TIMESTAMPTZ,
  
  -- Email Collection
  collect_email BOOLEAN DEFAULT false,
  email_placeholder TEXT DEFAULT 'E-posta adresiniz',
  email_button_text TEXT DEFAULT 'Abone Ol',
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email subscribers table for collected emails
CREATE TABLE IF NOT EXISTS popup_email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id UUID REFERENCES popups(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_email_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies for popups
CREATE POLICY "Public can view active popups" ON popups
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage popups" ON popups
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Policies for email subscribers
CREATE POLICY "Anyone can subscribe" ON popup_email_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view subscribers" ON popup_email_subscribers
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Create indexes
CREATE INDEX idx_popups_active ON popups(is_active);
CREATE INDEX idx_popups_type ON popups(type);
CREATE INDEX idx_popups_schedule ON popups(start_date, end_date);

-- Insert sample templates
INSERT INTO popups (name, type, template, title, subtitle, body_text, button1_text, button1_url, is_active)
VALUES 
  ('Örnek Köşe Popup', 'corner', 'announcement', 'Yeni Kampanya!', 'Kaçırmayın', 'Şimdi hesaplayın ve avantajlardan yararlanın.', 'Hesapla', '/#hesaplayici', false),
  ('Hoşgeldin Modal', 'modal', 'membership', 'Üye Olun!', NULL, 'Üye olarak tüm avantajlardan yararlanın.', 'Kayıt Ol', '/auth/create-account', false);


