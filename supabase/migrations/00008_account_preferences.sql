-- Account Preferences (nicknames, colors, icons, dashboard visibility)
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'blue';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'wallet';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS hide_from_dashboard BOOLEAN DEFAULT FALSE;
