-- ============================================================
-- Migration 00025: PCI-DSS Compliance
-- Card tokenization, PCI access logging, data protection
-- ============================================================

-- 1. Card tokens (tokenization layer)
CREATE TABLE public.card_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  token_type TEXT DEFAULT 'payment' CHECK (token_type IN ('payment', 'display', 'recurring')),
  last_four TEXT NOT NULL,
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_card_tokens_user ON public.card_tokens(user_id);
CREATE UNIQUE INDEX idx_card_tokens_token ON public.card_tokens(token);
CREATE INDEX idx_card_tokens_card ON public.card_tokens(card_id);

ALTER TABLE public.card_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens"
  ON public.card_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tokens"
  ON public.card_tokens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

CREATE POLICY "System can manage tokens"
  ON public.card_tokens FOR ALL
  USING (true);


-- 2. PCI access log (append-only)
CREATE TABLE public.pci_access_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  access_type TEXT NOT NULL CHECK (access_type IN (
    'card_view', 'card_create', 'card_update', 'card_freeze',
    'card_cancel', 'token_create', 'token_revoke', 'pan_access'
  )),
  card_id UUID,
  token_id UUID,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pci_access_actor ON public.pci_access_log(actor_id);
CREATE INDEX idx_pci_access_type ON public.pci_access_log(access_type);
CREATE INDEX idx_pci_access_created ON public.pci_access_log(created_at DESC);
CREATE INDEX idx_pci_access_card ON public.pci_access_log(card_id);

ALTER TABLE public.pci_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view PCI access log"
  ON public.pci_access_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'auditor')
  ));

-- No direct INSERT policy — all writes through SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.insert_pci_access_log(
  p_actor_id UUID,
  p_actor_role TEXT,
  p_access_type TEXT,
  p_card_id UUID DEFAULT NULL,
  p_token_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.pci_access_log (
    actor_id, actor_role, access_type, card_id, token_id,
    reason, ip_address, user_agent
  ) VALUES (
    p_actor_id, p_actor_role, p_access_type, p_card_id, p_token_id,
    p_reason, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
