-- Login activity / security events table
CREATE TABLE public.login_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout', 'password_changed',
    'two_factor_enabled', 'two_factor_disabled', 'profile_updated',
    'session_expired', 'suspicious_activity'
  )),
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT DEFAULT 'unknown' CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  os TEXT,
  location TEXT,
  is_suspicious BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_login_activity_user ON public.login_activity(user_id);
CREATE INDEX idx_login_activity_user_created ON public.login_activity(user_id, created_at DESC);
CREATE INDEX idx_login_activity_suspicious ON public.login_activity(user_id, is_suspicious) WHERE is_suspicious = TRUE;

-- RLS
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login activity"
  ON public.login_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login activity"
  ON public.login_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add security_score column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_score INTEGER DEFAULT 40;
