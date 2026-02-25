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
- [ ] Anti-cheat mode — multi-player verification for marked squares.

## Phase 4: Stylize (UI/UX) 🏗️

- [x] Landing page styled with Pingo brand identity.
- [x] Create page — sheet gallery (selectable list + play counts), custom sheet
      form.
- [x] Join page — single-screen room code + nickname entry with animations.
- [x] Lobby page — player grid, copy-to-clipboard share card, host controls.
- [x] Game Board — 5x5 grid, bingo button, leaderboard, toast notifications,
      confetti.
- [x] Sheets page — custom sheet creation and management (localStorage).
- [ ] Refine responsive layout for larger screens.
- [ ] Dark mode consistency audit.

## Phase 5: React Migration (Vite Consolidation) ✅

- [x] Scaffold Vite + React + TypeScript project.
- [x] Migrate all components and pages to `src/`.
- [x] Transition routing to `react-router-dom`.
- [x] Update environment variables to `VITE_` prefix.
- [x] Standardize ESLint for React SPA.
- [x] Verify production build and local dev server.

## Phase 6: Session Robustness 🏗️

- [ ] Lobby Timeout: Auto-cancel lobbies if not started within configurable
      time.
- [ ] Game Timeout: Auto-terminate games that remain inactive.
- [ ] Configurable thresholds in Game Settings.

## Phase 7: Deployment ✅

- [x] Create production Supabase project (`uzcumjicbmnlehrdjirl`) in Singapore.
- [x] Push all migrations to production database (11 migrations total).
- [x] Sync default sheet data/seeds (Corporate Townhall, Zoo, Disneyland).
- [x] Enable Realtime for `game` and `player` tables in production.
- [x] Configure `public/_redirects` for Cloudflare SPA routing.
- [x] Setup `.env.production` with `VITE_` prefixed secrets.
- [x] Verify production build (`npm run build`) passes.
- [ ] Connect GitHub repo to Cloudflare Pages (User action required).
- [ ] Setup custom domain on Cloudflare Pages.
