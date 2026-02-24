# Project Progress

## 2026-02-23

- Initialized project memory (`task_plan.md`, `findings.md`, `progress.md`).
- Established `gemini.md` as the Project Constitution.
- **Blueprint Phase Complete**: MVP goals, Hybrid Architecture, and Rules
  defined.
- **Link Phase Started**:
  - Supabase CLI initialized.
  - Initial SQL migrations created for `game`, `player`, and `sheet`.
  - Python `handshake.py` tool created (Awaiting credentials).
- **Architect Phase Started**:
  - Defined SOPs for Game Logic and Realtime Sync.
  - Defined Navigation Flow.
  - Developed `bingo_engine.py` tool for board generation.
- **Stylize Phase Started**:
  - All 5 pages built with Pingo brand identity:
    - Landing (`/`) — Hero, Host/Join buttons, How-it-Works, bottom nav.
    - Create (`/create`) — Sheet carousel, custom sheet form, settings toggles.
    - Join (`/join`) — Keypad room code entry, two-step flow with nickname.
    - Lobby (`/lobby/[id]`) — Player grid, mock chat, host start button.
    - Game Board (`/game/[id]`) — 5x5 grid, marking, bingo detection,
      leaderboard.

## 2026-02-24

### Lint & Code Quality

- Fixed ESLint warning in `app/game/[id]/page.tsx`:
  - `useEffect` had stale closure references to `game` and `players` state.
  - Introduced `useRef` to track latest values in realtime subscription
    callbacks.
  - Removed unused `useCallback` import.
- Remaining lint: `<img>` vs `<Image />` warning for dicebear avatars
  (non-blocking).
- TypeScript: compiles clean with `tsc --noEmit` (zero errors).

### Local Supabase Stack

- Started full local Supabase environment via Docker Desktop:
  - **API**: `http://127.0.0.1:54321`
  - **Database**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
  - **Studio**: `http://127.0.0.1:54323`
  - **Mailpit**: `http://127.0.0.1:54324`
- Migration `20260224012031_initial_schema.sql` applied successfully:
  - Tables created: `sheet`, `game`, `player` (with RLS policies).
  - Seed data loaded: "Corporate Townhall Bingo" default sheet.
- Updated `.env.local` with local Supabase credentials.
- Verified data via REST API: seed sheet confirmed in database.

### Code Review — Supabase Wiring

After reviewing all pages, discovered the Supabase integration was already
largely complete:

- **Create page**: Fetches default sheets, inserts custom sheets, creates game +
  host player, generates room code, saves player ID to localStorage.
- **Join page**: Queries game by room code, two-step flow (code → nickname),
  inserts guest player, saves to localStorage.
- **Lobby page**: Fetches game + players, realtime subscriptions for player
  joins and game status changes, auto-redirects to game on start.
- **Game Board**: Fetches game with sheet, realtime subscription for player
  board_state updates, bingo win detection (H/V/D), toast notifications.

### Current State

- **Phase 1 (Blueprint)**: ✅ Complete
- **Phase 2 (Link)**: ✅ Complete — local Supabase running, DB connected
- **Phase 3 (Architect)**: 🏗️ ~80% — pages + wiring done, missing board
  randomization, host nickname, bingo broadcast, end game logic
- **Phase 4 (Stylize)**: 🏗️ ~85% — all pages styled, needs responsive + dark
  mode audit

### Next Steps

1. Add host nickname prompt on Create page (currently hardcoded as "Host").
2. Board randomization — shuffle sheet items per player.
3. Bingo claim broadcast — notify all players when someone wins.
4. End game logic — "First Bingo Wins" vs "Casual" mode.
5. Replace `<img>` with `next/image` for dicebear avatars.
