-- ============================================================
-- Migration 00022: KYC/AML Compliance
-- Know Your Customer verification, Anti-Money Laundering monitoring
-- ============================================================

-- 1. KYC Verifications
CREATE TABLE public.kyc_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'standard', 'enhanced')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'documents_required', 'under_review', 'verified', 'failed', 'expired'
  )),
  risk_rating TEXT DEFAULT 'low' CHECK (risk_rating IN ('low', 'medium', 'high', 'very_high')),
  identity_verified BOOLEAN DEFAULT FALSE,
  address_verified BOOLEAN DEFAULT FALSE,
  source_of_funds TEXT,
  source_of_wealth TEXT,
  pep_status BOOLEAN DEFAULT FALSE,
  sanctions_checked BOOLEAN DEFAULT FALSE,
  sanctions_clear BOOLEAN DEFAULT TRUE,
  next_review_date DATE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kyc_user ON public.kyc_verifications(user_id);
CREATE INDEX idx_kyc_status ON public.kyc_verifications(status);
CREATE INDEX idx_kyc_risk ON public.kyc_verifications(risk_rating);
CREATE INDEX idx_kyc_review ON public.kyc_verifications(next_review_date) WHERE next_review_date IS NOT NULL;

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
  ON public.kyc_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC"
  ON public.kyc_verifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

CREATE POLICY "Users can insert own KYC"
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update KYC"
  ON public.kyc_verifications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));


-- 2. KYC Documents
CREATE TABLE public.kyc_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kyc_id UUID NOT NULL REFERENCES public.kyc_verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'passport', 'driving_licence', 'national_id', 'utility_bill',
    'bank_statement', 'tax_return', 'council_tax'
  )),
  document_category TEXT NOT NULL CHECK (document_category IN ('identity', 'address', 'financial')),
  file_name TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'reviewing', 'accepted', 'rejected')),
  rejection_reason TEXT,
  expires_at DATE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kyc_docs_kyc ON public.kyc_documents(kyc_id);
CREATE INDEX idx_kyc_docs_user ON public.kyc_documents(user_id);
CREATE INDEX idx_kyc_docs_status ON public.kyc_documents(status);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC documents"
  ON public.kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC documents"
  ON public.kyc_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

CREATE POLICY "Users can upload KYC documents"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update KYC documents"
  ON public.kyc_documents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));


-- 3. AML Alerts
CREATE TABLE public.aml_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'large_transaction', 'velocity', 'pattern', 'sanctions_hit',
    'pep_activity', 'structuring', 'unusual_activity'
  )),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  trigger_amount NUMERIC,
  trigger_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'investigating', 'escalated', 'dismissed', 'reported'
  )),
  sar_filed BOOLEAN DEFAULT FALSE,
  sar_reference TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aml_alerts_user ON public.aml_alerts(user_id);
CREATE INDEX idx_aml_alerts_status ON public.aml_alerts(status);
CREATE INDEX idx_aml_alerts_severity ON public.aml_alerts(severity);
CREATE INDEX idx_aml_alerts_type ON public.aml_alerts(alert_type);
CREATE INDEX idx_aml_alerts_created ON public.aml_alerts(created_at DESC);

ALTER TABLE public.aml_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AML alerts"
  ON public.aml_alerts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

CREATE POLICY "Admins can manage AML alerts"
  ON public.aml_alerts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));


-- 4. Add KYC fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started'
  CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'failed', 'expired'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS risk_rating TEXT DEFAULT 'low'
  CHECK (risk_rating IN ('low', 'medium', 'high', 'very_high'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_category TEXT DEFAULT 'retail'
  CHECK (customer_category IN ('retail', 'business', 'premium', 'high_net_worth'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pep_status BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sanctions_clear BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_next_review DATE;


-- 5. AML monitoring stats function
CREATE OR REPLACE FUNCTION public.aml_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_alerts INT;
  v_investigating INT;
  v_critical INT;
  v_sars_filed INT;
  v_pending_kyc INT;
  v_high_risk INT;
BEGIN
  SELECT COUNT(*) INTO v_new_alerts
    FROM public.aml_alerts WHERE status = 'new';

  SELECT COUNT(*) INTO v_investigating
    FROM public.aml_alerts WHERE status = 'investigating';

  SELECT COUNT(*) INTO v_critical
    FROM public.aml_alerts WHERE severity = 'critical' AND status NOT IN ('dismissed', 'reported');

  SELECT COUNT(*) INTO v_sars_filed
    FROM public.aml_alerts WHERE sar_filed = true;

  SELECT COUNT(*) INTO v_pending_kyc
    FROM public.kyc_verifications WHERE status IN ('pending', 'documents_required', 'under_review');

  SELECT COUNT(*) INTO v_high_risk
    FROM public.profiles WHERE risk_rating IN ('high', 'very_high') AND role = 'customer';

  RETURN json_build_object(
    'new_alerts', v_new_alerts,
    'investigating', v_investigating,
    'critical_alerts', v_critical,
    'sars_filed', v_sars_filed,
    'pending_kyc', v_pending_kyc,
    'high_risk_customers', v_high_risk
  );
END;
$$;
