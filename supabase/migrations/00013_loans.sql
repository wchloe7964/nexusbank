-- Loans Dashboard
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_name TEXT NOT NULL,
  loan_type TEXT NOT NULL CHECK (loan_type IN ('personal', 'mortgage', 'auto', 'student')),
  original_amount NUMERIC(12,2) NOT NULL CHECK (original_amount > 0),
  remaining_balance NUMERIC(12,2) NOT NULL CHECK (remaining_balance >= 0),
  monthly_payment NUMERIC(12,2) NOT NULL CHECK (monthly_payment > 0),
  interest_rate NUMERIC(5,2) NOT NULL,
  term_months INTEGER NOT NULL CHECK (term_months > 0),
  months_remaining INTEGER NOT NULL CHECK (months_remaining >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  next_payment_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted')),
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(user_id, status);

-- RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loans"
  ON public.loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans"
  ON public.loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans"
  ON public.loans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans"
  ON public.loans FOR DELETE
  USING (auth.uid() = user_id);

-- PL/pgSQL: Atomic loan overpayment
CREATE OR REPLACE FUNCTION public.make_loan_overpayment(
  p_loan_id UUID,
  p_from_account_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_loan RECORD;
  v_account RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Lock loan row
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;
  IF v_loan.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_loan.status != 'active' THEN
    RAISE EXCEPTION 'Loan is not active';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;
  IF p_amount > v_loan.remaining_balance THEN
    RAISE EXCEPTION 'Payment exceeds remaining balance';
  END IF;

  -- Lock account row
  SELECT * INTO v_account FROM public.accounts WHERE id = p_from_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF v_account.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_account.available_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Deduct from account
  UPDATE public.accounts
  SET balance = balance - p_amount,
      available_balance = available_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_from_account_id;

  -- Update loan
  v_new_balance := v_loan.remaining_balance - p_amount;

  UPDATE public.loans
  SET remaining_balance = v_new_balance,
      months_remaining = CASE
        WHEN v_new_balance <= 0 THEN 0
        ELSE GREATEST(1, CEIL(v_new_balance / v_loan.monthly_payment))
      END,
      status = CASE WHEN v_new_balance <= 0 THEN 'paid_off' ELSE 'active' END,
      updated_at = NOW()
  WHERE id = p_loan_id;

  -- Create transaction record
  INSERT INTO public.transactions (
    account_id, type, category, amount, currency_code, description,
    counterparty_name, status, transaction_date, balance_after
  ) VALUES (
    p_from_account_id, 'debit', 'bills', p_amount, 'GBP',
    'Loan overpayment - ' || v_loan.loan_name,
    'NexusBank Loans', 'completed', NOW(),
    v_account.available_balance - p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
