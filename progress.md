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

### Major Milestones

- **Game Completion Engine**:
  - Implemented `handleBingo` with realtime status synchronization.
  - Added visual victory celebration using `canvas-confetti` and `framer-motion`
    modals.
  - Implemented board randomization via `board_layout` (unique shuffle per
    player).
- **Alphanumeric Room System**:
  - Successfully transitioned from 5-digit numeric to **6-character
    alphanumeric** codes.
  - Implemented curated character set (excluding ambiguous characters like 0/O,
    1/I).
  - Built a uniqueness check loop to prevent code collisions in high-traffic
    scenarios.
- **Persistence & Profiles**:
  - Created `profile` table in Supabase to store persistent user data
    (nickname).
  - Implemented `localStorage` syncing for guest and authenticated players.
  - Added nickname loading/auto-filling in create and join flows.
- **Improved Join Flow**:
  - Replaced numeric keypad with high-fidelity alphanumeric input.
  - Added "Copy to Clipboard" utility card in the lobby for easy sharing.

### Current State

- **Phase 1 (Blueprint)**: ✅ Complete
- **Phase 2 (Link)**: ✅ Complete
- **Phase 3 (Architect)**: ✅ Complete — Core MVP logic and data sync finished.
- **Phase 4 (Stylize)**: 🏗️ ~95% — All pages styled and interactive. Refinement
  phase active.

## 2026-02-25

### Bug Fixes

- **Back to Lobby (finished game)**: Fixed broken "Back to Lobby" button on the
  winner screen. The lobby page had no handling for `finished` game status —
  navigating back left the game stuck in `finished` state with stale player
  data. Now the lobby auto-resets the game to `lobby` status and clears all
  player states (`board_state`, `board_layout`, `score`, `is_winner`) so the
  group can start a fresh round.

### UX Improvements

- **Join flow consolidated**: Merged the two-step join flow (code → nickname)
  into a single screen. Players now enter both the room code and their nickname
  on one page before hitting a single "Let's Play!" button. Removed `step` state
  machine and `AnimatePresence` step transitions. Inline error messages replace
  `alert()` dialogs.

### Bug Fixes (cont.)

- **Custom Sheet RLS — SELECT policy**
  (`20260225111000_allow_custom_sheet_select.sql`):
  - **Root cause**: The original `"Public read defaults"` policy on the `sheet`
    table only permitted reading rows where `is_default = true` OR
    `auth.uid() = creator_id`. Guest-created custom sheets have
    `is_default = false` AND `creator_id IS NULL`. In SQL, `auth.uid() = NULL`
    evaluates to **NULL** (not TRUE), so the `.select()` after inserting a
    custom sheet returned no rows — causing game creation to fail silently.
  - **Fix**: Dropped the old policy and replaced it with `"Public read sheets"`
    which adds a third branch: `OR creator_id IS NULL`. This allows guest hosts
    to read back the sheet record they just created.

### Next Steps

1. Anti-cheat mode (verification logic).
2. Replace `<img>` with `next/image` for dicebear avatars.
3. Responsive layout audit for desktop.
4. Final dark mode contrast review.

### Host Controls

- **End Game for All**: Added a dedicated "End Game" button (red) in the host
  control panel on the game board. Clicking it opens a confirmation modal
  (anti-accidental-trigger protection). On confirm, the game's `status` is set
  to `'finished'` via Supabase, which the real-time subscription broadcasts to
  all connected players — instantly showing every player a "Game Over" overlay
  with final standings and a "Play Again" link.
  - The host button is disabled once the game is already `finished`.
  - A separate `!winner && game.status === 'finished'` overlay is shown
    (distinct from the winner screen) to clearly communicate the forced end.

- **Player Quit**: Added `handleQuit` to the game page. Non-host players who
  click Quit are deleted from the `player` table and their `localStorage` entry
  is cleared. The host Quit button is disabled with a tooltip directing them to
  End Game instead.

- **Realtime DELETE propagation**: Added `DELETE` event handling to the
  `playerChannel` subscription so remaining players see quitted players
  disappear from the leaderboard instantly. Fixed the root cause by setting
  `REPLICA IDENTITY FULL` on the `player` table
  (`20260225110000_player_replica_identity_full.sql`) — without this, Supabase
  Realtime drops DELETE events on channels filtered by non-PK columns like
  `game_id`.

### `next/image` Migration

- Added `remotePatterns` to `next.config.ts` for the three external image hosts:
  `api.dicebear.com`, `lh3.googleusercontent.com`, `images.unsplash.com`.
- Replaced every `<img>` tag across:
  - `app/page.tsx` — Unsplash SheetCard hero image (uses `fill` layout).
  - `app/lobby/[id]/page.tsx` — decorative bingo-balls background image, player
    grid avatars, and mock lobby chat avatars.
  - `app/game/[id]/page.tsx` — mini-leaderboard avatars, winner screen avatar
    (wrapped `motion.div` around `Image` to preserve Framer Motion animation),
    and game-over standings avatars.
- All SVG-based dicebear avatars use `unoptimized` since Next.js cannot optimize
  SVG images natively.
- `tsc --noEmit` passes clean — zero TypeScript errors.

### Play Count Display + Create Page Redesign

- **Create page** sheet picker redesigned from carousel to clean selectable list
  with play counts.
- **Home page** Popular Sheets now fetches real play_count data via
  PopularSheets client component.

### Deployment 🚀

- **Supabase Cloud**: Created new production project (`uzcumjicbmnlehrdjirl`) in
  Singapore region.
- **Database Architecture**: Pushed all 11 local migrations and synced default
  sheet data to the cloud database.
- **Realtime Networking**: Enabled Realtime for all tables on the production
  project.
- **Cloudflare Migration**: Optimized Next.js configuration for
  `@cloudflare/next-on-pages` using the Edge runtime for all main application
  routes.
- **Environment Management**: Configured `.env.production` with production-ready
  Supabase URL and Anon Key.

### Migration 🚀

- **Framework Swap**: Migrated from Next.js 15 to **React (Vite)** to streamline
  the client-only architecture.
  - Replaced `next/navigation` with `react-router-dom` for robust client-side
    routing.
  - Replaced `next/image` with standard `<img>` tags (since Cloudflare
    Pages/Next.js optimization was unnecessary for this project).
- **Project Restructure**: Moved all code from `app/` to `src/` following
  standard Vite patterns.
- **Environment Update**: Transitioned all environment variables from
  `NEXT_PUBLIC_` to `VITE_` prefix.
- **Build & Lint**: Verified a clean production build (`npm run build`) and
  established a standard ESLint config for React.
- **Verification**: Confirmed all 6 main routes are functional and visually
  consistent via local verification.
