-- Phase 7: Production Features
-- Transaction limits, SCA, cooling periods, SAR workflow, interest engine

-- ============================================================
-- Transaction Limits (per KYC verification level)
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_level TEXT NOT NULL CHECK (kyc_level IN ('basic', 'standard', 'enhanced')),
  daily_limit NUMERIC(12,2) NOT NULL,
  monthly_limit NUMERIC(12,2) NOT NULL,
  single_transaction_limit NUMERIC(12,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kyc_level)
);

ALTER TABLE transaction_limits ENABLE ROW LEVEL SECURITY;

-- Everyone can read limits (needed for client-side display)
CREATE POLICY limits_select ON transaction_limits
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY limits_admin_all ON transaction_limits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Seed default UK limits
INSERT INTO transaction_limits (kyc_level, daily_limit, monthly_limit, single_transaction_limit, description) VALUES
  ('basic', 1000, 5000, 500, 'Basic verification — limited access'),
  ('standard', 10000, 50000, 5000, 'Standard verification — full retail banking'),
  ('enhanced', 50000, 250000, 25000, 'Enhanced verification — high-value banking')
ON CONFLICT (kyc_level) DO NOTHING;

-- ============================================================
-- SCA Challenges (Strong Customer Authentication)
-- ============================================================
CREATE TABLE IF NOT EXISTS sca_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  challenge_code TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sca_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY sca_customer_select ON sca_challenges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY sca_customer_insert ON sca_challenges
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY sca_customer_update ON sca_challenges
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY sca_admin_select ON sca_challenges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor'))
  );

CREATE INDEX IF NOT EXISTS idx_sca_user_action ON sca_challenges(user_id, action);
CREATE INDEX IF NOT EXISTS idx_sca_expires ON sca_challenges(expires_at);

-- ============================================================
-- SCA Configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS sca_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sca_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY sca_config_select ON sca_config
  FOR SELECT USING (true);

CREATE POLICY sca_config_admin_all ON sca_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Seed SCA config
INSERT INTO sca_config (config_key, config_value, description) VALUES
  ('amount_threshold', '{"value": 25}', 'Amount threshold (GBP) above which SCA is required'),
  ('enabled', '{"value": true}', 'Master switch for SCA enforcement'),
  ('max_attempts', '{"value": 3}', 'Max verification attempts before challenge expires'),
  ('expiry_seconds', '{"value": 300}', 'Challenge expiry in seconds (5 minutes)'),
  ('sensitive_actions', '{"value": ["change_password", "toggle_2fa", "add_payee", "large_payment"]}', 'Actions that always require SCA regardless of amount')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- Cooling Period Configuration (APP Fraud Prevention)
-- ============================================================
CREATE TABLE IF NOT EXISTS cooling_period_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_rail TEXT UNIQUE NOT NULL CHECK (payment_rail IN ('fps', 'bacs', 'chaps', 'internal')),
  cooling_hours INT NOT NULL DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cooling_period_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY cooling_select ON cooling_period_config
  FOR SELECT USING (true);

CREATE POLICY cooling_admin_all ON cooling_period_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Seed cooling periods — FPS has 24h cooling, others are instant
INSERT INTO cooling_period_config (payment_rail, cooling_hours, description) VALUES
  ('fps', 24, 'Faster Payments — 24-hour cooling period for new payees'),
  ('bacs', 0, 'BACS — no cooling period (3-day clearing provides natural delay)'),
  ('chaps', 0, 'CHAPS — no cooling period (manual high-value process)'),
  ('internal', 0, 'Internal transfers — no cooling period')
ON CONFLICT (payment_rail) DO NOTHING;

-- ============================================================
-- Suspicious Activity Reports (SAR)
-- ============================================================
CREATE TABLE IF NOT EXISTS suspicious_activity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aml_alert_id UUID REFERENCES aml_alerts(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  filed_by UUID NOT NULL REFERENCES profiles(id),
  sar_reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'submitted', 'acknowledged', 'rejected')),
  reason TEXT NOT NULL,
  suspicious_activity_description TEXT NOT NULL,
  transaction_ids JSONB DEFAULT '[]',
  total_amount NUMERIC(12,2),
  period_start DATE,
  period_end DATE,
  nca_reference TEXT,
  submitted_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suspicious_activity_reports ENABLE ROW LEVEL SECURITY;

