-- Create a profile table
CREATE TABLE IF NOT EXISTS public.profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read their own profile" ON public.profile
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profile
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert a profile" ON public.profile
    FOR INSERT WITH CHECK (true); -- Allow the trigger to work

-- Function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profile (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
