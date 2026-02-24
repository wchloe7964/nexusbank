-- Feature 5: Spending Alerts & Rules
CREATE TABLE IF NOT EXISTS public.spending_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('single_transaction', 'category_monthly', 'balance_below', 'merchant_payment', 'large_incoming')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category TEXT,
  merchant_name TEXT,
  threshold_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.spending_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spending alerts"
  ON public.spending_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending alerts"
  ON public.spending_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending alerts"
  ON public.spending_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spending alerts"
  ON public.spending_alerts FOR DELETE
  USING (auth.uid() = user_id);
