-- ============================================================
-- Migration 00018: Admin Panel Support
-- Adds role-based access control and admin dashboard aggregations
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'super_admin'));

-- Index for efficient role lookups in middleware
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);


-- 2. Admin dashboard stats function (SECURITY DEFINER — bypasses RLS)
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_customers INT;
  v_total_deposits NUMERIC;
  v_new_signups_30d INT;
  v_flagged_activity INT;
  v_open_disputes INT;
  v_total_accounts INT;
BEGIN
  SELECT COUNT(*) INTO v_total_customers
    FROM public.profiles WHERE role = 'customer';

  SELECT COALESCE(SUM(balance), 0) INTO v_total_deposits
    FROM public.accounts WHERE is_active = true;

  SELECT COUNT(*) INTO v_new_signups_30d
    FROM public.profiles
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND role = 'customer';

  SELECT COUNT(*) INTO v_flagged_activity
    FROM public.login_activity
    WHERE is_suspicious = true
      AND created_at >= NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_open_disputes
    FROM public.disputes
    WHERE status IN ('submitted', 'under_review', 'information_requested');

  SELECT COUNT(*) INTO v_total_accounts
    FROM public.accounts WHERE is_active = true;

  RETURN json_build_object(
    'total_customers', v_total_customers,
    'total_deposits', v_total_deposits,
    'new_signups_30d', v_new_signups_30d,
    'flagged_activity_30d', v_flagged_activity,
    'open_disputes', v_open_disputes,
    'total_accounts', v_total_accounts
  );
END;
$$;


-- To promote a user to admin (run manually):
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'your-superadmin@example.com';
