# Plan: Pingo React App Conversion

Conversion of static HTML designs into a fully functional, multiplayer React
(Next.js) application.

## 🏁 Overview

We will transform the existing design-driven HTML files into a structured
Next.js application, integrating real-time multiplayer capabilities using
Supabase.

- **Project Type**: WEB (Mobile-Responsive Web App)
- **Primary Agent**: `frontend-specialist`
- **Secondary Agent**: `backend-specialist` (for Supabase integration)

## 🎯 Success Criteria

- Fully responsive mobile-first UI based on the Stitch designs.
- Dynamic Bingo board generation (5x5).
- Real-time multiplayer synchronization (Lobby, Game, Scoreboard).
- UGC support for custom Bingo sheets.
- GM controls for starting/ending games.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (converting from vanilla CSS)
- **State/Realtime**: Supabase (PostgreSQL + Realtime Channels)
- **Icons**: Lucide React
- **Animations**: Framer Motion (for premium feel)

## 📁 File Structure

```plaintext
/app
  /lobby/[id]        # Multiplayer lobby
  /game/[id]         # Active bingo game
  /create            # Create game / select sheet
  /join              # Join game via code
  layout.tsx         # Global provider & layout
  page.tsx           # Landing page
/components
  /ui                # Base UI components
  /bingo             # Grid, Cell, Leaderboard
/lib                 # Supabase client, utils
/types               # Shared TS interfaces
```

## 📝 Task Breakdown

### Phase 1: Foundation (P0)

- [ ] Initialize Next.js project in current directory. `agent: orchestrator`
- [ ] Setup Supabase schema (Games, Players, Sheets, Selections).
      `agent: database-architect`
- [ ] Configure Tailwind CSS tokens (extracting from HTML files).
      `agent: frontend-specialist`

### Phase 2: Core Components (P1)

- [ ] **Landing Page**: Convert `landing_page_(mobile)/code.html`.
      `agent: frontend-specialist`
- [ ] **Lobby System**: Convert
      `mobile_lobby_-_fun_background_update/code.html`. Implement real-time
      player list. `agent: frontend-specialist`
- [ ] **Game Creation**: Convert `create_game_(mobile)` variants. Add sheet
      selection logic. `agent: frontend-specialist`

### Phase 3: Game Mechanics (P2)

- [ ] **Bingo Board**: Convert
      `mobile_bingo_card_-_fun_background_update/code.html`. Implement 5x5
      randomization logic. `agent: frontend-specialist`
- [ ] **Selection Logic**: Implement click-to-mark with Supabase Realtime sync.
      `agent: frontend-specialist`
- [ ] **Scoring & Bingo Logic**: Calculate line completions and broadcast
      winner. `agent: frontend-specialist`

### Phase 4: Polish & Advanced Features (P3)

- [ ] **Anti-Cheating Mode**: Implement "2-player mark" logic.
      `agent: backend-specialist`
- [ ] **Premium UI**: Add Framer Motion transitions between screens.
      `agent: frontend-specialist`
- [ ] **UGC Editor**: Basic interface to create/save custom lists.
      `agent: frontend-specialist`

## 🧪 Phase X: Verification

- [ ] Run `python .agent/scripts/checklist.py .`
- [ ] Verify no Purple/Indigo usage (Purple Ban ✅).
- [ ] Test multiplayer flow with two browser tabs.
- [ ] Performance audit: Under 100ms for cell selection update.
