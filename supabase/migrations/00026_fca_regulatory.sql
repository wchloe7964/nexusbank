-- Phase 6: FCA Regulatory Controls
-- Complaints handling, product suitability, regulatory returns, capital adequacy

-- ============================================================
-- Complaints (FCA DISP rules — 8-week resolution deadline)
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  reference TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'service_quality', 'fees_charges', 'product_performance',
    'mis_selling', 'data_privacy', 'fraud_scam',
    'accessibility', 'account_management', 'payment_issues', 'other'
  )),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'acknowledged', 'investigating', 'response_issued',
    'resolved', 'escalated_fos', 'closed'
  )),
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('standard', 'urgent', 'vulnerable_customer')),
  assigned_to UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  response TEXT,
  root_cause TEXT,
  remediation TEXT,
  compensation_amount NUMERIC(12,2) DEFAULT 0,
  fos_reference TEXT,
  fos_escalated_at TIMESTAMPTZ,
  fos_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Customers see their own complaints
CREATE POLICY complaints_customer_select ON complaints
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY complaints_customer_insert ON complaints
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins see all
CREATE POLICY complaints_admin_select ON complaints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor'))
  );

CREATE POLICY complaints_admin_update ON complaints
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Sequence for complaint references: CMP-2024-000001
CREATE SEQUENCE IF NOT EXISTS complaint_ref_seq START 1;

-- ============================================================
-- Product Suitability (FCA PROD rules)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_suitability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_type TEXT NOT NULL CHECK (product_type IN (
    'savings_account', 'current_account', 'credit_card', 'personal_loan',
    'mortgage', 'investment_isa', 'general_investment', 'insurance_policy'
  )),
  risk_appetite TEXT CHECK (risk_appetite IN ('conservative', 'moderate', 'balanced', 'growth', 'aggressive')),
  investment_horizon TEXT CHECK (investment_horizon IN ('short_term', 'medium_term', 'long_term')),
  annual_income_band TEXT CHECK (annual_income_band IN ('under_25k', '25k_50k', '50k_100k', '100k_250k', 'over_250k')),
  existing_debt NUMERIC(12,2) DEFAULT 0,
  financial_knowledge TEXT CHECK (financial_knowledge IN ('none', 'basic', 'intermediate', 'advanced')),
  assessment_result TEXT NOT NULL CHECK (assessment_result IN ('suitable', 'potentially_unsuitable', 'unsuitable')),
  assessment_reasons JSONB DEFAULT '[]',
  warnings_shown JSONB DEFAULT '[]',
  customer_acknowledged BOOLEAN DEFAULT FALSE,
  assessed_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_suitability ENABLE ROW LEVEL SECURITY;

CREATE POLICY suitability_customer_select ON product_suitability
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY suitability_customer_insert ON product_suitability
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY suitability_admin_select ON product_suitability
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor'))
  );

-- ============================================================
-- Regulatory Returns (GABRIEL submissions to FCA/PRA)
-- ============================================================
CREATE TABLE IF NOT EXISTS regulatory_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_type TEXT NOT NULL CHECK (return_type IN (
    'capital_adequacy', 'liquidity', 'large_exposures', 'complaints_data',
    'fraud_data', 'psd2_reporting', 'aml_returns', 'operational_risk'
  )),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  submission_deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_review', 'approved', 'submitted', 'accepted', 'rejected'
  )),
  data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  gabriel_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE regulatory_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY returns_admin_select ON regulatory_returns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor'))
  );

CREATE POLICY returns_admin_all ON regulatory_returns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- Capital Adequacy Monitoring
-- ============================================================
CREATE TABLE IF NOT EXISTS capital_adequacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporting_date DATE NOT NULL,
  tier1_capital NUMERIC(15,2) NOT NULL,
  tier2_capital NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_capital NUMERIC(15,2) GENERATED ALWAYS AS (tier1_capital + tier2_capital) STORED,
  risk_weighted_assets NUMERIC(15,2) NOT NULL,
  capital_ratio NUMERIC(6,4) GENERATED ALWAYS AS (
    CASE WHEN risk_weighted_assets > 0
      THEN (tier1_capital + tier2_capital) / risk_weighted_assets
      ELSE 0
    END
  ) STORED,
  tier1_ratio NUMERIC(6,4) GENERATED ALWAYS AS (
    CASE WHEN risk_weighted_assets > 0
      THEN tier1_capital / risk_weighted_assets
      ELSE 0
    END
  ) STORED,
  minimum_requirement NUMERIC(6,4) NOT NULL DEFAULT 0.08,
  buffer_requirement NUMERIC(6,4) NOT NULL DEFAULT 0.025,
  is_compliant BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN risk_weighted_assets > 0
      THEN (tier1_capital + tier2_capital) / risk_weighted_assets >= 0.08
      ELSE TRUE
    END
  ) STORED,
  liquidity_coverage_ratio NUMERIC(6,4),
  leverage_ratio NUMERIC(6,4),
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE capital_adequacy ENABLE ROW LEVEL SECURITY;

CREATE POLICY capital_admin_select ON capital_adequacy
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor'))
  );

CREATE POLICY capital_admin_all ON capital_adequacy
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- Complaints Dashboard Stats RPC
-- ============================================================
CREATE OR REPLACE FUNCTION complaints_dashboard_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM complaints),
    'open', (SELECT COUNT(*) FROM complaints WHERE status NOT IN ('resolved', 'closed')),
    'overdue', (SELECT COUNT(*) FROM complaints WHERE deadline_at < NOW() AND status NOT IN ('resolved', 'closed', 'escalated_fos')),
    'escalated_fos', (SELECT COUNT(*) FROM complaints WHERE status = 'escalated_fos'),
    'avg_resolution_days', (
      SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400)::NUMERIC, 1), 0)
      FROM complaints WHERE resolved_at IS NOT NULL
    ),
    'compensation_total', (SELECT COALESCE(SUM(compensation_amount), 0) FROM complaints),
    'by_category', (
      SELECT COALESCE(json_agg(json_build_object('category', category, 'count', cnt)), '[]')
      FROM (SELECT category, COUNT(*) as cnt FROM complaints GROUP BY category ORDER BY cnt DESC) sub
    ),
    'by_status', (
      SELECT COALESCE(json_agg(json_build_object('status', status, 'count', cnt)), '[]')
      FROM (SELECT status, COUNT(*) as cnt FROM complaints GROUP BY status ORDER BY cnt DESC) sub
    )
  )
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_deadline ON complaints(deadline_at);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suitability_user ON product_suitability(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON regulatory_returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_deadline ON regulatory_returns(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_capital_date ON capital_adequacy(reporting_date DESC);
