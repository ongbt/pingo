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

- Fixed ESLint warning in game page: `useEffect` had stale closure references.
  - Introduced `useRef` to track latest values in realtime subscription
    callbacks.
  - Removed unused `useCallback` import.
- TypeScript: compiles clean with zero errors.

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
  - Transitioned from 5-digit numeric to **6-character alphanumeric** codes.
  - Implemented curated character set (excluding ambiguous chars like 0/O, 1/I).
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
- **Join Game — 5-Digit Numeric Codes**:
  - Room code generation switched to 5-digit numeric codes to match keypad UI.
  - Join logic validates that a game exists and is in `lobby` status before
    proceeding.

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

### Host Controls

- **End Game for All**: Added a dedicated "End Game" button (red) in the host
  control panel on the game board. Clicking it opens a confirmation modal
  (anti-accidental-trigger protection). On confirm, the game's `status` is set
  to `'finished'` via Supabase, which the real-time subscription broadcasts to
  all connected players — instantly showing every player a "Game Over" overlay
  with final standings and a "Play Again" link.
  - The host button is disabled once the game is already `finished`.

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

### Custom Sheet Management

- **My Sheets page** (`/sheets`): New dedicated page for managing custom bingo
  sheets. Allows users to create and reuse sheets across multiple games.
- **Sheet creation flow**: Sheet names are required; duplicate items within a
  sheet are not allowed.
- **localStorage persistence**: Custom sheets are stored locally for guest users
  via localStorage.
- **Create Game integration**: The Create page now shows a combo of default
  (from Supabase) and custom sheets (from localStorage) in a unified selection
  UI.

### Seeded More Default Sheets

- Added "Zoo Animals" and "Disneyland Characters" default bingo sheets to the
  production Supabase database via SQL seed scripts.

### Framework Migration (Next.js → React/Vite)

- **Framework Swap**: Migrated from Next.js 15 to **React (Vite)** to streamline
  the client-only architecture.
  - Replaced `next/navigation` with `react-router-dom` for robust client-side
    routing.
  - Replaced `next/image` with standard `<img>` tags (Cloudflare Pages / no SSR
    needed).
- **Project Restructure**: Moved all code from `app/` to `src/` following
  standard Vite patterns.
- **Environment Update**: Transitioned all environment variables from
  `NEXT_PUBLIC_` to `VITE_` prefix.
- **Build & Lint**: Verified a clean production build (`npm run build`) and
  established a standard ESLint config for React.
- **Verification**: Confirmed all 6 main routes are functional and visually
  consistent via local verification.
  - Routes: `/`, `/create`, `/join`, `/lobby/:id`, `/game/:id`, `/sheets`

### Deployment

- **Supabase Cloud**: Created new production project (`uzcumjicbmnlehrdjirl`) in
  Singapore region.
- **Database Architecture**: Pushed all 11 local migrations and synced default
  sheet data to the cloud database.
- **Realtime Networking**: Enabled Realtime for all tables on the production
  project.
- **Cloudflare Configuration**: Set up build settings (Vite preset, `dist`
  output directory, `NODE_VERSION=20`).
- **SPA Routing**: Added `public/_redirects` for Cloudflare Pages wildcard
  routing.
- **Environment Management**: Configured `.env.production` with production-ready
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Live Player Count

- **"Live Now: xx Players" badge**: Replaced the hardcoded `"1.2k Players"` on
  the Home page with a real-time counter powered by Supabase.
  - `useLivePlayerCount` hook fetches the count of players currently in games
    with `status IN ('lobby', 'active')` via a two-step query (game IDs first,
    then player count).
  - Subscribes to `postgres_changes` on `INSERT`/`DELETE` on the `player` table
    and `UPDATE` on the `game` table to trigger a refetch on any relevant
    change.
  - Shows `"…"` while loading, then the live count formatted as a number (or
    `"1.2k"` style for ≥1000).
