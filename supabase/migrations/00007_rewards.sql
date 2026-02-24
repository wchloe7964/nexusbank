-- Rewards & Cashback
-- Adds rewards tracking for cashback on card transactions

-- Add rewards balance to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rewards_balance NUMERIC(19,4) DEFAULT 0.00;

-- Rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('cashback_dining','cashback_shopping','cashback_subscriptions','cashback_other')),
  category TEXT NOT NULL,
  status TEXT DEFAULT 'earned' CHECK (status IN ('earned','redeemed','expired')),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON public.rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_status ON public.rewards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_rewards_transaction_id ON public.rewards(transaction_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON public.rewards(created_at DESC);

-- RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON public.rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON public.rewards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
