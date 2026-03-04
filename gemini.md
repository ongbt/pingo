# Pingo: Project Constitution (gemini.md)

## 📋 Data Schemas (JSON)

### Game Payload

```json
{
   "id": "uuid",
   "room_code": "string (6 chars, alphanumeric, curated set)",
   "host_id": "uuid",
   "sheet_id": "uuid",
   "status": "lobby | active | finished",
   "config": {
      "anti_cheating": "boolean",
      "win_condition": "first_bingo | custom"
   },
   "created_at": "timestamp"
}
```

### Player Payload

```json
{
   "id": "uuid",
   "game_id": "uuid",
   "nickname": "string",
   "is_host": "boolean",
   "board_state": "object (5x5 grid — cell index: boolean)",
   "board_layout": "string[] (25 items — shuffled from sheet)",
   "score": "number",
   "is_winner": "boolean"
}
```

### Sheet Payload (UGC)

```json
{
   "id": "uuid",
   "creator_id": "uuid | null",
   "title": "string",
   "items": "string[] (min 25 items)",
   "is_default": "boolean",
   "play_count": "number",
   "created_at": "timestamp"
}
```

### Profile Payload

```json
{
   "id": "uuid (auth.uid)",
   "nickname": "string",
   "updated_at": "timestamp"
}
```

## 📜 Behavioral Rules

1. **Multiplayer Sync**: Hybrid approach. Use **Postgres** for persistent game
   results, sessions, and sheet definitions. Use **Supabase Realtime** for
   transient lobby states (who is joining, ready status) and high-frequency game
   events (marking cells, player deletions).
2. **Deterministic Logic**: Bingo line checks (Win validation) are computed
   client-side against the player's `board_layout` and `board_state`.
3. **Guest Policy**: Players can join via Room Code without login. Anonymous
   session tracked via `localStorage` (player ID).
4. **Host Policy**: Only the game host can trigger `START_GAME` or `END_GAME`
   actions. Host Quit is blocked; they must use End Game instead.
5. **Rename Lock**: Players are **NOT allowed** to change their nickname once a
   game has started (status changed from `lobby` to `active`).
6. **Board Randomization**: Each player's `board_layout` is a unique shuffle of
   the sheet's items. Generated when the host starts the game. The center cell
   is always FREE (index 12).
7. **Player Quit**: Non-host players who quit mid-game are deleted from the
   `player` table. Supabase Realtime broadcasts the DELETE event to all
   remaining players (requires `REPLICA IDENTITY FULL` on the `player` table).
8. **Custom Sheets (Guest)**: Custom sheets created by guest users are stored in
   `localStorage`. When creating a game, the host's custom sheet is inserted
   into Supabase ephemerally with `creator_id = NULL` and `is_default = false`.

## 🏗️ Architectural Invariants

- **Framework**: React 18 + Vite (migrated from Next.js 15 on 2026-02-25).
- **Routing**: `react-router-dom` v6 — client-side only, no SSR.
- **Tailwind CSS**: Utility-first styling; no global CSS except base resets.
- **Deployment**: Frontend on **Cloudflare Pages** (Vite SPA), Backend on
  **Supabase Cloud**.
- **Environment Variables**: All client-side variables use `VITE_` prefix (e.g.,
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **SPA Routing**: `public/_redirects` contains `/* /index.html 200` for
  Cloudflare Pages to handle client-side navigation.
- **Testing**: Local development first using Convex CLI .

## 🗃️ Migration History

| Migration                                         | Description                               |
| ------------------------------------------------- | ----------------------------------------- |
| `20260224012031_initial_schema.sql`               | `game`, `player`, `sheet` tables + RLS    |
| `20260224_add_board_layout.sql`                   | `board_layout` column on `player`         |
| `20260224_add_profile.sql`                        | `profile` table for nickname persistence  |
| `20260225110000_player_replica_identity_full.sql` | `REPLICA IDENTITY FULL` on `player`       |
| `20260225111000_allow_custom_sheet_select.sql`    | RLS fix: allow `creator_id IS NULL` reads |
