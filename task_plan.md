# Task Plan: Pingo

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

## Phase 3: Architect (Build - MVP Focus) ✅

### Layer 1: Architecture ✅

- [x] SOP: Game Start logic (Transitioning from Lobby to Active).
- [x] SOP: Cell marking and Bingo validation (Line check logic).
- [x] Navigation Flow defined.

### Layer 2: Pages (React Components) ✅

- [x] Landing page (`src/pages/HomePage.tsx`) — Host/Join entry point.
- [x] Create Game page (`src/pages/CreatePage.tsx`) — Sheet selection, custom
      sheet, lobby settings.
- [x] Join Game page (`src/pages/JoinPage.tsx`) — Single-screen room code +
      nickname entry.
- [x] Lobby page (`src/pages/LobbyPage.tsx`) — Pre-game waiting room with player
      grid.
- [x] Game Board page (`src/pages/GamePage.tsx`) — 5x5 grid, marking, bingo
      detection.
- [x] Sheets page (`src/pages/SheetsPage.tsx`) — Custom sheet management.

### Layer 3: Data Integration (Supabase Wiring) ✅

- [x] Create page: fetches default sheets, inserts custom sheet, creates game &
      host player.
- [x] Join page: queries game by room code, inserts guest player.
- [x] Lobby page: fetches game + players, realtime subscription for new
      players + game status.
- [x] Game Board page: fetches game with sheet, realtime subscription for player
      updates + DELETE events.
- [x] Room code generation (random 6-char alphanumeric, curated set).
- [x] Uniqueness check loop for room codes.
- [x] Player session via `localStorage`.
- [x] Nickname persistence (localStorage + Supabase profiles).

### Layer 4: Core Logic ✅

- [x] Bingo win detection (horizontal, vertical, diagonal line check).
- [x] Cell marking + score sync to Supabase.
- [x] Host "Start Game" — transitions lobby to active.
- [x] Board randomization — shuffle and select 24 items from sheet pool
      (supports >25 items).
- [x] Host nickname prompt on Create/Join pages.
- [x] Bingo claim broadcast — visual/audio victory celebration (Confetti +
      Modal).
- [x] End game logic — handle "First Bingo Wins" status updates.
- [x] Host "End Game" button — force-end the game for all players.
- [x] Player Quit — non-host players can leave; DELETE propagated via Realtime.
- [x] `REPLICA IDENTITY FULL` on `player` table for correct DELETE events.
- [x] Sheet preview — tap to open a read-only modal showing all items in a sheet
      before selecting or duplicating it.

## Phase 4: Stylize (UI/UX) 🏗️

- [x] Landing page styled with Pingo brand identity.
- [x] Create page — sheet gallery (selectable list + play counts), custom sheet
      form.
- [x] Join page — single-screen room code + nickname entry with animations.
- [x] Lobby page — player grid, copy-to-clipboard share card, host controls.
- [x] Game Board — 5x5 grid, bingo button, leaderboard, toast notifications,
      confetti.
- [x] Sheets page — custom sheet creation and management (localStorage).
- [x] Anti-cheat mode — ensure all players in a game share the same set of 24
      items.
- [x] Sheet duplication — clone any existing sheet (default or custom) as a
      starting point for a new custom sheet.
- [x] "Live Now: xx Players" indicator — real-time active player count badge on
      the Home page, subscribed via Supabase Realtime.
- [x] Refine responsive layout for larger screens (constrained centered mobile
      wrapper).
- [x] Dark mode consistency audit.

## Phase 5: React Migration (Vite Consolidation) ✅

- [x] Scaffold Vite + React + TypeScript project.
- [x] Migrate all components and pages to `src/`.
- [x] Transition routing to `react-router-dom`.
- [x] Update environment variables to `VITE_` prefix.
- [x] Standardize ESLint for React SPA.
- [x] Verify production build and local dev server.

## Phase 6: Session Robustness ✅

- [x] Lobby Timeout: Auto-cancel lobbies if not started within configurable
      time.
- [x] Game Timeout: Auto-terminate games that remain inactive.
- [x] Configurable thresholds in Game Settings.
- [x] Minimum 2 Players Config: Auto-terminate if player count drops below 2.

## Phase 7: Deployment ✅

