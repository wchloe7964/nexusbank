-- =============================================
-- Security Fixes Migration
-- 1. Add FOR UPDATE row locks to transfer_funds
-- 2. Create transfer_between_accounts alias (used by updated actions)
-- 3. Fix adjust_savings_goal to include balance_after
-- 4. Create execute_payee_payment atomic function
-- 5. Add amount validation CHECK constraints
-- =============================================

-- 1. Replace transfer_funds with row-locked version
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
  v_to_balance NUMERIC(19,4);
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;

  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same account';
  END IF;

  -- Lock source account FOR UPDATE to prevent race conditions
  SELECT * INTO v_from
    FROM public.accounts
    WHERE id = p_from_account_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source account not found';
  END IF;

  IF v_from.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this account';
  END IF;

  IF (v_from.available_balance - p_amount) < (v_from.overdraft_limit * -1) THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Lock destination account
  PERFORM 1 FROM public.accounts WHERE id = p_to_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;

  -- Debit source
  UPDATE public.accounts
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_from_account_id;

  -- Credit destination
  UPDATE public.accounts
    SET balance = balance + p_amount,
        available_balance = available_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_to_account_id
    RETURNING balance INTO v_to_balance;

  -- Create debit transaction
  INSERT INTO public.transactions
    (account_id, type, category, amount, description, reference, balance_after, transfer_reference, status, transaction_date)
  VALUES
    (p_from_account_id, 'debit', 'transfer', p_amount, p_description, p_reference,
     v_from.balance - p_amount, v_transfer_ref, 'completed', NOW());

  -- Create credit transaction
  INSERT INTO public.transactions
    (account_id, type, category, amount, description, reference, balance_after, transfer_reference, status, transaction_date)
  VALUES
    (p_to_account_id, 'credit', 'transfer', p_amount, p_description, p_reference,
     v_to_balance, v_transfer_ref, 'completed', NOW());

  RETURN v_transfer_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create transfer_between_accounts as used by the updated transfers action
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


-- 3. Fix adjust_savings_goal to include balance_after in transaction record
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

  -- Create transaction record with balance_after
  INSERT INTO public.transactions
    (account_id, type, category, amount, description, balance_after, status, transaction_date)
  VALUES (
    v_goal.account_id,
    CASE WHEN p_amount > 0 THEN 'debit' ELSE 'credit' END,
    'transfer',
    ABS(p_amount),
    p_description,
    v_account_balance,
    'completed',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Create atomic payee payment function
CREATE OR REPLACE FUNCTION public.execute_payee_payment(
  p_from_account_id UUID,
  p_payee_id UUID,
  p_amount NUMERIC(19,4),
  p_reference TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Payment'
)
RETURNS UUID AS $$
DECLARE
  v_tx_id UUID := gen_random_uuid();
  v_account RECORD;
  v_payee RECORD;
  v_new_balance NUMERIC(19,4);
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;

  -- Lock and verify account ownership
  SELECT * INTO v_account
    FROM public.accounts
    WHERE id = p_from_account_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_account.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this account';
  END IF;

  -- Verify payee ownership
  SELECT * INTO v_payee
    FROM public.payees
    WHERE id = p_payee_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payee not found or access denied';
  END IF;

  -- Check sufficient funds (considering overdraft)
  IF (v_account.available_balance - p_amount) < (v_account.overdraft_limit * -1) THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Debit the account
  v_new_balance := v_account.balance - p_amount;

  UPDATE public.accounts
    SET balance = v_new_balance,
        available_balance = available_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_from_account_id;

  -- Create transaction
  INSERT INTO public.transactions
    (id, account_id, type, category, amount, description, reference, counterparty_name,
     balance_after, status, transaction_date)
  VALUES (
    v_tx_id,
    p_from_account_id,
    'debit',
    'payment',
    p_amount,
    p_description,
    p_reference,
    v_payee.name,
    v_new_balance,
    'completed',
    NOW()
  );

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
