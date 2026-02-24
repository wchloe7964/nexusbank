-- =============================================
-- Transaction Disputes
-- =============================================

CREATE TABLE public.disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'unauthorized', 'duplicate', 'wrong_amount', 'not_received', 'defective', 'cancelled', 'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'information_requested', 'resolved_refunded', 'resolved_denied', 'closed'
  )),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_disputes_user_id ON public.disputes(user_id);
CREATE INDEX idx_disputes_transaction_id ON public.disputes(transaction_id);
CREATE INDEX idx_disputes_status ON public.disputes(user_id, status);

-- RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disputes"
  ON public.disputes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disputes"
  ON public.disputes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own disputes"
  ON public.disputes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
