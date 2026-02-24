-- =============================================
-- Savings Goals (Pots)
-- =============================================

CREATE TABLE public.savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'emergency-fund', 'holiday', 'home-deposit', 'general', 'retirement', 'other'
  )),
  target_amount NUMERIC(19,4) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(19,4) DEFAULT 0.00 CHECK (current_amount >= 0),
  currency_code CHAR(3) DEFAULT 'GBP',
  target_date DATE,
  icon TEXT DEFAULT 'piggy-bank',
  color TEXT DEFAULT 'blue' CHECK (color IN (
    'blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'amber', 'red'
  )),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX idx_savings_goals_account_id ON public.savings_goals(account_id);

-- RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings goals"
  ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
  ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
  ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
  ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- Atomic function: move money into/out of a savings goal
CREATE OR REPLACE FUNCTION public.adjust_savings_goal(
  p_goal_id UUID,
  p_amount NUMERIC(19,4),
  p_description TEXT DEFAULT 'Savings adjustment'
)
RETURNS VOID AS $$
DECLARE
  v_goal RECORD;
  v_new_goal_amount NUMERIC(19,4);
  v_account_balance NUMERIC(19,4);
BEGIN
  -- Lock and fetch goal
  SELECT * INTO v_goal FROM public.savings_goals WHERE id = p_goal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;
  IF v_goal.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_new_goal_amount := v_goal.current_amount + p_amount;
  IF v_new_goal_amount < 0 THEN
    RAISE EXCEPTION 'Cannot withdraw more than current goal balance';
  END IF;

  -- For deposits (positive): deduct from account
  -- For withdrawals (negative): add back to account
  UPDATE public.accounts
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount,
        updated_at = NOW()
    WHERE id = v_goal.account_id
    RETURNING balance INTO v_account_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_account_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient funds in account';
  END IF;

  -- Update goal amount
  UPDATE public.savings_goals
    SET current_amount = v_new_goal_amount,
        is_completed = (v_new_goal_amount >= target_amount),
        completed_at = CASE WHEN v_new_goal_amount >= target_amount THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_goal_id;

  -- Create transaction record
  INSERT INTO public.transactions
    (account_id, type, category, amount, description, status, transaction_date)
  VALUES (
    v_goal.account_id,
    CASE WHEN p_amount > 0 THEN 'debit' ELSE 'credit' END,
    'transfer',
    ABS(p_amount),
    p_description,
    'completed',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
