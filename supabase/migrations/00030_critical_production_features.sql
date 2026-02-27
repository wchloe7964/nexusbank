-- ============================================================
-- Migration 00030: Critical Production Features
-- 1. Secure Messaging
-- 2. Email/SMS Notification Delivery
-- 3. International Payments (SWIFT/SEPA)
-- 4. Open Banking (PSD2)
-- 5. Joint Accounts
-- ============================================================

-- ────────────────────────────────────────────────────────
-- 1. SECURE MESSAGING
-- ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'general'
                  CHECK (category IN ('general','payment','account','card','loan','dispute','complaint','fraud','technical','other')),
  status        TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','awaiting_customer','awaiting_bank','resolved','closed')),
  priority      TEXT NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to   UUID REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS secure_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id),
  sender_role     TEXT NOT NULL CHECK (sender_role IN ('customer','advisor','system')),
  body            TEXT NOT NULL,
  attachments     JSONB DEFAULT '[]'::jsonb,
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_secure_messages_conversation ON secure_messages(conversation_id);
CREATE INDEX idx_secure_messages_created ON secure_messages(created_at);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (customer_id = auth.uid());

CREATE POLICY "Users can view messages in own conversations"
  ON secure_messages FOR SELECT
  USING (conversation_id IN (SELECT id FROM conversations WHERE customer_id = auth.uid()));

CREATE POLICY "Users can insert messages in own conversations"
  ON secure_messages FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE customer_id = auth.uid()));

-- ────────────────────────────────────────────────────────
-- 2. EMAIL / SMS NOTIFICATION DELIVERY
-- ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT UNIQUE NOT NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('email','sms','push')),
  category        TEXT NOT NULL,
  subject_template TEXT NOT NULL DEFAULT '',
  body_template   TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  template_name   TEXT,
  to_address      TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body_preview    TEXT,
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','sending','sent','delivered','failed','bounced')),
  provider        TEXT,
  provider_id     TEXT,
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sms_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  template_name   TEXT,
  to_number       TEXT NOT NULL,
  body            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','sending','sent','delivered','failed')),
  provider        TEXT,
  provider_id     TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  sent_at         TIMESTAMPTZ
);

CREATE INDEX idx_email_log_user ON email_log(user_id);
CREATE INDEX idx_email_log_status ON email_log(status);
CREATE INDEX idx_sms_log_user ON sms_log(user_id);

-- RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email log"
  ON email_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own sms log"
  ON sms_log FOR SELECT
  USING (user_id = auth.uid());

-- Seed default notification templates
INSERT INTO notification_templates (name, channel, category, subject_template, body_template) VALUES
  ('login_success', 'email', 'security', 'New login to your NexusBank account', 'Hi {{name}}, we detected a new login to your account on {{date}} from {{device}}. If this wasn''t you, please contact us immediately.'),
  ('payment_sent', 'email', 'transaction', 'Payment of {{amount}} sent', 'Hi {{name}}, your payment of {{amount}} to {{payee}} has been sent. Reference: {{reference}}.'),
  ('payment_received', 'email', 'transaction', 'You received {{amount}}', 'Hi {{name}}, you received {{amount}} from {{sender}}. Your new balance is {{balance}}.'),
  ('card_frozen', 'email', 'security', 'Your card has been frozen', 'Hi {{name}}, your card ending in {{last4}} has been frozen. If you didn''t request this, please contact us.'),
  ('card_unfrozen', 'email', 'security', 'Your card has been unfrozen', 'Hi {{name}}, your card ending in {{last4}} is now active again.'),
  ('password_changed', 'email', 'security', 'Your password was changed', 'Hi {{name}}, your Online Banking password was changed on {{date}}. If you didn''t make this change, contact us immediately.'),
  ('large_transaction', 'email', 'transaction', 'Large transaction alert: {{amount}}', 'Hi {{name}}, a transaction of {{amount}} was made on your account ending in {{last4}}. If this wasn''t you, please contact us.'),
  ('low_balance', 'email', 'account', 'Low balance alert', 'Hi {{name}}, your {{account}} balance has dropped below {{threshold}}. Current balance: {{balance}}.'),
  ('direct_debit_due', 'email', 'transaction', 'Direct debit due tomorrow', 'Hi {{name}}, a direct debit of {{amount}} to {{payee}} is due tomorrow from your {{account}}.'),
  ('message_received', 'email', 'support', 'New message from NexusBank', 'Hi {{name}}, you have a new message in your secure inbox. Log in to view it.'),
  ('international_payment_sent', 'email', 'transaction', 'International payment of {{amount}} sent', 'Hi {{name}}, your international payment of {{amount}} to {{beneficiary}} has been submitted. Tracking ref: {{tracking_ref}}. Estimated delivery: {{eta}}.'),
  ('login_success_sms', 'sms', 'security', '', 'NexusBank: New login detected on {{date}}. If this wasn''t you, call us on 0800 123 4567.'),
  ('payment_sent_sms', 'sms', 'transaction', '', 'NexusBank: Payment of {{amount}} to {{payee}} sent. Ref: {{reference}}.')
ON CONFLICT (name) DO NOTHING;

