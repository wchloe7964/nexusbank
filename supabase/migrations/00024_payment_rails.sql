-- ============================================================
-- Migration 00024: Payment Rails (FPS, BACS, CHAPS)
-- Payment scheme integration, Confirmation of Payee, settlements
-- ============================================================

-- 1. Payment submissions
CREATE TABLE public.payment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rail TEXT NOT NULL CHECK (rail IN ('fps', 'bacs', 'chaps', 'internal')),
  rail_status TEXT DEFAULT 'initiated' CHECK (rail_status IN (
    'initiated', 'submitted', 'processing', 'settled', 'failed', 'returned'
  )),
  amount NUMERIC NOT NULL,
  currency_code TEXT DEFAULT 'GBP',
  payee_name TEXT,
  payee_sort_code TEXT,
  payee_account_number TEXT,
  reference TEXT,
  cop_result TEXT CHECK (cop_result IN ('match', 'close_match', 'no_match', 'unavailable')),
  cop_matched_name TEXT,
  fraud_score_id UUID REFERENCES public.fraud_scores(id) ON DELETE SET NULL,
  aml_checked BOOLEAN DEFAULT FALSE,
  settlement_date DATE,
  failure_reason TEXT,
  submitted_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_sub_user ON public.payment_submissions(user_id);
CREATE INDEX idx_payment_sub_rail ON public.payment_submissions(rail);
CREATE INDEX idx_payment_sub_status ON public.payment_submissions(rail_status);
CREATE INDEX idx_payment_sub_created ON public.payment_submissions(created_at DESC);
CREATE INDEX idx_payment_sub_settlement ON public.payment_submissions(settlement_date) WHERE rail_status = 'processing';

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment submissions"
  ON public.payment_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment submissions"
  ON public.payment_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

CREATE POLICY "System can insert payment submissions"
  ON public.payment_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update payment submissions"
  ON public.payment_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));


-- 2. Payment scheme configuration
CREATE TABLE public.payment_scheme_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rail TEXT NOT NULL UNIQUE CHECK (rail IN ('fps', 'bacs', 'chaps', 'internal')),
  display_name TEXT NOT NULL,
  max_amount NUMERIC NOT NULL,
  clearing_days INTEGER NOT NULL DEFAULT 0,
  cutoff_time TIME,
  fee NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_scheme_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment config"
  ON public.payment_scheme_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage payment config"
  ON public.payment_scheme_config FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

-- Seed payment schemes
INSERT INTO public.payment_scheme_config (rail, display_name, max_amount, clearing_days, cutoff_time, fee, is_active, description) VALUES
  ('fps', 'Faster Payments', 1000000, 0, NULL, 0, true, 'Instant transfers up to £1,000,000. Available 24/7.'),
  ('bacs', 'BACS', 20000000, 3, '22:30', 0, true, 'Standard bank transfers. 3-day clearing cycle. Free.'),
  ('chaps', 'CHAPS', 999999999, 0, '14:30', 25, true, 'Same-day high-value payments. £25 fee. Weekdays until 2:30pm.'),
  ('internal', 'Internal Transfer', 999999999, 0, NULL, 0, true, 'Instant transfers between NexusBank accounts. Free.');


-- 3. Payment rails stats function
CREATE OR REPLACE FUNCTION public.payment_rails_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending INT;
  v_settled_today INT;
  v_failed INT;
  v_total_volume_today NUMERIC;
  v_fps_count INT;
  v_bacs_count INT;
  v_chaps_count INT;
BEGIN
  SELECT COUNT(*) INTO v_pending
    FROM public.payment_submissions WHERE rail_status IN ('initiated', 'submitted', 'processing');

  SELECT COUNT(*) INTO v_settled_today
    FROM public.payment_submissions
    WHERE rail_status = 'settled' AND settled_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_failed
    FROM public.payment_submissions
    WHERE rail_status IN ('failed', 'returned')
    AND created_at >= NOW() - INTERVAL '7 days';

  SELECT COALESCE(SUM(amount), 0) INTO v_total_volume_today
    FROM public.payment_submissions
    WHERE created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_fps_count
    FROM public.payment_submissions WHERE rail = 'fps' AND created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_bacs_count
    FROM public.payment_submissions WHERE rail = 'bacs' AND rail_status = 'processing';

  SELECT COUNT(*) INTO v_chaps_count
    FROM public.payment_submissions WHERE rail = 'chaps' AND created_at >= CURRENT_DATE;

  RETURN json_build_object(
    'pending', v_pending,
    'settled_today', v_settled_today,
    'failed_7d', v_failed,
    'volume_today', v_total_volume_today,
    'fps_today', v_fps_count,
    'bacs_processing', v_bacs_count,
    'chaps_today', v_chaps_count
  );
END;
$$;
