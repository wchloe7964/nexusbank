-- Fix admin_credit_account RPC: use is_active boolean instead of status text
CREATE OR REPLACE FUNCTION public.admin_credit_account(
  p_account_id UUID,
  p_amount NUMERIC(19,4),
  p_description TEXT DEFAULT 'Admin Credit',
  p_reference TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_account RECORD;
  v_new_balance NUMERIC(19,4);
  v_new_available NUMERIC(19,4);
  v_transaction_id UUID;
BEGIN
  -- Validate amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be a positive number';
  END IF;

  IF p_amount > 1000000 THEN
    RAISE EXCEPTION 'Credit amount exceeds maximum allowed (£1,000,000)';
  END IF;

  -- Lock the account row to prevent concurrent balance modifications
  SELECT * INTO v_account
    FROM public.accounts
    WHERE id = p_account_id
    FOR UPDATE;

  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  IF v_account.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Cannot credit a non-active account';
  END IF;

  -- Credit the account
  UPDATE public.accounts
    SET balance = balance + p_amount,
        available_balance = available_balance + p_amount
    WHERE id = p_account_id
    RETURNING balance, available_balance
    INTO v_new_balance, v_new_available;

  -- Insert the credit transaction
  INSERT INTO public.transactions
    (account_id, type, category, amount, description, reference,
     balance_after, status, transaction_date)
  VALUES
    (p_account_id, 'credit', 'admin_credit', p_amount, p_description,
     p_reference, v_new_balance, 'completed', NOW())
  RETURNING id INTO v_transaction_id;

  -- Return result
  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'new_available_balance', v_new_available,
    'transaction_id', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
