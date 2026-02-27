-- Phase 11B: RLS Hardening (Anonymous Auth)
-- Replaces overly permissive player policies with strict ones requiring auth.uid()

DROP POLICY IF EXISTS "Anyone can join" ON public.player;
DROP POLICY IF EXISTS "Players can update their own state" ON public.player;

-- In order to allow joining, the user must be authenticated or signed in anonymously
-- Either way they must provide their own auth.uid()
CREATE POLICY "Players can insert themselves" ON public.player 
FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Players can update their own state" ON public.player 
FOR UPDATE USING (auth.uid() = auth_id);

-- Make auth_id NOT NULL for all future rows ? Not necessary since RLS handles it
-- But we can safely rely on RLS alone.
