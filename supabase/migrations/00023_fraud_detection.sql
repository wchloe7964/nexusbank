-- ============================================================
-- Migration 00023: Fraud Detection System
-- Transaction scoring, configurable rules, case management
-- ============================================================

-- 1. Fraud scores (per-transaction)
CREATE TABLE public.fraud_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'review', 'block')),
  factors JSONB DEFAULT '[]',
  model_version TEXT DEFAULT 'v1',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_decision TEXT CHECK (review_decision IN ('approved', 'blocked', 'escalated')),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_scores_user ON public.fraud_scores(user_id);
CREATE INDEX idx_fraud_scores_tx ON public.fraud_scores(transaction_id);
CREATE INDEX idx_fraud_scores_decision ON public.fraud_scores(decision);
CREATE INDEX idx_fraud_scores_created ON public.fraud_scores(created_at DESC);

ALTER TABLE public.fraud_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud scores"
  ON public.fraud_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

CREATE POLICY "System can insert fraud scores"
  ON public.fraud_scores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update fraud scores"
  ON public.fraud_scores FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));


-- 2. Fraud rules (configurable)
CREATE TABLE public.fraud_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'velocity', 'amount', 'geographic', 'behavioural', 'device', 'time_based'
  )),
  conditions JSONB NOT NULL DEFAULT '{}',
  weight INTEGER DEFAULT 10 CHECK (weight >= 0 AND weight <= 100),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fraud_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud rules"
  ON public.fraud_rules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

CREATE POLICY "Admins can manage fraud rules"
  ON public.fraud_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Seed default fraud rules
INSERT INTO public.fraud_rules (name, description, rule_type, conditions, weight, is_active) VALUES
  ('High velocity', 'More than 5 transactions in 1 hour', 'velocity', '{"max_transactions": 5, "window_minutes": 60}', 25, true),
  ('Large amount', 'Transaction exceeds 3x user average', 'amount', '{"multiplier": 3}', 30, true),
  ('Very large amount', 'Single transaction over £5,000', 'amount', '{"threshold": 5000}', 20, true),
  ('New payee large', 'Large payment to payee added in last 24 hours', 'behavioural', '{"payee_age_hours": 24, "amount_threshold": 1000}', 35, true),
  ('Unusual hour', 'Transaction between 1am and 5am', 'time_based', '{"start_hour": 1, "end_hour": 5}', 15, true),
  ('Multiple failed attempts', 'More than 3 failed login attempts before transaction', 'behavioural', '{"max_failures": 3, "window_hours": 1}', 40, true);


-- 3. Fraud cases (investigation workflow)
CREATE TABLE public.fraud_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fraud_score_id UUID REFERENCES public.fraud_scores(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'confirmed_fraud', 'false_positive', 'closed'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  resolution TEXT,
  amount_at_risk NUMERIC,
  amount_recovered NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_cases_user ON public.fraud_cases(user_id);
CREATE INDEX idx_fraud_cases_status ON public.fraud_cases(status);
CREATE INDEX idx_fraud_cases_priority ON public.fraud_cases(priority);
CREATE INDEX idx_fraud_cases_created ON public.fraud_cases(created_at DESC);

ALTER TABLE public.fraud_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud cases"
  ON public.fraud_cases FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

CREATE POLICY "Admins can manage fraud cases"
  ON public.fraud_cases FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));


-- 4. Device fingerprints
CREATE TABLE public.device_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  is_trusted BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_device_fp_user ON public.device_fingerprints(user_id);
CREATE UNIQUE INDEX idx_device_fp_hash ON public.device_fingerprints(user_id, fingerprint_hash);

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON public.device_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own devices"
  ON public.device_fingerprints FOR ALL
  USING (auth.uid() = user_id);


-- 5. Fraud stats function
CREATE OR REPLACE FUNCTION public.fraud_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_cases INT;
  v_blocked_today INT;
  v_review_pending INT;
  v_confirmed_fraud INT;
  v_total_at_risk NUMERIC;
  v_total_recovered NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_open_cases
    FROM public.fraud_cases WHERE status IN ('open', 'investigating');

  SELECT COUNT(*) INTO v_blocked_today
    FROM public.fraud_scores
    WHERE decision = 'block'
    AND created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_review_pending
    FROM public.fraud_scores
    WHERE decision = 'review'
    AND reviewed_by IS NULL;

  SELECT COUNT(*) INTO v_confirmed_fraud
    FROM public.fraud_cases WHERE status = 'confirmed_fraud';

  SELECT COALESCE(SUM(amount_at_risk), 0) INTO v_total_at_risk
    FROM public.fraud_cases WHERE status IN ('open', 'investigating', 'confirmed_fraud');

  SELECT COALESCE(SUM(amount_recovered), 0) INTO v_total_recovered
    FROM public.fraud_cases WHERE status = 'confirmed_fraud';

  RETURN json_build_object(
    'open_cases', v_open_cases,
    'blocked_today', v_blocked_today,
    'review_pending', v_review_pending,
    'confirmed_fraud', v_confirmed_fraud,
    'total_at_risk', v_total_at_risk,
    'total_recovered', v_total_recovered
  );
END;
$$;
