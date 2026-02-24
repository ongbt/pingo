# Pingo: Project Constitution (gemini.md)

## 📋 Data Schemas (JSON)

### Game Payload

```json
{
   "id": "uuid",
   "room_code": "string (6 chars)",
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
   "board_state": "object (5x5 grid)",
   "score": "number",
   "is_winner": "boolean"
}
```

### Sheet Payload (UGC)

```json
{
   "id": "uuid",
   "creator_id": "uuid",
   "title": "string",
   "items": "string[] (min 25 items)",
   "is_default": "boolean",
   "created_at": "timestamp"
}
```

## 📜 Behavioral Rules

1. **Multiplayer Sync**: Hybrid approach. Use **Postgres** for persistent game
   results, sessions, and sheet definitions. Use **Supabase Realtime
   (Channels/Presence)** for transient lobby states (who is joining, ready
   status) and high-frequency game events (marking cells).
2. **Deterministic Logic**: Bingo line checks (Win validation) must be computed
   in a centralized service/edge function to prevent client-side manipulation.
3. **Guest Policy**: Players can join via Room Code without login. A
   session-based anonymous ID will be used.
4. **Host Policy**: Only authenticated users can trigger the `START_GAME` or
   `END_GAME` actions.
5. **Rename Lock**: Players are **NOT allowed** to change their nickname once a
   game has started (status changed from `lobby` to `active`).

## 🏗️ Architectural Invariants

- **React Next.js 15+**: App Router mandatory.
- **Tailwind CSS**: No global CSS except for theme variables.
- **SSR Compatible**: Initial data fetching must be server-side where possible.
- **Edge Deployment**: Game management logic should be edge-compatible (Next.js
  Edge Runtime or Supabase Edge Functions).
- **Deployment**: Frontend on Cloudflare Pages, Backend on Supabase.
- **Testing**: Local development first using Supabase CLI (if available) or
  local environment mocks.
