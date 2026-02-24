# Task Plan: Pingo React Conversion

## Phase 1: Blueprint (Vision & Logic) ✅

- [x] Answer Discovery Questions
- [x] Define Data Schema in `gemini.md`
- [x] Research: Define SQL schema for `game`, `player`, and `sheet` tables.

## Phase 2: Link (Connectivity) 🏗️

- [x] Initialize Supabase CLI locally (`supabase init`).
- [x] Create local database migrations.
- [ ] Verify local database connectivity with `python tools/handshake.py`.
- [ ] Build minimal handshake for Supabase Channels (Presence check).

## Phase 3: Architect (Build - MVP Focus) 🏗️

### Layer 1: Architecture

- [x] SOP: Game Start logic (Transitioning from Lobby to Active).
- [x] SOP: Cell marking and Bingo validation (Line check logic).
- [x] Navigation Flow defined.

### Layer 3: Tools

- [ ] Bingo Engine: Board generation (5x5 randomization).
- [ ] Realtime Sync: Implement Channel handlers for Guest players.

### Layer 2: Navigation

- [ ] Route logic between SOPs and execution scripts

- [ ] Develop data migration scripts (if needed)
- [ ] Build core Bingo engine (randomization, score tracking)

## Phase 4: Stylize (UI/UX)

- [ ] Convert static HTML designs to React components
- [ ] Apply Pingo brand identity and premium animations (Framer Motion)
- [ ] Refine responsive mobile-first layout

## Phase 5: Trigger (Deployment)

- [ ] Deploy to Cloudflare Pages / Vercel
- [ ] Finalize Maintenance Log in `gemini.md`
