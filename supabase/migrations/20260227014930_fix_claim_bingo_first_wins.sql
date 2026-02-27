-- Fix claim_bingo to handle firstBingoWins internally safely
CREATE OR REPLACE FUNCTION public.claim_bingo(
  p_game_id UUID,
  p_player_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rank INTEGER;
  v_bonus INTEGER;
  v_game_config JSONB;
BEGIN
  -- Prevent multiple calls for the same player
  IF EXISTS (SELECT 1 FROM public.player WHERE id = p_player_id AND is_winner = true) THEN
    RETURN;
  END IF;

  -- Lock the game row to serialize concurrent claims and get its config
  SELECT config INTO v_game_config FROM public.game WHERE id = p_game_id FOR UPDATE;

  -- Calculate rank: how many players ALREADY have bingo in this game?
  SELECT COALESCE(MAX(bingo_rank), 0) INTO v_rank
  FROM public.player
  WHERE game_id = p_game_id AND is_winner = true;

  v_rank := v_rank + 1;

  IF v_rank = 1 THEN v_bonus := 10;
  ELSIF v_rank = 2 THEN v_bonus := 5;
  ELSIF v_rank = 3 THEN v_bonus := 3;
  ELSE v_bonus := 1;
  END IF;

  UPDATE public.player
  SET is_winner = true,
      bingo_rank = v_rank,
      -- Score = 1 point per cell (board_state length) + bingo bonus
      score = jsonb_array_length(board_state) + v_bonus
  WHERE id = p_player_id
    AND game_id = p_game_id;

  -- Verify firstBingoWins in game.config
  IF v_rank = 1 AND v_game_config IS NOT NULL AND (v_game_config->>'firstBingoWins') = 'true' THEN
    UPDATE public.game SET status = 'finished' WHERE id = p_game_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_bingo(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.claim_bingo(UUID, UUID) TO authenticated;
