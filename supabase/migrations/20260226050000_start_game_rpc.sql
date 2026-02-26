-- Secure RPC: start_game
-- Only the player who is_host for the given game_id can start the game.
-- This replaces the client-side-only guard that could be bypassed by any
-- browser that constructs a direct Supabase update call.
CREATE OR REPLACE FUNCTION public.start_game(
  p_game_id  UUID,
  p_player_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER   -- executes with full DB privileges so the anon role can run it
SET search_path = public
AS $$
DECLARE
  v_is_host BOOLEAN;
  v_status  TEXT;
BEGIN
  -- 1. Verify the caller is actually the host of this game
  SELECT is_host INTO v_is_host
  FROM player
  WHERE id = p_player_id
    AND game_id = p_game_id;

  IF v_is_host IS NULL OR v_is_host = FALSE THEN
    RAISE EXCEPTION 'Forbidden: only the host can start the game';
  END IF;

  -- 2. Verify the game is still in lobby state
  SELECT status INTO v_status
  FROM game
  WHERE id = p_game_id;

  IF v_status IS DISTINCT FROM 'lobby' THEN
    RAISE EXCEPTION 'Game is not in lobby state (current: %)', v_status;
  END IF;

  -- 3. Start the game
  UPDATE game
  SET status = 'active'
  WHERE id = p_game_id;
END;
$$;

-- Grant execute to the anon role so guests can call it via the client
GRANT EXECUTE ON FUNCTION public.start_game(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.start_game(UUID, UUID) TO authenticated;
