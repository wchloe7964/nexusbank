-- Feature 3: Transaction Category Editing
-- Users can re-categorize transactions; original category preserved for undo

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS original_category TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_edited_at TIMESTAMPTZ;
