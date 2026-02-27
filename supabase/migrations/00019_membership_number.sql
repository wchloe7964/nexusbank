-- ============================================================
-- Migration 00019: Add membership_number column to profiles
-- Supports admin panel customer identification and login flow
-- ============================================================

-- 1. Add the membership_number column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_number TEXT;

-- Unique index for login lookups (membership number must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_membership_number
  ON public.profiles(membership_number) WHERE membership_number IS NOT NULL;

-- 2. Backfill existing profiles that have membership_number in auth metadata
-- Registration stores it in auth.users.raw_user_meta_data
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT au.id, au.raw_user_meta_data->>'membership_number' AS mn
    FROM auth.users au
    JOIN public.profiles p ON p.id = au.id
    WHERE p.membership_number IS NULL
      AND au.raw_user_meta_data->>'membership_number' IS NOT NULL
  LOOP
    UPDATE public.profiles
    SET membership_number = rec.mn
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 3. For any profiles still without a membership_number, generate one
-- Personal accounts start with 5, admin/system users start with 9
DO $$
DECLARE
  rec RECORD;
  new_number TEXT;
  suffix BIGINT;
BEGIN
  FOR rec IN
    SELECT id, role FROM public.profiles WHERE membership_number IS NULL
  LOOP
    LOOP
      suffix := floor(random() * 90000000000 + 10000000000)::BIGINT;
      IF rec.role IN ('admin', 'super_admin') THEN
        new_number := '9' || suffix::TEXT;
      ELSE
        new_number := '5' || suffix::TEXT;
      END IF;
      -- Ensure uniqueness
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE membership_number = new_number) THEN
        EXIT;
      END IF;
    END LOOP;
    UPDATE public.profiles SET membership_number = new_number WHERE id = rec.id;
  END LOOP;
END;
$$;

-- 4. Add security_score column if missing (used in admin detail view)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS security_score INT NOT NULL DEFAULT 70;
