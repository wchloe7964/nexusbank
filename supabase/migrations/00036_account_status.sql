-- Add status column to accounts for freeze/close/suspend tracking
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Sync existing records: if is_active = false, set status to 'frozen' (safe default)
UPDATE accounts SET status = 'frozen' WHERE is_active = false AND status = 'active';

-- Add check constraint for valid statuses
ALTER TABLE accounts ADD CONSTRAINT accounts_status_check
  CHECK (status IN ('active', 'frozen', 'suspended', 'closed'));

-- Index for fast status filtering
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts (status);
