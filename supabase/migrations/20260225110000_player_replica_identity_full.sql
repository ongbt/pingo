-- Set REPLICA IDENTITY FULL on player table
-- Required for Supabase Realtime to deliver DELETE events through filtered
-- channels (e.g. game_id=eq.<id>). Without FULL, the filter is evaluated
-- against the old row's primary key only, causing DELETE events to be dropped
-- when filtering on non-PK columns.
ALTER TABLE public.player REPLICA IDENTITY FULL;
