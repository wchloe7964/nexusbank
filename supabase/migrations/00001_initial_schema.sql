-- =============================================
-- NexusBank - Full Database Schema
-- =============================================

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone_number TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'United Kingdom',
  avatar_url TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  notification_email BOOLEAN DEFAULT TRUE,
  notification_sms BOOLEAN DEFAULT FALSE,
  notification_push BOOLEAN DEFAULT TRUE,
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ACCOUNTS TABLE
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('current', 'savings', 'isa')),
  sort_code CHAR(8) NOT NULL,
  account_number CHAR(8) NOT NULL,
  balance NUMERIC(19,4) DEFAULT 0.00,
  available_balance NUMERIC(19,4) DEFAULT 0.00,
  currency_code CHAR(3) DEFAULT 'GBP',
  interest_rate NUMERIC(5,4) DEFAULT 0.0000,
  overdraft_limit NUMERIC(19,4) DEFAULT 0.00,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_account_number UNIQUE (sort_code, account_number)
);

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);

-- 3. TRANSACTIONS TABLE
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category TEXT NOT NULL CHECK (category IN (
    'transfer', 'salary', 'bills', 'groceries', 'shopping',
    'transport', 'entertainment', 'dining', 'health',
    'education', 'subscriptions', 'cash', 'other'
  )),
  amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
  currency_code CHAR(3) DEFAULT 'GBP',
  description TEXT NOT NULL,
  reference TEXT,
  counterparty_name TEXT,
  counterparty_sort_code CHAR(8),
  counterparty_account_number CHAR(8),
  balance_after NUMERIC(19,4),
  transfer_reference UUID,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category);
CREATE INDEX idx_transactions_transfer_ref ON public.transactions(transfer_reference);

-- 4. CARDS TABLE
CREATE TABLE public.cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('debit', 'credit')),
  card_number_last_four CHAR(4) NOT NULL,
  card_holder_name TEXT NOT NULL,
  expiry_date CHAR(5) NOT NULL,
  is_frozen BOOLEAN DEFAULT FALSE,
  is_contactless_enabled BOOLEAN DEFAULT TRUE,
  online_payments_enabled BOOLEAN DEFAULT TRUE,
  atm_withdrawals_enabled BOOLEAN DEFAULT TRUE,
  spending_limit_daily NUMERIC(19,4) DEFAULT 5000.00,
  spending_limit_monthly NUMERIC(19,4) DEFAULT 25000.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'expired', 'cancelled', 'reported_lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cards_account_id ON public.cards(account_id);
CREATE INDEX idx_cards_user_id ON public.cards(user_id);

-- 5. PAYEES TABLE
CREATE TABLE public.payees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_code CHAR(8) NOT NULL,
  account_number CHAR(8) NOT NULL,
  reference TEXT,
  is_favourite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_payee_per_user UNIQUE (user_id, sort_code, account_number)
);

CREATE INDEX idx_payees_user_id ON public.payees(user_id);

-- 6. SCHEDULED PAYMENTS TABLE
CREATE TABLE public.scheduled_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  payee_id UUID REFERENCES public.payees(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('standing_order', 'direct_debit', 'scheduled_transfer', 'bill_payment')),
  amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
  currency_code CHAR(3) DEFAULT 'GBP',
  reference TEXT,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('once', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'annually')),
  next_payment_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_payments_user_id ON public.scheduled_payments(user_id);
CREATE INDEX idx_scheduled_payments_from_account ON public.scheduled_payments(from_account_id);
CREATE INDEX idx_scheduled_payments_next_date ON public.scheduled_payments(next_payment_date);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transaction', 'security', 'account', 'promotion', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, is_read);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transactions for own accounts" ON public.transactions FOR SELECT
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert transactions for own accounts" ON public.transactions FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payees" ON public.payees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payees" ON public.payees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payees" ON public.payees FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payees" ON public.payees FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scheduled payments" ON public.scheduled_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scheduled payments" ON public.scheduled_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled payments" ON public.scheduled_payments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scheduled payments" ON public.scheduled_payments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRANSFER FUNDS FUNCTION (ATOMIC)
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
  v_from_balance NUMERIC(19,4);
  v_to_balance NUMERIC(19,4);
  v_from_user_id UUID;
BEGIN
  SELECT user_id INTO v_from_user_id FROM public.accounts WHERE id = p_from_account_id;
  IF v_from_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this account';
  END IF;

  UPDATE public.accounts
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount,
        updated_at = NOW()
    WHERE id = p_from_account_id AND (available_balance - p_amount) >= (overdraft_limit * -1)
    RETURNING balance INTO v_from_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  UPDATE public.accounts
    SET balance = balance + p_amount,
        available_balance = available_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_to_account_id
    RETURNING balance INTO v_to_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination account not found';
  END IF;

  INSERT INTO public.transactions
    (account_id, type, category, amount, description, reference, balance_after, transfer_reference)
  VALUES
    (p_from_account_id, 'debit', 'transfer', p_amount, p_description, p_reference, v_from_balance, v_transfer_ref);

  INSERT INTO public.transactions
    (account_id, type, category, amount, description, reference, balance_after, transfer_reference)
  VALUES
    (p_to_account_id, 'credit', 'transfer', p_amount, p_description, p_reference, v_to_balance, v_transfer_ref);

  RETURN v_transfer_ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
