-- Fix: Allow reading non-default (custom) sheets so that after a guest
-- inserts a custom sheet (is_default=false, creator_id=null), the app
-- can read it back to get its id and proceed with game creation.
--
-- The original "Public read defaults" policy blocks this because:
--   - is_default = false   → first condition fails
--   - creator_id IS NULL   → auth.uid() = NULL evaluates to NULL (not TRUE)
--
-- We drop the old policy and replace it with one that also permits
-- reading sheets where creator_id IS NULL (guest-created custom sheets).

DROP POLICY IF EXISTS "Public read defaults" ON public.sheet;

CREATE POLICY "Public read sheets" ON public.sheet
  FOR SELECT USING (
    is_default = true
    OR auth.uid() = creator_id
    OR creator_id IS NULL  -- Guest-created custom sheets (no auth)
  );