- [x] Create production Supabase project (`uzcumjicbmnlehrdjirl`) in Singapore.
- [x] Push all migrations to production database (11 migrations total).
- [x] Sync default sheet data/seeds (Corporate Townhall, Zoo, Disneyland).
- [x] Enable Realtime for `game` and `player` tables in production.
- [x] Configure `public/_redirects` for Cloudflare SPA routing.
- [x] Setup `.env.production` with `VITE_` prefixed secrets.
- [x] Verify production build (`npm run build`) passes.
- [x] Connect GitHub repo to Cloudflare Pages (User action required).
- [x] Setup custom domain on Cloudflare Pages.
- [x] Configure Convex Preview Deploy Key in Cloudflare.
- [x] Configure stable staging redirect URI in Google OAuth.

## Phase 8: Authentication & Profiles ✅

### 8A: Sign Up / Sign In ✅

- [x] Enable Supabase Auth (email/password) on local and production projects.
- [x] Create migration: add `user_id` (UUID, FK → `auth.users`) to `profile`
      table.
- [x] Add RLS policies: users can read/update their own profile row.
- [x] Build `SignUpPage.tsx` — email + password form with validation and error
      feedback.
- [x] Build `SignInPage.tsx` — email + password form, "Forgot password?" link.
- [x] Wire Supabase `signUp` / `signInWithPassword` / `signOut` calls (and
      Google Auth).
- [x] Create `AuthContext` (`src/context/AuthContext.tsx`) — exposes `session`,
      `user`, `signIn`, `signUp`, `signOut` helpers to the whole app.
- [x] Protect routes: redirect unauthenticated users away from profile page.
- [x] Surface auth entry points on the Home page (Sign In / Sign Up buttons).
- [x] Handle Supabase email confirmation flow (show "check your email" state).

### 8B: User Profile ✅

- [x] Build `ProfilePage.tsx` — display and edit display name / avatar URL.
- [x] Persist profile changes to the `profile` table via Supabase.
- [x] Link profile nickname to the game session so signed-in users don't need to
      re-enter it on Create/Join pages.
- [x] Show avatar / display name in the Lobby player grid for signed-in users.
- [x] Add "My Sheets" shortcut on the profile page (links to `SheetsPage`).
- [x] Add route `/profile` guarded by auth check.
- [x] Update navigation header / Home page to show user avatar or initials when
      signed in, with a Sign Out option.

## Phase 9: Performance & Code Quality Audit 🏗️

> Audit conducted 2026-02-26. 15 issues identified across 6 files. Priority: 🔴
> Critical → 🟡 Moderate → 🟢 Minor.

### 9A: Critical Fixes

- [x] **`LobbyPage.tsx` — Logic bug: error check after status checks**
      (`lines 33–60`)
  - `gameError` is checked _after_ `gameData?.status` branches, meaning a failed
    query silently falls through. Also mutates `gameData.status` directly (line
    54).
  - **Fix**: Move error check to the top, then handle statuses below it.

- [x] **`LobbyPage.tsx` — N+1 sequential DB writes in `handleStartGame`**
      (`lines 149–161`)
  - Iterates players in a `for...of` and fires one `UPDATE` per player
    sequentially. With 12 players → 12 sequential round-trips before the game
    can start.
  - **Fix**: Replace with `Promise.all()` to run all layout updates in parallel.

- [x] **`GamePage.tsx` — O(n) `includes()` in bingo win check** (`line 128–129`)
  - `markedWithCenter.includes(idx)` iterates an array inside nested loops (12
    win lines × 5 cells = up to 60 O(n) checks per render).
  - **Fix**: Convert `markedWithCenter` to a `Set` for O(1) `.has()` lookups.

### 9B: Moderate Fixes

- [x] **`HomePage.tsx` — 2 chained queries on every realtime event**
      (`lines 16–33`)
  - `useLivePlayerCount` fires `fetchCount()` (2 sequential queries) on every
    player INSERT/DELETE and game UPDATE — excessive DB load during active
    games.
  - **Fix**: Added 500ms debounce (`scheduleFetch`) to collapse rapid event
    bursts into a single fetch. Proper cleanup on unmount.

- [x] **`LobbyPage.tsx` — `navigate` in `useEffect` deps causes extra
      re-subscriptions** (`line 125`)
  - Including `navigate` in the dependency array tears down/re-creates both
    Realtime channels when `navigate` reference changes between renders.
  - **Fix**: Removed from deps with `eslint-disable` comment (navigate from
    React Router v6 is referentially stable).

- [x] **`GamePage.tsx` — No debounce on cell tap → overlapping DB writes**
      (`lines 141–144`)
  - Every tap fires an immediate `await supabase.update()`. Rapid taps create
    overlapping requests with no rollback on failure.
  - **Fix**: Added `isWritingRef` guard — ignores taps while a write is
    in-flight.