-- Only admins/auditors can see SARs (tipping-off protection)
CREATE POLICY sar_admin_select ON suspicious_activity_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor'))
  );

CREATE POLICY sar_admin_all ON suspicious_activity_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_sar_status ON suspicious_activity_reports(status);
CREATE INDEX IF NOT EXISTS idx_sar_user ON suspicious_activity_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_sar_filed_by ON suspicious_activity_reports(filed_by);

-- SAR reference sequence
CREATE SEQUENCE IF NOT EXISTS sar_ref_seq START 1;

-- SAR Dashboard Stats RPC
CREATE OR REPLACE FUNCTION sar_dashboard_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM suspicious_activity_reports),
    'draft', (SELECT COUNT(*) FROM suspicious_activity_reports WHERE status = 'draft'),
    'pending_review', (SELECT COUNT(*) FROM suspicious_activity_reports WHERE status = 'pending_review'),
    'submitted', (SELECT COUNT(*) FROM suspicious_activity_reports WHERE status = 'submitted'),
    'acknowledged', (SELECT COUNT(*) FROM suspicious_activity_reports WHERE status = 'acknowledged'),
    'this_month', (
      SELECT COUNT(*) FROM suspicious_activity_reports
      WHERE created_at >= date_trunc('month', NOW())
    ),
    'total_amount', (SELECT COALESCE(SUM(total_amount), 0) FROM suspicious_activity_reports)
  )
$$;

-- ============================================================
-- Interest Configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS interest_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type TEXT UNIQUE NOT NULL,
  annual_rate NUMERIC(6,4) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interest_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY interest_config_select ON interest_config
  FOR SELECT USING (true);

CREATE POLICY interest_config_admin_all ON interest_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Seed interest rates
INSERT INTO interest_config (account_type, annual_rate, description) VALUES
  ('savings', 0.0350, 'Standard savings account — 3.50% AER'),
  ('current', 0.0010, 'Current account — 0.10% AER'),
  ('isa', 0.0425, 'Cash ISA — 4.25% AER'),
  ('business', 0.0050, 'Business current account — 0.50% AER'),
  ('personal_loan', 0.0690, 'Personal loan — 6.90% APR'),
  ('mortgage', 0.0450, 'Mortgage — 4.50% APR'),
  ('auto_loan', 0.0590, 'Auto loan — 5.90% APR'),
  ('student_loan', 0.0740, 'Student loan — 7.40% APR')
ON CONFLICT (account_type) DO NOTHING;

-- ============================================================
-- Interest Accruals (daily records)
-- ============================================================
CREATE TABLE IF NOT EXISTS interest_accruals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  accrual_date DATE NOT NULL,
  balance_snapshot NUMERIC(12,2) NOT NULL,
  annual_rate NUMERIC(6,4) NOT NULL,
  daily_amount NUMERIC(12,6) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, accrual_date)
);

ALTER TABLE interest_accruals ENABLE ROW LEVEL SECURITY;

-- Customers see their own accruals
CREATE POLICY accruals_customer_select ON interest_accruals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = interest_accruals.account_id AND accounts.user_id = auth.uid())
  );

-- Admins see all
CREATE POLICY accruals_admin_select ON interest_accruals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor'))
  );

CREATE POLICY accruals_admin_all ON interest_accruals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_accruals_account_date ON interest_accruals(account_id, accrual_date DESC);

-- ============================================================
-- ALTER existing tables
-- ============================================================

-- Add first_used_at to payees for cooling period tracking
ALTER TABLE payees ADD COLUMN IF NOT EXISTS first_used_at TIMESTAMPTZ;

-- Add sar_flag to profiles for tipping-off protection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sar_flag BOOLEAN DEFAULT FALSE;

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_limits_kyc_level ON transaction_limits(kyc_level);
CREATE INDEX IF NOT EXISTS idx_sar_reference ON suspicious_activity_reports(sar_reference);
CREATE INDEX IF NOT EXISTS idx_interest_config_type ON interest_config(account_type);
