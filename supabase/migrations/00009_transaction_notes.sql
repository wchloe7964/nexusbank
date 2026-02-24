-- Transaction Notes & Tags
CREATE TABLE IF NOT EXISTS public.transaction_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  note TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_note_per_user_transaction UNIQUE (user_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_notes_user ON public.transaction_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_notes_tx ON public.transaction_notes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_notes_tags ON public.transaction_notes USING GIN (tags);

ALTER TABLE public.transaction_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON public.transaction_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON public.transaction_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON public.transaction_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON public.transaction_notes FOR DELETE
  USING (auth.uid() = user_id);
