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
