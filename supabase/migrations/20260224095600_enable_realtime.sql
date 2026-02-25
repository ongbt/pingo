-- Enable Realtime for game and player tables
-- Without this, postgres_changes subscriptions receive no events.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.game;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.player;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- NOTE: REPLICA IDENTITY FULL for the player table is set in
-- 20260225110000_player_replica_identity_full.sql — required so that
-- DELETE events are delivered through game_id-filtered Realtime channels.
