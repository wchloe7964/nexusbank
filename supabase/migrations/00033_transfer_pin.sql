-- ============================================================
-- Transfer PIN: Allow customers to set a 4-digit transfer PIN
-- Used to authorise payments and transfers instead of SCA codes
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS transfer_pin_hash TEXT DEFAULT NULL;

COMMENT ON COLUMN public.profiles.transfer_pin_hash
  IS 'SHA-256 hash of the user''s 4-digit transfer PIN (salted with user ID)';
