-- Add membership_number and last_name columns to profiles
-- membership_number is a unique 12-digit identifier for Online Banking login

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update account_type CHECK constraint to include 'business'
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_account_type_check;
ALTER TABLE public.accounts ADD CONSTRAINT accounts_account_type_check
  CHECK (account_type IN ('current', 'savings', 'isa', 'business'));

-- Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_membership_number ON public.profiles(membership_number);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
