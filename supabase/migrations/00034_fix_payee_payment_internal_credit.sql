-- =============================================
-- Fix execute_payee_payment: credit recipient for internal transfers
--
-- Previously this function only debited the sender's account and created
-- a single debit transaction. For internal transfers (where the recipient's
-- sort code + account number matches another customer's account), the
-- recipient's account was never credited.
--
-- This fix:
-- 1. Looks up the payee's sort_code + account_number in the accounts table
-- 2. If a matching account is found (internal transfer):
--    - Credits the recipient's account (balance + available_balance)
--    - Creates a credit transaction on the recipient's account
--    - Links debit + credit transactions via transfer_reference
-- 3. If no match (external payment): debit-only behaviour unchanged
-- 4. Uses deadlock-safe lock ordering (smaller UUID locked first)
-- =============================================

CREATE OR REPLACE FUNCTION public.execute_payee_payment(
  p_from_account_id UUID,
  p_payee_id UUID,
  p_amount NUMERIC(19,4),
  p_reference TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Payment'
)
RETURNS UUID AS $$
DECLARE
  v_transfer_ref UUID := gen_random_uuid();
  v_tx_id UUID := gen_random_uuid();
  v_from RECORD;
  v_to RECORD;
  v_payee RECORD;
  v_from_new_balance NUMERIC(19,4);
  v_to_new_balance NUMERIC(19,4);
  v_to_account_id UUID;
  v_is_internal BOOLEAN := FALSE;
  v_sender_name TEXT;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;

  -- Verify payee ownership
  SELECT * INTO v_payee
    FROM public.payees
    WHERE id = p_payee_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payee not found or access denied';
  END IF;

  -- Check if the recipient is an internal customer by matching sort_code + account_number
  SELECT id INTO v_to_account_id
    FROM public.accounts
    WHERE sort_code = v_payee.sort_code
      AND account_number = v_payee.account_number
      AND is_active = TRUE
    LIMIT 1;

  IF v_to_account_id IS NOT NULL THEN
    v_is_internal := TRUE;

    -- Prevent sending to yourself
    IF v_to_account_id = p_from_account_id THEN
      RAISE EXCEPTION 'Cannot send a payment to the same account';
    END IF;
  END IF;

  -- ── Lock accounts in consistent UUID order to prevent deadlocks ──
  IF v_is_internal THEN
    IF p_from_account_id < v_to_account_id THEN
      SELECT * INTO v_from FROM public.accounts WHERE id = p_from_account_id FOR UPDATE;
      SELECT * INTO v_to   FROM public.accounts WHERE id = v_to_account_id FOR UPDATE;
    ELSE
      SELECT * INTO v_to   FROM public.accounts WHERE id = v_to_account_id FOR UPDATE;
      SELECT * INTO v_from FROM public.accounts WHERE id = p_from_account_id FOR UPDATE;
    END IF;
  ELSE
    -- External payment: only lock sender
    SELECT * INTO v_from
      FROM public.accounts
      WHERE id = p_from_account_id
      FOR UPDATE;
  END IF;

  -- Verify source account exists
  IF v_from.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- Verify sender owns the account
  IF v_from.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this account';
  END IF;

  -- Check sufficient funds (considering overdraft)
  IF (v_from.available_balance - p_amount) < (v_from.overdraft_limit * -1) THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Get sender's name for recipient's transaction description
  SELECT full_name INTO v_sender_name
    FROM public.profiles
    WHERE id = v_from.user_id;

  -- ── Debit the sender ──
  UPDATE public.accounts
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_from_account_id
    RETURNING balance INTO v_from_new_balance;

  -- Create debit transaction on sender's account
  INSERT INTO public.transactions
    (id, account_id, type, category, amount, description, reference,
     counterparty_name, counterparty_sort_code, counterparty_account_number,
     balance_after, transfer_reference, status, transaction_date)
  VALUES (
    v_tx_id,
    p_from_account_id,
    'debit',
    'payment',
    p_amount,
    p_description,
    p_reference,
    v_payee.name,
    v_payee.sort_code,
    v_payee.account_number,
    v_from_new_balance,
    v_transfer_ref,
    'completed',
    NOW()
  );

  -- ── Credit the recipient (internal transfers only) ──
  IF v_is_internal THEN
    UPDATE public.accounts
      SET balance = balance + p_amount,
          available_balance = available_balance + p_amount,
          updated_at = NOW()
      WHERE id = v_to_account_id
      RETURNING balance INTO v_to_new_balance;

    -- Create credit transaction on recipient's account
    INSERT INTO public.transactions
      (account_id, type, category, amount, description, reference,
       counterparty_name, counterparty_sort_code, counterparty_account_number,
       balance_after, transfer_reference, status, transaction_date)
    VALUES (
      v_to_account_id,
      'credit',
      'payment',
      p_amount,
      'Payment from ' || COALESCE(v_sender_name, 'Unknown'),
      p_reference,
      COALESCE(v_sender_name, 'Unknown'),
      v_from.sort_code,
      v_from.account_number,
      v_to_new_balance,
      v_transfer_ref,
      'completed',
      NOW()
    );
  END IF;

  RETURN v_transfer_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
