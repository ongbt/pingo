-- Add play_count to sheet to track most-played sheets
ALTER TABLE public.sheet
  ADD COLUMN IF NOT EXISTS play_count INTEGER NOT NULL DEFAULT 0;

-- Atomic increment helper called from the client after game creation
CREATE OR REPLACE FUNCTION public.increment_sheet_play_count(p_sheet_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.sheet SET play_count = play_count + 1 WHERE id = p_sheet_id;
$$;
