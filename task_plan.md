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

- [x] Landing page (`src/pages/HomePage.tsx`) — Host/Join entry point.
- [x] Create Game page (`src/pages/CreatePage.tsx`) — Sheet selection, custom
      sheet, lobby settings.
- [x] Join Game page (`src/pages/JoinPage.tsx`) — Room code entry + nickname
      screen.
- [x] Lobby page (`src/pages/LobbyPage.tsx`) — Pre-game waiting room with player
      grid.
- [x] Game Board page (`src/pages/GamePage.tsx`) — 5x5 grid, marking, bingo
      detection.
- [x] Sheets page (`src/pages/SheetsPage.tsx`) — Sheet management and top
      sheets.

### Layer 3: Data Integration (Supabase Wiring) ✅

- [x] Create page: fetches default sheets, inserts custom sheet, creates game &
      host player.
- [x] Join page: queries game by room code, inserts guest player.
- [x] Lobby page: fetches game + players, realtime subscription for new
      players + game status.
- [x] Game Board page: fetches game with sheet, realtime subscription for player
      updates.
- [x] Room code generation (random 6-char alphanumeric, curated set).
- [x] Uniqueness check loop for room codes.
- [x] Player session via `localStorage`.
- [x] Nickname persistence (localStorage + Supabase profiles).

### Layer 4: Core Logic — Remaining 🏗️

- [x] Bingo win detection (horizontal, vertical, diagonal line check).
- [x] Cell marking + score sync to Supabase.
- [x] Host "Start Game" — transitions lobby to active.
- [x] Board randomization — shuffle and select 24 items from sheet pool
      (supports >25 items).
- [x] Host nickname prompt on Create/Join pages.
- [x] Bingo claim broadcast — visual/audio victory celebration (Confetti +
      Modal).
- [x] End game logic — handle "First Bingo Wins" status updates.
- [x] Host "End Game" button — allows host to force-end the game for all
      players.
- [ ] Anti-cheat mode — multi-player verification for marked squares.

## Phase 4: Stylize (UI/UX) 🏗️

- [x] Landing page styled with Pingo brand identity.
- [x] Create page — sheet gallery, custom sheet form, settings toggles.
- [x] Join page —room code entry, nickname screen with animations.
- [x] Lobby page — player grid, mock chat, host controls, copy-to-clipboard
      card.
- [x] Game Board — 5x5 grid, bingo button, leaderboard, toast notifications,
      confetti.
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
- [ ] Game Timeout: Auto-terminate games if they remain inactive/not started.
- [ ] Configurable thresholds in Game Settings.

## Phase 7: Deployment ✅

- [x] Create production Supabase project (`uzcumjicbmnlehrdjirl`).
- [x] Push all migrations to production Database.
- [x] Sync default sheet data/seeds.
- [x] Configure for Cloudflare Pages (Vite/React SPA).
- [x] Setup `.env.production` for Cloudflare dashboard.
- [ ] Connect GitHub repo to Cloudflare Pages (User action).