- [x] **`AuthContext.tsx` — `isLoading` stuck `true` when profile fetch fails**
      (`lines 42–78`)
  - If `fetchProfile` errors, `setProfile(null)` is called but `isLoading` is
    never cleared because the `user && profile` condition is not met.
  - **Fix**: Wrapped fetch in `try/finally`; `setIsLoading(false)` now always
    fires. Removed the now-redundant secondary `useEffect`.

- [x] **`SheetsPage.tsx` — 3 sequential queries on mount** (`lines 264–301`)
  - Top sheets query, localStorage sheets query, and auth user + auth sheets
    query all run sequentially. Items 1 and 2 have no dependency on each other.
  - **Fix**: Parallelized into two `Promise.all()` waves; results merged
    deterministically (auth-owned first, then local-only).

- [x] **`LobbyPage.tsx` — Hardcoded external Google image URL** (`line 215`)
  - `src="https://lh3.googleusercontent.com/..."` will break if unavailable.
    Also missing `width`/`height` attributes → layout shift (CLS regression).
  - **Fix**: Replaced with CSS-only decorative bingo ball divs (no external
    dependency).

- [x] **`LobbyPage.tsx` — Mock chat UI shipped in production** (`lines 346–372`)
  - Hardcoded "Sarah K." messages with a non-functional Send button/input
    confuse real users into thinking chat works.
  - **Fix**: Removed mock chat section and non-functional input bar entirely.

### 9C: Minor / Code Quality

- [x] **`CreatePage.tsx` / `JoinPage.tsx` — Redundant `supabase.auth.getUser()`
      call** (`CreatePage line 320`, `JoinPage line 64`)
  - `getUser()` is called after insert when `profile` / `user` is already
    available from `AuthContext`.
  - **Fix**: Used `profile` / `user` from `useAuth()` context directly.

- [x] **`GamePage.tsx` — Confetti `requestAnimationFrame` loop leaks on
      unmount** (`lines 194–220`)
  - The 3-second confetti loop has no cleanup. If the component unmounts
    mid-loop (e.g., `navigate('/')`) the RAF keeps firing → CPU/memory leak.
  - **Fix**: Added `let active = true` guard flag; cleanup returns
    `() => { active = false; }`.

- [x] **`ProfilePage.tsx` — Unused imports and dead `hidden` elements**
      (`lines 7, 152–153`)
  - `LogOut` and `LinkIcon` imported but rendered only with
    `className="hidden"`.
  - **Fix**: Removed `LinkIcon` import and the two dead JSX nodes.

- [x] **`PopularSheets.tsx` — `select('*')` fetches oversized sheet data**
      (`line 26`)
  - Fetches all columns including the full `items` array (25–100 strings) just
    to display title and play count.
  - **Fix**: Changed to `select('id, title, play_count, items')` — explicit
    column list instead of wildcard.

- [x] **`App.tsx` — No route-based code splitting** (`lines 1–10`)
  - All 9 pages are eagerly imported, bundled into a single chunk, and loaded on
    every page visit.
  - **Fix**: All 9 pages converted to `React.lazy()` + single `<Suspense>`
    boundary with a shared `PageSpinner` fallback.

## Phase 10: Security & UX Hardening ✅

### 10A: Host-Only Game Start (Server-Side Enforcement)

- [x] Create `start_game(p_game_id, p_player_id)` Postgres RPC function with
      `SECURITY DEFINER`.
  - Validates `is_host = true` for the given player + game is in `'lobby'`
    state.
  - Raises `Forbidden` exception for non-hosts.
  - Grants `EXECUTE` to `anon` and `authenticated` roles.
- [x] Migration `20260226050000_start_game_rpc.sql` pushed to local and
      production Supabase.
- [x] Replace direct `game` table `UPDATE` in `handleStartGame` with
      `supabase.rpc('start_game', ...)`.
- [x] Remove `else` fallback in player identification that could grant any URL
      visitor another player's identity.

### 10B: Lobby Access Control

- [x] Block unauthorized URL visitors from viewing the lobby.
  - Only users with a valid `pingo_player_<gameId>` localStorage entry (matching
    an existing DB player) may enter.
  - Stale or missing sessions → `isUnauthorized = true`.
- [x] Show **Access Denied** screen with `ShieldOff` icon and explanation
      message.
- [x] Auto-redirect to `/` after 3 seconds (`replace: true` — disables back
      button).
- [x] "Go Home Now" button for instant redirect.

### 10C: Bug Fix — Duplicate Host in Lobby Participants

