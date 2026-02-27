-- =============================================
-- Backend Hardening Migration
-- Fixes RLS gaps, schema constraints, atomic functions,
-- audit trails, and concurrency issues.
-- =============================================

-- =============================================
-- 1. FIX TRANSACTION CATEGORY CHECK CONSTRAINT
-- Add 'payment' to allowed categories (used by execute_payee_payment)
-- =============================================
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_category_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_category_check
  CHECK (category IN (
    'transfer', 'salary', 'bills', 'groceries', 'shopping',
    'transport', 'entertainment', 'dining', 'health',
    'education', 'subscriptions', 'cash', 'other', 'payment'
  ));


-- =============================================
-- 2. CHANGE ON DELETE CASCADE TO RESTRICT ON TRANSACTIONS
-- Prevent account deletion from wiping transaction history
-- =============================================
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE RESTRICT;


-- =============================================
-- 3. FIX RLS POLICIES: ADD MISSING WITH CHECK CLAUSES
-- Prevents users from reassigning ownership of rows
-- =============================================

-- spending_alerts
DROP POLICY IF EXISTS "Users can update own spending alerts" ON public.spending_alerts;
CREATE POLICY "Users can update own spending alerts"
  ON public.spending_alerts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- credit_cards
DROP POLICY IF EXISTS "Users can update own credit cards" ON public.credit_cards;
CREATE POLICY "Users can update own credit cards"
  ON public.credit_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- loans
DROP POLICY IF EXISTS "Users can update own loans" ON public.loans;
CREATE POLICY "Users can update own loans"
  ON public.loans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- investment_accounts
DROP POLICY IF EXISTS "Users can update own investment accounts" ON public.investment_accounts;
CREATE POLICY "Users can update own investment accounts"
  ON public.investment_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- insurance_policies
DROP POLICY IF EXISTS "Users can update own insurance policies" ON public.insurance_policies;
CREATE POLICY "Users can update own insurance policies"
  ON public.insurance_policies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- insurance_claims
DROP POLICY IF EXISTS "Users can update own insurance claims" ON public.insurance_claims;
CREATE POLICY "Users can update own insurance claims"
  ON public.insurance_claims FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- holdings (via investment_accounts join)
DROP POLICY IF EXISTS "Users can update own holdings" ON public.holdings;
CREATE POLICY "Users can update own holdings"
  ON public.holdings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.investment_accounts ia
      WHERE ia.id = holdings.investment_account_id
      AND ia.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.investment_accounts ia
      WHERE ia.id = holdings.investment_account_id
      AND ia.user_id = auth.uid()
    )
  );


-- =============================================
-- 4. ADD MISSING RLS POLICIES FOR cards AND notifications
-- =============================================

-- cards: missing INSERT policy (needed for account opening)
CREATE POLICY "Users can insert own cards"
  ON public.cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- notifications: missing INSERT policy (needed for all notification creation)
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- notifications: missing DELETE policy (needed for notification dismissal)
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================
-- 5. ADD DATABASE-LEVEL CHECK CONSTRAINTS ON MONEY COLUMNS
-- =============================================

-- credit_cards: prevent negative balance
ALTER TABLE public.credit_cards DROP CONSTRAINT IF EXISTS credit_cards_balance_nonneg;
ALTER TABLE public.credit_cards ADD CONSTRAINT credit_cards_balance_nonneg
  CHECK (current_balance >= 0);

-- credit_cards: prevent negative available credit
ALTER TABLE public.credit_cards DROP CONSTRAINT IF EXISTS credit_cards_available_credit_nonneg;
ALTER TABLE public.credit_cards ADD CONSTRAINT credit_cards_available_credit_nonneg
  CHECK (available_credit >= 0);

-- spending_alerts: threshold must be positive
ALTER TABLE public.spending_alerts DROP CONSTRAINT IF EXISTS spending_alerts_threshold_positive;
ALTER TABLE public.spending_alerts ADD CONSTRAINT spending_alerts_threshold_positive
  CHECK (threshold_amount > 0);


