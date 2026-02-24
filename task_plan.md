# Task Plan: Pingo React Conversion

## Phase 1: Blueprint (Vision & Logic) ✅

- [x] Answer Discovery Questions
- [x] Define Data Schema in `gemini.md`
- [x] Research: Define SQL schema for `game`, `player`, and `sheet` tables.

## Phase 2: Link (Connectivity) ✅

- [x] Initialize Supabase CLI locally (`supabase init`).
- [x] Create local database migrations (`20260224012031_initial_schema.sql`).
- [x] Start local Supabase stack via Docker (`supabase start`).
- [x] Configure `.env.local` with local Supabase credentials.
- [x] Verify local database connectivity — seed sheet confirmed via REST API.

## Phase 3: Architect (Build - MVP Focus) 🏗️

### Layer 1: Architecture ✅

- [x] SOP: Game Start logic (Transitioning from Lobby to Active).
- [x] SOP: Cell marking and Bingo validation (Line check logic).
- [x] Navigation Flow defined.

### Layer 2: Pages (React Components) ✅

- [x] Landing page (`app/page.tsx`) — Host/Join entry point.
- [x] Create Game page (`app/create/page.tsx`) — Sheet selection, custom sheet,
      lobby settings.
- [x] Join Game page (`app/join/page.tsx`) — Room code entry + nickname step.
- [x] Lobby page (`app/lobby/[id]/page.tsx`) — Pre-game waiting room with player
      grid.
- [x] Game Board page (`app/game/[id]/page.tsx`) — 5x5 grid, marking, bingo
      detection.

### Layer 3: Data Integration (Supabase Wiring) ✅

- [x] Create page: fetches default sheets, inserts custom sheet, creates game &
      host player.
- [x] Join page: queries game by room code, inserts guest player.
- [x] Lobby page: fetches game + players, realtime subscription for new
      players + game status.
- [x] Game Board page: fetches game with sheet, realtime subscription for player
      updates.
- [x] Room code generation (random 5-char alphanumeric).
- [x] Player session via `localStorage` (`pingo_player_{gameId}`).

### Layer 4: Core Logic — Remaining 🏗️

- [x] Bingo win detection (horizontal, vertical, diagonal line check).
- [x] Cell marking + score sync to Supabase.
- [x] Host "Start Game" — transitions lobby to active.
- [ ] Board randomization — shuffle sheet items per player (currently all
      players see same order).
- [ ] Nickname prompt for host on Create page (currently hardcoded as "Host").
- [ ] Bingo claim broadcast — notify all players when someone wins.
- [ ] End game logic — handle "First Bingo Wins" vs "Casual" mode from config.
- [ ] Anti-cheat mode — multi-player verification for marked squares.

## Phase 4: Stylize (UI/UX) 🏗️

- [x] Landing page styled with Pingo brand identity.
- [x] Create page — sheet carousel, custom sheet form, settings toggles.
- [x] Join page — keypad room code entry, nickname step with animations.
- [x] Lobby page — player grid, mock chat, host controls.
- [x] Game Board — 5x5 grid, bingo button, leaderboard, toast notifications.
- [ ] Refine responsive layout for larger screens.
- [ ] Dark mode consistency audit.
- [ ] Replace `<img>` with `next/image` for performance.

## Phase 5: Trigger (Deployment)

- [ ] Deploy to Cloudflare Pages / Vercel.
- [ ] Link to cloud Supabase project.
- [ ] Finalize Maintenance Log in `gemini.md`.