- [x] Deduplicate `INSERT` events in the `lobby_players` realtime channel.
  - Supabase replays recent inserts on subscribe; added `id` check before
    appending.

### 10D: Share / Invite Link Feature

- [x] Lobby card's Copy button → **Share icon button** (`Share2`).
  - Uses `navigator.share` (native OS share sheet) where available.
  - Falls back to copying the deep-link URL to clipboard.
- [x] Join URL: `<origin>/join?code=XXXXXX`
- [x] `JoinPage.tsx`: Read `?code=` query param and pre-fill the room code input
      on mount.
- [x] Context-aware toast: "Room Code Copied!" vs "Invite Link Copied!".

## Phase 11: Production Hardening (Supabase Review) ✅

### 11A: Server-Side Session Cleanup (pg_cron)

- [x] Enable `pg_cron` extension in a new migration.
- [x] Schedule `expire_stale_sessions()` to run every 5 minutes automatically,
      removing the reliance on client-side triggering.

### 11B: RLS Hardening (Anonymous Auth)

- [x] Enable Anonymous Sign-Ins in `supabase/config.toml`.
- [x] Update RLS policies on the `player` table to require
      `auth.uid() = auth_id` for `UPDATE` operations, preventing guests from
      tampering with other players' boards.
- [x] Refactor client-side guest session logic to use
      `supabase.auth.signInAnonymously()` upon joining or creating a game.

## Phase 12: Convex Migration ✅

- [x] Configure Convex Auth with Google, Password, and Anonymous providers.
- [x] Create Convex schema for `users`, `sheet`, `game`, and `player` (using
      `authTables`).
- [x] Implement backend logic in Convex (`sheets.ts`, `games.ts`, `players.ts`,
      `auth_queries.ts`, `users.ts`).
- [x] Migrate all frontend pages to Convex reactive hooks (`useQuery`,
      `useMutation`).
- [x] Refactor Authentication to use Convex Auth (`SignInPage.tsx`,
      `SignUpPage.tsx`, `ProfilePage.tsx`).
- [x] Implement real-time player counts and game status via Convex queries.
- [x] Clean up Supabase redundant files and context.
- [x] Address linting errors and ensure type safety with Convex `Doc` and `Id`.

## Phase 13: Post-Migration Fixes & Polishing ✅

- [x] Fix: Board layout mapping bug.
  - Resolved issue where starting a game incorrectly mapped `boardLayout` to
    `boardState`, causing all cells to be marked at the start.
  - Updated `updateBoard` mutation in Convex to handle `boardState` and
    `boardLayout` independently.
  - Corrected `LobbyPage.tsx` to pass the generated layout to the correct field.

## Phase 14: Handover & Documentation ✅

- [x] **Detailed Environment Setup Guide**: Created `ENV_SETUP.md` with
      comprehensive steps for local, dev, and prod environments.
  - Included step-by-step instructions for cloning and initial setup
    (`npm install`, `npx convex dev`).
  - Detailed Google OAuth redirect URI patterns for all environments.
  - Added a troubleshooting section for common auth issues (corrupted keys,
    mismatched URLs).
  - Provided a verification checklist for deployment readiness.
- [x] **Project Connectivity Map**: Documented the relationship between Vite
      environment variables and Convex backend configuration.

## Phase 15: Environment Synchronization ✅

- [x] **Preview Setup Guide**: Integrated instructions for branch-based staging
      environments into `ENV_SETUP.md`.
- [x] **Google OAuth Audit**: Finalize redirect URIs for the stable staging
      backend name.
- [x] **Verification**: Confirm Cloudflare build successfully creates a backend
      preview and links it to the frontend via `VITE_CONVEX_URL`.
- [x] **Deploy Frontend to Cloudflare Pages**: Connect staging frontend to
      Convex preview.

## Phase 16: UX & SEO Master Audit ✅

- [x] **Run Antigravity Master Checklist** (`checklist.py`):
  - Passed core checks: Security Scan, Lint Check, Schema Validation, Test
    Runner.
- [x] **Refine UX Audit Tool**:
  - Removed false-positive label detections affecting React Components
    (`StepCard`, `twitter:card`).
- [x] **Refine SEO Audit Tool**:
  - Removed false-positive missing `<title>` detections hitting `<header>`
    layout tags.
- [x] **Resolve Legitimate SEO Issues**:
  - Fixed multiple `H1` tag violation in `LobbyPage.tsx` by demoting "Access
    Denied" state to an `H2`.
- [x] **Pass Master Checklist**: Zero failed checks remaining across all 6 core
      audit tools.
