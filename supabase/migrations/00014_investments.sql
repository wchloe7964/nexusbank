-- Investment Portfolio
CREATE TABLE IF NOT EXISTS public.investment_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('stocks_isa', 'lifetime_isa', 'general_investment', 'pension')),
  total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_invested NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_gain_loss NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency_code TEXT DEFAULT 'GBP',
  opened_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_accounts_user ON public.investment_accounts(user_id);

ALTER TABLE public.investment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investment accounts"
  ON public.investment_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment accounts"
  ON public.investment_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment accounts"
  ON public.investment_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment accounts"
  ON public.investment_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Holdings
CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_account_id UUID NOT NULL REFERENCES public.investment_accounts(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'bond', 'etf', 'fund', 'cash')),
  ticker TEXT,
  quantity NUMERIC(12,4) NOT NULL DEFAULT 0,
  avg_buy_price NUMERIC(12,4) NOT NULL DEFAULT 0,
  current_price NUMERIC(12,4) NOT NULL DEFAULT 0,
  current_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  gain_loss NUMERIC(12,2) NOT NULL DEFAULT 0,
  gain_loss_pct NUMERIC(8,4) NOT NULL DEFAULT 0,
  allocation_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holdings_account ON public.holdings(investment_account_id);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- Holdings RLS via investment_accounts join
CREATE POLICY "Users can view own holdings"
  ON public.holdings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investment_accounts ia
      WHERE ia.id = holdings.investment_account_id
      AND ia.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own holdings"
  ON public.holdings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.investment_accounts ia
      WHERE ia.id = holdings.investment_account_id
      AND ia.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own holdings"
  ON public.holdings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.investment_accounts ia
      WHERE ia.id = holdings.investment_account_id
      AND ia.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own holdings"
  ON public.holdings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.investment_accounts ia
      WHERE ia.id = holdings.investment_account_id
      AND ia.user_id = auth.uid()
    )
  );
