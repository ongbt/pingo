-- Allow players to delete their own row (for Quit functionality)
-- Using a permissive policy consistent with the guest-play MVP approach
CREATE POLICY "Anyone can delete players" ON public.player
  FOR DELETE USING (true);
