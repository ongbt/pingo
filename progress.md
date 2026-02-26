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

### Authentication & Profiles (Phase 8 Complete)

- **Supabase Auth**: Implemented authentication using Supabase email/password
  and Google OAuth providers.
- **Sign In / Sign Up Pages**: Built dedicated authentication pages (`/signin`,
  `/signup`) with integrated error handling, loading states, and direct Google
  authentication buttons.
- **Context API (`AuthContext`)**: Created a global context provider to
  seamlessly manage and distribute session, user, and profile data throughout
  the application.
- **User Profiles**:
  - Added `avatar_url` to the `profile` table via database migration
    (`20260225110802_add_avatar_url_and_public_profile.sql`).
  - Added `ProfilePage.tsx` to allow authenticated users to view/edit their
    nicknames and log out.
- **Seamless Game Integration**: Configured `CreatePage` and `JoinPage` to
  automatically populate the nickname from the user's `profile` data so
  authenticated users can hop straight into games without naming themselves
  every time.
- **Dynamic Navigation**: Updated the `HomePage` navigation header and bottom
  tab bar to show a user avatar (or initials) linking to their profile when
  logged in, or a standard user icon linking to sign-in when they are guests.

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

## 2026-02-26

### Performance & Code Quality Audit (Phase 9)

Full static code review conducted across all pages and shared modules. **15
issues** identified — 3 critical, 7 moderate, 5 minor. All tracked in
`task_plan.md § Phase 9`. No fixes applied yet; audit captured for prioritized
resolution.

#### 🔴 Critical

| # | File            | Summary                                                                                                                 |
| - | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1 | `LobbyPage.tsx` | `gameError` checked _after_ status branches — failed queries silently fall through; `gameData.status` mutated directly. |
| 2 | `LobbyPage.tsx` | `handleStartGame` fires one sequential `UPDATE` per player (N+1). With 12 players = 12 DB round-trips.                  |
| 3 | `GamePage.tsx`  | Bingo win check uses `Array.includes()` (O(n)) inside nested loops. Simple `Set` conversion eliminates this.            |

#### 🟡 Moderate

| #  | File              | Summary                                                                                                             |
| -- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| 4  | `HomePage.tsx`    | `useLivePlayerCount` fires 2 chained queries on every realtime event (player change, game update).                  |
| 5  | `LobbyPage.tsx`   | `navigate` in `useEffect` deps causes Supabase channels to be torn down and re-created on re-renders.               |
| 6  | `GamePage.tsx`    | No debounce on cell tap — rapid taps fire multiple overlapping `supabase.update()` calls.                           |
| 7  | `AuthContext.tsx` | `isLoading` stays `true` indefinitely if `fetchProfile` fails and `setProfile(null)` is called while `user` exists. |
| 8  | `SheetsPage.tsx`  | Mount fires 3 sequential queries (top sheets → localStorage IDs → auth user + auth sheets).                         |
| 9  | `LobbyPage.tsx`   | Background image sourced from a hardcoded, unversioned Google URL with no `width`/`height` (CLS risk).              |
| 10 | `LobbyPage.tsx`   | Mock "Sarah K." chat UI with non-functional input/send shipped to production.                                       |

#### 🟢 Minor / Code Quality

| #  | File                              | Summary                                                                                                        |
| -- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 11 | `CreatePage.tsx` / `JoinPage.tsx` | Redundant `supabase.auth.getUser()` called after insert; `user` already available from `AuthContext`.          |
| 12 | `GamePage.tsx`                    | Confetti `requestAnimationFrame` loop has no cleanup — leaks if component unmounts before 3-second timer ends. |
| 13 | `ProfilePage.tsx`                 | `LogOut` and `LinkIcon` imported but only used with `className="hidden"` — dead code.                          |
| 14 | `PopularSheets.tsx`               | `select('*')` pulls full `items` array (25–100 strings) for a component that only needs title + play count.    |
| 15 | `App.tsx`                         | All 9 pages eagerly imported — no route-based code splitting or `React.lazy()`.                                |

### Phase 9 Fixes Applied (all 15 resolved)

All audit issues fixed in a single session. Summary of changes made:

| File                | Change                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| `GamePage.tsx`      | Bingo check: `Array.includes()` → `Set.has()` (O(1))                                 |
| `GamePage.tsx`      | `toggleMark`: `isWritingRef` guard prevents overlapping DB writes on rapid taps      |
| `GamePage.tsx`      | Confetti RAF loop: `active` flag + cleanup return prevents unmount memory leak       |
| `LobbyPage.tsx`     | `fetchData`: error check moved before status branches; no direct response mutation   |
| `LobbyPage.tsx`     | `handleStartGame`: sequential `for...of` → `Promise.all()` (all layouts in parallel) |
| `LobbyPage.tsx`     | `navigate` removed from `useEffect` deps (stable ref); `eslint-disable` added        |
| `LobbyPage.tsx`     | External Google image URL → CSS-only decorative bingo ball divs                      |
| `LobbyPage.tsx`     | Mock "Sarah K." chat section + non-functional input bar removed                      |
| `LobbyPage.tsx`     | `Send` / `Smile` lucide imports removed                                              |
| `AuthContext.tsx`   | `fetchProfile` wrapped in `try/finally`; `setIsLoading(false)` always fires          |
| `AuthContext.tsx`   | Redundant secondary `useEffect` managing `isLoading` removed                         |
| `SheetsPage.tsx`    | 3 sequential queries → 2 parallel `Promise.all()` waves with deterministic merge     |
| `HomePage.tsx`      | `useLivePlayerCount`: 500ms debounce collapses rapid realtime bursts into one fetch  |
| `CreatePage.tsx`    | Removed redundant `getUser()` call — uses `profile` from `AuthContext`               |
| `JoinPage.tsx`      | Removed redundant `getUser()` call — uses `user` from `AuthContext`                  |
| `ProfilePage.tsx`   | Removed unused `LinkIcon` import and dead `className="hidden"` nodes                 |
| `PopularSheets.tsx` | `select('*')` → `select('id, title, play_count, items')`                             |
| `App.tsx`           | All 9 pages converted to `React.lazy()` + shared `<Suspense>` with `PageSpinner`     |
