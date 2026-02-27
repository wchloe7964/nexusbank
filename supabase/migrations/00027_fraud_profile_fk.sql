-- Add FK relationships from fraud tables to profiles
-- (fraud_scores and fraud_cases reference auth.users but we need
--  a FK to profiles for Supabase PostgREST joins)

-- fraud_scores → profiles
ALTER TABLE fraud_scores
  ADD CONSTRAINT fraud_scores_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);

-- fraud_cases → profiles
ALTER TABLE fraud_cases
  ADD CONSTRAINT fraud_cases_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);

-- device_fingerprints → profiles
ALTER TABLE device_fingerprints
  ADD CONSTRAINT device_fingerprints_profile_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);
