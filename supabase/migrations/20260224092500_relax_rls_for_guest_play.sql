-- Relax RLS policies for guest play MVP
-- The original policies required authenticated users for game/sheet creation.
-- Since the app supports guest play (no auth required), we need to allow
-- anonymous inserts. Auth-based policies will be re-tightened when
-- Creator Login is implemented.

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can create sheets" ON public.sheet;
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.game;
DROP POLICY IF EXISTS "Hosts can update their games" ON public.game;

-- Sheet: Allow anyone to create (for custom sheets during game creation)
CREATE POLICY "Anyone can create sheets" ON public.sheet
  FOR INSERT WITH CHECK (true);

-- Game: Allow anyone to create and update (host_id is null for guest hosts)
CREATE POLICY "Anyone can create games" ON public.game
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update games" ON public.game
  FOR UPDATE USING (true);
