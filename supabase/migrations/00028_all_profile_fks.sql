-- Add FK relationships to profiles for all compliance tables
-- that only had FKs to auth.users (PostgREST needs FK to profiles for joins)

-- kyc_verifications → profiles
ALTER TABLE kyc_verifications
  ADD CONSTRAINT kyc_verifications_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);

-- aml_alerts → profiles
ALTER TABLE aml_alerts
  ADD CONSTRAINT aml_alerts_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);

-- payment_submissions → profiles
ALTER TABLE payment_submissions
  ADD CONSTRAINT payment_submissions_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);

-- complaints → profiles
ALTER TABLE complaints
  ADD CONSTRAINT complaints_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);
