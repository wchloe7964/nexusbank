-- Credit Card Products & Management
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  card_number_last_four TEXT NOT NULL CHECK (length(card_number_last_four) = 4),
  card_network TEXT NOT NULL CHECK (card_network IN ('visa', 'mastercard')),
  credit_limit NUMERIC(12,2) NOT NULL CHECK (credit_limit > 0),
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  available_credit NUMERIC(12,2) NOT NULL,
  minimum_payment NUMERIC(12,2) NOT NULL DEFAULT 0,
  apr NUMERIC(5,2) NOT NULL,
  payment_due_date DATE,
  statement_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  rewards_rate NUMERIC(5,4) DEFAULT 0,
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_status ON public.credit_cards(user_id, status);

-- RLS
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit cards"
  ON public.credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit cards"
  ON public.credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit cards"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit cards"
  ON public.credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- PL/pgSQL: Atomic credit card payment
CREATE OR REPLACE FUNCTION public.make_credit_card_payment(
  p_credit_card_id UUID,
  p_from_account_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_card RECORD;
  v_account RECORD;
BEGIN
  -- Lock credit card row
  SELECT * INTO v_card FROM public.credit_cards WHERE id = p_credit_card_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit card not found';
  END IF;
  IF v_card.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_card.status = 'closed' THEN
    RAISE EXCEPTION 'Credit card is closed';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;
  IF p_amount > v_card.current_balance THEN
    RAISE EXCEPTION 'Payment exceeds current balance';
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

  -- Reduce credit card balance
  UPDATE public.credit_cards
  SET current_balance = current_balance - p_amount,
      available_credit = available_credit + p_amount,
      minimum_payment = GREATEST(0, (current_balance - p_amount) * 0.02),
      updated_at = NOW()
  WHERE id = p_credit_card_id;

  -- Create transaction record
  INSERT INTO public.transactions (
    account_id, type, category, amount, currency_code, description,
    counterparty_name, status, transaction_date, balance_after
  ) VALUES (
    p_from_account_id, 'debit', 'bills', p_amount, 'GBP',
    'Credit card payment - ' || v_card.card_name,
    'NexusBank Credit Cards', 'completed', NOW(),
    v_account.available_balance - p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
