-- =============================================
-- Monthly Budgets
-- =============================================

CREATE TABLE public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'transfer', 'salary', 'bills', 'groceries', 'shopping',
    'transport', 'entertainment', 'dining', 'health',
    'education', 'subscriptions', 'cash', 'other'
  )),
  monthly_limit NUMERIC(19,4) NOT NULL CHECK (monthly_limit > 0),
  currency_code CHAR(3) DEFAULT 'GBP',
  is_active BOOLEAN DEFAULT TRUE,
  alert_threshold NUMERIC(3,2) DEFAULT 0.80 CHECK (alert_threshold > 0 AND alert_threshold <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_budget_per_user_category UNIQUE (user_id, category)
);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);

-- RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE USING (auth.uid() = user_id);
