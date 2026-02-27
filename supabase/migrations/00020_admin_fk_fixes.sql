-- ============================================================
-- Migration 00020: Add FK relationships for admin panel joins
-- login_activity and disputes need FK to profiles for Supabase
-- client join queries to work
-- ============================================================

-- Add FK from login_activity.user_id to profiles.id
ALTER TABLE public.login_activity
  ADD CONSTRAINT login_activity_profile_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add FK from disputes.user_id to profiles.id
ALTER TABLE public.disputes
  ADD CONSTRAINT disputes_profile_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
