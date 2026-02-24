-- Core Tables for Pingo

-- 1. Sheets (UGC)
CREATE TABLE IF NOT EXISTS public.sheet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    items TEXT[] NOT NULL CHECK (cardinality(items) >= 25),
    is_default BOOLEAN DEFAULT FALSE,
    creator_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Games (Rooms)
CREATE TABLE IF NOT EXISTS public.game (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL,
    host_id UUID REFERENCES auth.users(id),
    sheet_id UUID REFERENCES public.sheet(id),
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'finished')),
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Players (Session-based)
CREATE TABLE IF NOT EXISTS public.player (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.game(id) ON DELETE CASCADE,
    auth_id UUID REFERENCES auth.users(id), -- Null for guests
    nickname TEXT NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    board_state JSONB DEFAULT '[]'::jsonb,
    score INTEGER DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Basic)
ALTER TABLE public.sheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player ENABLE ROW LEVEL SECURITY;

-- Sheets: Everyone can read defaults, users can read/write their own
CREATE POLICY "Public read defaults" ON public.sheet FOR SELECT USING (is_default = true OR auth.uid() = creator_id);
CREATE POLICY "Authenticated users can create sheets" ON public.sheet FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

-- Games: Joiners can read if they have the code (simplified for now)
CREATE POLICY "Anyone can read active games" ON public.game FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create games" ON public.game FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their games" ON public.game FOR UPDATE TO authenticated USING (auth.uid() = host_id);

-- Players: Anyone can join a game
CREATE POLICY "Players can read lobby" ON public.player FOR SELECT USING (true);
CREATE POLICY "Anyone can join" ON public.player FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their own state" ON public.player FOR UPDATE USING (id = id); -- Simplified, usually session-bound

-- Seed Default Sheets
INSERT INTO public.sheet (title, items, is_default)
VALUES (
    'Corporate Townhall Bingo',
    ARRAY[
        'Synergy', 'Alignment', 'Deep dive', 'Circle back', 'Low hanging fruit',
        'Move the needle', 'Paradigm shift', 'Bandwidth', 'Take it offline', 'Ecosystem',
        'Stakeholder', 'Win-win', 'Best-in-class', 'Touch base', 'Game changer',
        'Value add', 'Leverage', 'Scalable', 'Actionable', 'Millennial',
        'Disruptive', 'Core competency', 'In the loop', 'Roadmap', 'Pivotal'
    ],
    TRUE
);
