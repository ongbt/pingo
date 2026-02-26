-- Phase 6: Session Robustness
-- Adds activity tracking + auto-expiry for stale lobbies and inactive games.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add last_activity_at to the game table
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.game
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Back-fill existing rows so they don't immediately expire
UPDATE public.game
  SET last_activity_at = created_at
  WHERE last_activity_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Trigger: bump last_activity_at when a player joins (INSERT on player)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bump_game_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.game
    SET last_activity_at = NOW()
    WHERE id = NEW.game_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_game_activity ON public.player;
CREATE TRIGGER trg_bump_game_activity
  AFTER INSERT ON public.player
  FOR EACH ROW EXECUTE FUNCTION public.bump_game_activity();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. expire_stale_sessions() — callable by the client every ~60 s
--    Reads thresholds from game.config:
--      lobby_timeout_min  (default 15) — lobbies that never start
--      game_timeout_min   (default 30) — active games with no new cell marks
--
--    For active games, "last activity" = last player board_state update, which
--    we track via a second trigger below (trg_bump_game_activity_on_mark).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cancel stale lobbies
  UPDATE public.game
    SET status = 'finished'
    WHERE status = 'lobby'
      AND last_activity_at < NOW() -
          (COALESCE((config->>'lobby_timeout_min')::int, 15) * INTERVAL '1 minute');

  -- Terminate inactive active games
  UPDATE public.game
    SET status = 'finished'
    WHERE status = 'active'
      AND last_activity_at < NOW() -
          (COALESCE((config->>'game_timeout_min')::int, 30) * INTERVAL '1 minute');
END;
$$;

-- Grant to anon + authenticated so the browser client can call it
GRANT EXECUTE ON FUNCTION public.expire_stale_sessions() TO anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_sessions() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger: bump last_activity_at when a player updates board_state (cell mark)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bump_game_activity_on_mark()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only bump when board_state actually changed (not score/winner updates)
  IF NEW.board_state IS DISTINCT FROM OLD.board_state THEN
    UPDATE public.game
      SET last_activity_at = NOW()
      WHERE id = NEW.game_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_game_activity_on_mark ON public.player;
CREATE TRIGGER trg_bump_game_activity_on_mark
  AFTER UPDATE ON public.player
  FOR EACH ROW EXECUTE FUNCTION public.bump_game_activity_on_mark();
