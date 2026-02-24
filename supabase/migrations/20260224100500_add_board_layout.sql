-- Add board_layout to player table for per-player card randomization
-- Stores shuffled indices into the sheet's items array
ALTER TABLE public.player
ADD COLUMN IF NOT EXISTS board_layout JSONB DEFAULT NULL;

COMMENT ON COLUMN public.player.board_layout IS 'Shuffled array of indices into sheet.items, giving each player a unique card layout from the same sheet.';