-- =============================================
-- 6. CREATE updated_at AUTO-TRIGGER FOR ALL TABLES
-- =============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'accounts', 'cards', 'payees', 'scheduled_payments',
      'savings_goals', 'budgets', 'disputes', 'spending_alerts',
      'credit_cards', 'loans', 'investment_accounts', 'holdings',
      'insurance_policies', 'insurance_claims', 'transaction_notes'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I; ' ||
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I ' ||
      'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;


-- =============================================
-- 7. ATOMIC REWARDS REDEMPTION FUNCTION
-- Replaces the multi-query approach in rewards/actions.ts
-- =============================================
CREATE OR REPLACE FUNCTION public.redeem_rewards(
  p_amount NUMERIC(19,4),
  p_method TEXT,           -- 'cash' or 'charity'
  p_account_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile RECORD;
  v_account RECORD;
  v_tx_id UUID := gen_random_uuid();
  v_new_balance NUMERIC(19,4);
  v_new_rewards NUMERIC(19,4);
  v_remaining NUMERIC(19,4);
  v_reward RECORD;
BEGIN
  -- Validate
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Redemption amount must be positive';
  END IF;
  IF p_method NOT IN ('cash', 'charity') THEN
    RAISE EXCEPTION 'Invalid redemption method';
  END IF;
  IF p_method = 'cash' AND p_account_id IS NULL THEN
    RAISE EXCEPTION 'Account ID required for cash redemption';
  END IF;

  -- Lock and fetch profile rewards balance
  SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  IF v_profile.rewards_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient rewards balance';
  END IF;

  -- For cash: credit the account atomically
  IF p_method = 'cash' THEN
    SELECT * INTO v_account
      FROM public.accounts
      WHERE id = p_account_id
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account not found';
    END IF;
    IF v_account.user_id != v_user_id THEN
      RAISE EXCEPTION 'Unauthorized: you do not own this account';
    END IF;

    -- Credit account
    UPDATE public.accounts
      SET balance = balance + p_amount,
          available_balance = available_balance + p_amount
      WHERE id = p_account_id
      RETURNING balance INTO v_new_balance;

    -- Create transaction record
    INSERT INTO public.transactions
      (id, account_id, type, category, amount, description, counterparty_name,
       balance_after, status, transaction_date)
    VALUES (
      v_tx_id, p_account_id, 'credit', 'other', p_amount,
      'Cashback Rewards Redemption', 'NexusBank Rewards',
      v_new_balance, 'completed', NOW()
    );
  ELSE
    -- Charity: create an audit record in transactions using a system account approach
    -- We still record the transaction for auditability — use the user's first account
    SELECT * INTO v_account
      FROM public.accounts
      WHERE user_id = v_user_id
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
      FOR UPDATE;

    IF FOUND THEN
      INSERT INTO public.transactions
        (id, account_id, type, category, amount, description, counterparty_name,
         balance_after, status, transaction_date)
      VALUES (
        v_tx_id, v_account.id, 'debit', 'other', p_amount,
        'Charity Rewards Donation', 'NexusBank Charity',
        v_account.balance, 'completed', NOW()
      );
    END IF;
  END IF;

  -- Mark rewards as redeemed (FIFO order)
  v_remaining := p_amount;
  FOR v_reward IN
    SELECT id, amount FROM public.rewards
    WHERE user_id = v_user_id AND status = 'earned'
    ORDER BY created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    UPDATE public.rewards
      SET status = 'redeemed', redeemed_at = NOW()
      WHERE id = v_reward.id;
    v_remaining := v_remaining - v_reward.amount;
  END LOOP;

  -- Update profile rewards balance
  v_new_rewards := GREATEST(0, v_profile.rewards_balance - p_amount);
  UPDATE public.profiles
    SET rewards_balance = v_new_rewards
    WHERE id = v_user_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 8. ATOMIC OVERDRAFT CHANGE FUNCTION
-- Updates both overdraft_limit AND available_balance together,
-- and logs an audit trail
-- =============================================
CREATE OR REPLACE FUNCTION public.change_overdraft_limit(
  p_account_id UUID,
  p_new_limit NUMERIC(19,4)
)
RETURNS VOID AS $$
DECLARE
  v_account RECORD;
  v_old_limit NUMERIC(19,4);
  v_delta NUMERIC(19,4);
BEGIN
  IF p_new_limit <= 0 OR p_new_limit > 25000 THEN
    RAISE EXCEPTION 'Overdraft limit must be between £1 and £25,000';
  END IF;

  SELECT * INTO v_account
    FROM public.accounts
    WHERE id = p_account_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF v_account.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF v_account.account_type NOT IN ('current', 'business') THEN
    RAISE EXCEPTION 'Overdraft not available for this account type';
  END IF;

  v_old_limit := v_account.overdraft_limit;
  v_delta := p_new_limit - v_old_limit;

  -- Update both overdraft_limit and available_balance atomically
  UPDATE public.accounts
    SET overdraft_limit = p_new_limit,
        available_balance = available_balance + v_delta
    WHERE id = p_account_id;

  -- Log the change in login_activity for audit
  INSERT INTO public.login_activity
    (user_id, event_type, metadata)
  VALUES (
    auth.uid(),
    'profile_updated',
    jsonb_build_object(
      'action', 'overdraft_limit_changed',
      'account_id', p_account_id,
      'old_limit', v_old_limit,
      'new_limit', p_new_limit
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 9. FIX transfer_funds: DEADLOCK-SAFE LOCK ORDERING
-- Always lock the account with the smaller UUID first
-- =============================================
CREATE OR REPLACE FUNCTION public.transfer_funds(
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC(19,4),
  p_description TEXT DEFAULT 'Transfer',
  p_reference TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transfer_ref UUID := gen_random_uuid();
  v_from RECORD;
  v_to RECORD;
  v_from_new_balance NUMERIC(19,4);
  v_to_new_balance NUMERIC(19,4);
BEGIN
  -- Validate
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same account';
  END IF;

  -- Lock accounts in consistent UUID order to prevent deadlocks
  IF p_from_account_id < p_to_account_id THEN
    SELECT * INTO v_from FROM public.accounts WHERE id = p_from_account_id FOR UPDATE;
    SELECT * INTO v_to   FROM public.accounts WHERE id = p_to_account_id FOR UPDATE;
  ELSE
    SELECT * INTO v_to   FROM public.accounts WHERE id = p_to_account_id FOR UPDATE;
    SELECT * INTO v_from FROM public.accounts WHERE id = p_from_account_id FOR UPDATE;
  END IF;

  IF v_from.id IS NULL THEN
    RAISE EXCEPTION 'Source account not found';
  END IF;
  IF v_to.id IS NULL THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;
  IF v_from.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this account';
  END IF;

  -- Check funds (considering overdraft)
  IF (v_from.available_balance - p_amount) < (v_from.overdraft_limit * -1) THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Debit source
  UPDATE public.accounts
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount
    WHERE id = p_from_account_id
    RETURNING balance INTO v_from_new_balance;

  -- Credit destination
  UPDATE public.accounts
    SET balance = balance + p_amount,
        available_balance = available_balance + p_amount
    WHERE id = p_to_account_id
    RETURNING balance INTO v_to_new_balance;

  -- Debit transaction
  INSERT INTO public.transactions
    (account_id, type, category, amount, description, reference,
     balance_after, transfer_reference, status, transaction_date)
  VALUES
    (p_from_account_id, 'debit', 'transfer', p_amount, p_description,
     p_reference, v_from_new_balance, v_transfer_ref, 'completed', NOW());

  -- Credit transaction
  INSERT INTO public.transactions
    (account_id, type, category, amount, description, reference,
     balance_after, transfer_reference, status, transaction_date)
  VALUES
    (p_to_account_id, 'credit', 'transfer', p_amount, p_description,
     p_reference, v_to_new_balance, v_transfer_ref, 'completed', NOW());

  RETURN v_transfer_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Keep the wrapper in sync
CREATE OR REPLACE FUNCTION public.transfer_between_accounts(
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC(19,4),
  p_reference TEXT DEFAULT 'Internal Transfer'
)
RETURNS UUID AS $$
BEGIN
  RETURN public.transfer_funds(p_from_account_id, p_to_account_id, p_amount, 'Transfer', p_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 10. FIX adjust_savings_goal: LOCK ACCOUNT + CONSIDER OVERDRAFT
-- =============================================
CREATE OR REPLACE FUNCTION public.adjust_savings_goal(
  p_goal_id UUID,
  p_amount NUMERIC(19,4),
  p_description TEXT DEFAULT 'Savings adjustment'
)
RETURNS VOID AS $$
DECLARE
  v_goal RECORD;
  v_account RECORD;
  v_new_goal_amount NUMERIC(19,4);
  v_new_balance NUMERIC(19,4);
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

  -- Lock and fetch account (fixes M5 — explicit FOR UPDATE)
  SELECT * INTO v_account FROM public.accounts WHERE id = v_goal.account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- For deposits (positive p_amount): deduct from account
  -- Check considers overdraft limit (fixes H16)
  v_new_balance := v_account.balance - p_amount;
  IF p_amount > 0 AND (v_account.available_balance - p_amount) < (v_account.overdraft_limit * -1) THEN
    RAISE EXCEPTION 'Insufficient funds in account';
  END IF;

  -- Update account
  UPDATE public.accounts
    SET balance = v_new_balance,
        available_balance = available_balance - p_amount
    WHERE id = v_goal.account_id;

  -- Update goal amount
  UPDATE public.savings_goals
    SET current_amount = v_new_goal_amount,
        is_completed = (v_new_goal_amount >= target_amount),
        completed_at = CASE WHEN v_new_goal_amount >= target_amount THEN NOW() ELSE NULL END
    WHERE id = p_goal_id;

  -- Create transaction record with balance_after
  INSERT INTO public.transactions
    (account_id, type, category, amount, description, balance_after, status, transaction_date)
  VALUES (
    v_goal.account_id,
    CASE WHEN p_amount > 0 THEN 'debit' ELSE 'credit' END,
    'transfer',
    ABS(p_amount),
    p_description,
    v_new_balance,
    'completed',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 11. FIX make_credit_card_payment: USE RETURNING FOR balance_after
-- =============================================
CREATE OR REPLACE FUNCTION public.make_credit_card_payment(
  p_credit_card_id UUID,
  p_from_account_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_card RECORD;
  v_account RECORD;
  v_new_account_balance NUMERIC(19,4);
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

  -- Deduct from account and get new balance via RETURNING
  UPDATE public.accounts
  SET balance = balance - p_amount,
      available_balance = available_balance - p_amount
  WHERE id = p_from_account_id
  RETURNING balance INTO v_new_account_balance;

  -- Reduce credit card balance
  UPDATE public.credit_cards
  SET current_balance = current_balance - p_amount,
      available_credit = available_credit + p_amount,
      minimum_payment = GREATEST(0, (current_balance - p_amount) * 0.02)
  WHERE id = p_credit_card_id;

  -- Create transaction record with correct balance_after from RETURNING
  INSERT INTO public.transactions (
    account_id, type, category, amount, currency_code, description,
    counterparty_name, status, transaction_date, balance_after
  ) VALUES (
    p_from_account_id, 'debit', 'bills', p_amount, 'GBP',
    'Credit card payment - ' || v_card.card_name,
    'NexusBank Credit Cards', 'completed', NOW(),
    v_new_account_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 12. FIX make_loan_overpayment: USE RETURNING FOR balance_after
-- =============================================
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
  v_new_account_balance NUMERIC(19,4);
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

  -- Deduct from account and get new balance via RETURNING
  UPDATE public.accounts
  SET balance = balance - p_amount,
      available_balance = available_balance - p_amount
  WHERE id = p_from_account_id
  RETURNING balance INTO v_new_account_balance;

  -- Update loan
  v_new_balance := v_loan.remaining_balance - p_amount;

  UPDATE public.loans
  SET remaining_balance = v_new_balance,
      months_remaining = CASE
        WHEN v_new_balance <= 0 THEN 0
        ELSE GREATEST(1, CEIL(v_new_balance / v_loan.monthly_payment))
      END,
      status = CASE WHEN v_new_balance <= 0 THEN 'paid_off' ELSE 'active' END
  WHERE id = p_loan_id;

  -- Create transaction record with correct balance_after
  INSERT INTO public.transactions (
    account_id, type, category, amount, currency_code, description,
    counterparty_name, status, transaction_date, balance_after
  ) VALUES (
    p_from_account_id, 'debit', 'bills', p_amount, 'GBP',
    'Loan overpayment - ' || v_loan.loan_name,
    'NexusBank Loans', 'completed', NOW(),
    v_new_account_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
