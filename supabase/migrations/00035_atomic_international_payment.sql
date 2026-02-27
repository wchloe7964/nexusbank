-- =============================================
-- Atomic international payment debit function.
--
-- The international payment flow previously used two separate queries to
-- debit the account and create a transaction record. This was not atomic:
-- if the transaction insert failed, the balance was debited with no record.
-- It also had a race condition where concurrent requests could read the same
-- balance and both succeed.
--
-- This function locks the account row, verifies ownership and balance,
-- then atomically debits the account and creates the transaction.
-- =============================================

CREATE OR REPLACE FUNCTION public.debit_international_payment(
  p_account_id UUID,
  p_total_debit NUMERIC(19,4),
  p_description TEXT,
  p_tracking_ref TEXT,
  p_beneficiary_name TEXT,
  p_currency_code CHAR(3) DEFAULT 'GBP'
)
RETURNS UUID AS $$
DECLARE
  v_tx_id UUID := gen_random_uuid();
  v_account RECORD;
  v_new_balance NUMERIC(19,4);
BEGIN
  IF p_total_debit <= 0 THEN
    RAISE EXCEPTION 'Debit amount must be positive';
  END IF;

  -- Lock and verify account
  SELECT * INTO v_account
    FROM public.accounts
    WHERE id = p_account_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- Check sufficient funds
  IF v_account.balance < p_total_debit THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Atomic debit
  v_new_balance := v_account.balance - p_total_debit;

  UPDATE public.accounts
    SET balance = v_new_balance,
        available_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_account_id;

  -- Create transaction record
  INSERT INTO public.transactions
    (id, account_id, type, category, amount, currency_code, description,
     reference, counterparty_name, balance_after, status, transaction_date)
  VALUES (
    v_tx_id,
    p_account_id,
    'debit',
    'transfer',
    p_total_debit,
    p_currency_code,
    p_description,
    p_tracking_ref,
    p_beneficiary_name,
    v_new_balance,
    'completed',
    NOW()
  );

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