-- ────────────────────────────────────────────────────────
-- 3. INTERNATIONAL PAYMENTS (SWIFT / SEPA)
-- ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS international_payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id),
  from_account_id         UUID NOT NULL REFERENCES accounts(id),
  -- Beneficiary details
  beneficiary_name        TEXT NOT NULL,
  beneficiary_iban        TEXT,
  beneficiary_account_number TEXT,
  beneficiary_swift_bic   TEXT,
  beneficiary_bank_name   TEXT NOT NULL,
  beneficiary_bank_country TEXT NOT NULL,
  beneficiary_address     TEXT,
  -- Payment details
  amount                  NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  source_currency         TEXT NOT NULL DEFAULT 'GBP',
  target_currency         TEXT NOT NULL,
  exchange_rate           NUMERIC(15,6),
  converted_amount        NUMERIC(15,2),
  fee_amount              NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_currency            TEXT NOT NULL DEFAULT 'GBP',
  -- Payment routing
  payment_method          TEXT NOT NULL CHECK (payment_method IN ('swift','sepa','target2')),
  charge_type             TEXT NOT NULL DEFAULT 'shared' CHECK (charge_type IN ('shared','our','beneficiary')),
  purpose_code            TEXT,
  reference               TEXT,
  -- Status & tracking
  status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','sent','in_transit','completed','failed','cancelled','returned')),
  tracking_reference      TEXT,
  estimated_delivery      DATE,
  -- Compliance
  source_of_funds         TEXT,
  declaration_accepted    BOOLEAN DEFAULT FALSE,
  screening_status        TEXT DEFAULT 'pending' CHECK (screening_status IN ('pending','cleared','flagged','blocked')),
  -- Timestamps
  created_at              TIMESTAMPTZ DEFAULT now(),
  submitted_at            TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_intl_payments_user ON international_payments(user_id);
CREATE INDEX idx_intl_payments_status ON international_payments(status);
CREATE INDEX idx_intl_payments_created ON international_payments(created_at);

-- Exchange rate cache (avoid repeated API calls)
CREATE TABLE IF NOT EXISTS exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency   TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate            NUMERIC(15,6) NOT NULL,
  source          TEXT DEFAULT 'ecb',
  fetched_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),
  UNIQUE(base_currency, target_currency)
);

-- RLS
ALTER TABLE international_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own international payments"
  ON international_payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own international payments"
  ON international_payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates FOR SELECT
  USING (true);

-- ────────────────────────────────────────────────────────
-- 4. OPEN BANKING (PSD2)
-- ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS third_party_providers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  provider_type     TEXT NOT NULL CHECK (provider_type IN ('aisp','pisp','cbpii')),
  fca_reference     TEXT UNIQUE,
  client_id         TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT NOT NULL,
  redirect_uris     TEXT[] DEFAULT '{}',
  logo_url          TEXT,
  website           TEXT,
  contact_email     TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS open_banking_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES third_party_providers(id),
  consent_type    TEXT NOT NULL CHECK (consent_type IN ('account_access','payment_initiation','funds_confirmation')),
  account_ids     UUID[] DEFAULT '{}',
  permissions     TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'awaiting_authorisation'
                    CHECK (status IN ('awaiting_authorisation','authorised','rejected','revoked','expired')),
  access_token_hash TEXT,
  refresh_token_hash TEXT,
  expires_at      TIMESTAMPTZ,
  transaction_from_date DATE,
  transaction_to_date DATE,
  max_frequency   INTEGER DEFAULT 4,
  last_accessed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  authorised_at   TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS open_banking_api_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id      UUID REFERENCES open_banking_consents(id),
  provider_id     UUID REFERENCES third_party_providers(id),
  endpoint        TEXT NOT NULL,
  method          TEXT NOT NULL,
  status_code     INTEGER,
  request_ip      TEXT,
  response_time_ms INTEGER,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ob_consents_user ON open_banking_consents(user_id);
CREATE INDEX idx_ob_consents_status ON open_banking_consents(status);
CREATE INDEX idx_ob_api_log_consent ON open_banking_api_log(consent_id);

-- RLS
ALTER TABLE third_party_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_banking_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_banking_api_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active providers"
  ON third_party_providers FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view own consents"
  ON open_banking_consents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own consents"
  ON open_banking_consents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own consents"
  ON open_banking_consents FOR UPDATE
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────
-- 5. JOINT ACCOUNTS
-- ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_holders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'joint'
                CHECK (role IN ('primary','joint','authorized_signatory','power_of_attorney','guardian')),
  permissions TEXT[] NOT NULL DEFAULT ARRAY['view','transact'],
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending_acceptance','active','suspended','removed')),
  added_by    UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  removed_at  TIMESTAMPTZ,
  UNIQUE(account_id, user_id)
);

CREATE INDEX idx_account_holders_user ON account_holders(user_id);
CREATE INDEX idx_account_holders_account ON account_holders(account_id);

-- RLS
ALTER TABLE account_holders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account holder records"
  ON account_holders FOR SELECT
  USING (user_id = auth.uid() OR account_id IN (
    SELECT account_id FROM account_holders WHERE user_id = auth.uid()
  ));

CREATE POLICY "Primary holders can manage account holders"
  ON account_holders FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_holders WHERE user_id = auth.uid() AND role = 'primary'
  ));

CREATE POLICY "Primary holders can update account holders"
  ON account_holders FOR UPDATE
  USING (account_id IN (
    SELECT account_id FROM account_holders WHERE user_id = auth.uid() AND role = 'primary'
  ));

-- Backfill existing accounts → primary holder records
INSERT INTO account_holders (account_id, user_id, role, permissions, status, accepted_at)
SELECT id, user_id, 'primary', ARRAY['view','transact','manage'], 'active', now()
FROM accounts
WHERE NOT EXISTS (
  SELECT 1 FROM account_holders ah WHERE ah.account_id = accounts.id AND ah.user_id = accounts.user_id
)
ON CONFLICT (account_id, user_id) DO NOTHING;
