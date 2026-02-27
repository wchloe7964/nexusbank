-- ============================================================
-- Migration 00021: Audit & Compliance Foundation
-- Immutable audit log, compliance reports, data retention
-- ============================================================

-- 1. Audit log (append-only, immutable)
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'data_access', 'data_change', 'admin_action', 'auth_event',
    'payment_event', 'compliance_event', 'fraud_event'
  )),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  target_table TEXT,
  target_id TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_target ON public.audit_log(target_table, target_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);

-- RLS: append-only — admins/auditors can SELECT, insert via SECURITY DEFINER function only
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins and auditors can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  );

-- NO INSERT/UPDATE/DELETE policies for direct access — all writes go through SECURITY DEFINER function


-- 2. Compliance reports
CREATE TABLE public.compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'sar', 'str', 'ctr', 'annual_aml', 'quarterly_fca',
    'pci_dss_saq', 'data_retention', 'risk_assessment', 'custom'
  )),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_progress', 'pending_review', 'approved', 'submitted', 'rejected'
  )),
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  reporting_period_start DATE,
  reporting_period_end DATE,
  data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_reports_type ON public.compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_status ON public.compliance_reports(status);
CREATE INDEX idx_compliance_reports_created ON public.compliance_reports(created_at DESC);

ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view compliance reports"
  ON public.compliance_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  );

CREATE POLICY "Admins can insert compliance reports"
  ON public.compliance_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  );

CREATE POLICY "Admins can update compliance reports"
  ON public.compliance_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  );


-- 3. Data retention policies
CREATE TABLE public.data_retention_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  last_cleanup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view retention policies"
  ON public.data_retention_policies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'auditor')
    )
  );

CREATE POLICY "Super admins can manage retention policies"
  ON public.data_retention_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Seed default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, description) VALUES
  ('audit_log', 2555, 'Audit logs retained for 7 years (FCA requirement)'),
  ('login_activity', 730, 'Login activity retained for 2 years'),
  ('transactions', 2555, 'Transaction records retained for 7 years'),
  ('notifications', 365, 'Notifications retained for 1 year'),
  ('disputes', 2555, 'Dispute records retained for 7 years');


-- 4. Add 'auditor' to profiles role constraint
-- Drop old constraint and recreate with auditor
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'super_admin', 'auditor'));


-- 5. SECURITY DEFINER function for audit log insertion
-- This bypasses RLS so application code can log without direct INSERT policy
CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_event_type TEXT,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_target_table TEXT,
  p_target_id TEXT,
  p_action TEXT,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.audit_log (
    event_type, actor_id, actor_role, target_table, target_id,
    action, details, ip_address, user_agent
  ) VALUES (
    p_event_type, p_actor_id, p_actor_role, p_target_table, p_target_id,
    p_action, p_details, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- 6. Audit stats function for dashboard
CREATE OR REPLACE FUNCTION public.audit_stats(p_days INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_events BIGINT;
  v_admin_actions BIGINT;
  v_data_access BIGINT;
  v_auth_events BIGINT;
  v_payment_events BIGINT;
  v_compliance_events BIGINT;
  v_fraud_events BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_events
    FROM public.audit_log
    WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT COUNT(*) INTO v_admin_actions
    FROM public.audit_log
    WHERE event_type = 'admin_action'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT COUNT(*) INTO v_data_access
    FROM public.audit_log
    WHERE event_type = 'data_access'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT COUNT(*) INTO v_auth_events
    FROM public.audit_log
    WHERE event_type = 'auth_event'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT COUNT(*) INTO v_payment_events
    FROM public.audit_log
    WHERE event_type = 'payment_event'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT COUNT(*) INTO v_compliance_events
    FROM public.audit_log
    WHERE event_type = 'compliance_event'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  SELECT COUNT(*) INTO v_fraud_events
    FROM public.audit_log
    WHERE event_type = 'fraud_event'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN json_build_object(
    'total_events', v_total_events,
    'admin_actions', v_admin_actions,
    'data_access', v_data_access,
    'auth_events', v_auth_events,
    'payment_events', v_payment_events,
    'compliance_events', v_compliance_events,
    'fraud_events', v_fraud_events,
    'period_days', p_days
  );
END;
$$;
