-- Add avatar_url to profile
ALTER TABLE public.profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS to allow anyone to read profiles (needed for Lobby player grid display of authenticated users)
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profile;

CREATE POLICY "Anyone can read profiles" ON public.profile
    FOR SELECT USING (true);
