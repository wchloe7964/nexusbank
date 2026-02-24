-- Insurance Policy Manager
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('home', 'car', 'life', 'travel', 'health', 'pet')),
  provider TEXT NOT NULL,
  premium_monthly NUMERIC(12,2) NOT NULL CHECK (premium_monthly > 0),
  coverage_amount NUMERIC(12,2) NOT NULL CHECK (coverage_amount > 0),
  excess_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_user ON public.insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_status ON public.insurance_policies(user_id, status);

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance policies"
  ON public.insurance_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance policies"
  ON public.insurance_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance policies"
  ON public.insurance_policies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance policies"
  ON public.insurance_policies FOR DELETE
  USING (auth.uid() = user_id);

-- Insurance Claims
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_reference TEXT NOT NULL,
  claim_type TEXT NOT NULL,
  description TEXT,
  amount_claimed NUMERIC(12,2) NOT NULL CHECK (amount_claimed > 0),
  amount_approved NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'denied', 'paid')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy ON public.insurance_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_user ON public.insurance_claims(user_id);

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance claims"
  ON public.insurance_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance claims"
  ON public.insurance_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance claims"
  ON public.insurance_claims FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance claims"
  ON public.insurance_claims FOR DELETE
  USING (auth.uid() = user_id);
